const NON_STREAM_TIMEOUT_MS = 25_000;
const STREAM_TIMEOUT_MS = 120_000;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}

function getGeminiModel(env) {
  return String(env?.GEMINI_MODEL || 'gemini-1.5-flash').trim() || 'gemini-1.5-flash';
}

function getGeminiVersion(env) {
  return String(env?.GEMINI_API_VERSION || 'v1').trim() || 'v1';
}

function buildGeminiEndpoint(env, model, method) {
  const version = getGeminiVersion(env);
  return `https://generativelanguage.googleapis.com/${version}/models/${model}:${method}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
}

function buildGeminiRequestInit(body, signal) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // Helps reduce upstream bandwidth when supported.
      'accept-encoding': 'gzip, br'
    },
    body: JSON.stringify(body),
    signal,
    // Makes behavior explicit; avoids any accidental caching.
    cf: { cacheTtl: 0 }
  };
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);

  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGeminiNonStreaming(env, message) {
  const model = getGeminiModel(env);
  const endpoint = buildGeminiEndpoint(env, model, 'generateContent');

  const body = {
    contents: [{ role: 'user', parts: [{ text: message }] }]
  };

  const resp = await fetchWithTimeout(
    endpoint,
    buildGeminiRequestInit(body),
    NON_STREAM_TIMEOUT_MS
  );

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Gemini error: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('')
    : '';

  return text || 'No response.';
}

function streamGeminiAsSse(env, message) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const write = (s) => writer.write(encoder.encode(s));
  const writeEvent = (obj) => write(`data: ${JSON.stringify(obj)}\n\n`);
  const finish = async () => {
    await write('data: [DONE]\n\n');
    await writer.close();
  };

  (async () => {
    try {
      const model = getGeminiModel(env);
      const endpoint = buildGeminiEndpoint(env, model, 'streamGenerateContent');

      const body = {
        contents: [{ role: 'user', parts: [{ text: message }] }]
      };

      const upstream = await fetchWithTimeout(
        endpoint,
        buildGeminiRequestInit(body),
        STREAM_TIMEOUT_MS
      );

      if (!upstream.ok || !upstream.body) {
        const err = await upstream.text().catch(() => '');
        await writeEvent({ error: `Upstream error: ${upstream.status} ${err}` });
        await finish();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      const processLine = async (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Gemini streams are commonly SSE-like: "data: {...}"
        const jsonText = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
        if (!jsonText || jsonText === '[DONE]') return;

        let evt;
        try {
          evt = JSON.parse(jsonText);
        } catch {
          return;
        }

        const parts = evt?.candidates?.[0]?.content?.parts;
        const delta = Array.isArray(parts)
          ? parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('')
          : '';

        if (delta) {
          await writeEvent({ delta });
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          await processLine(line);
        }
      }

      // Process leftover (no trailing newline)
      if (buffer.trim()) {
        await processLine(buffer);
      }

      await finish();
    } catch (e) {
      await writeEvent({ error: String(e?.message || e) });
      await finish();
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname !== '/chat') {
      return new Response('Not found', { status: 404, headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    const payload = await request.json().catch(() => ({}));
    const message = String(payload.message || '').trim();
    const stream = payload.stream === true;

    if (!message) {
      return json({ reply: 'Please type a message.' }, 200);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ reply: 'Server is missing GEMINI_API_KEY.' }, 500);
    }

    if (!stream) {
      const reply = await callGeminiNonStreaming(env, message);
      return json({ reply }, 200);
    }

    return streamGeminiAsSse(env, message);
  }
};