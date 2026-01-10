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
  const raw = String(env?.GEMINI_API_VERSION || 'v1').trim().toLowerCase() || 'v1';
  if (raw === 'v1' || raw === 'v1beta') return raw;

  // Fail fast: avoids confusing upstream 404s when the base path is invalid.
  throw new Error(
    `Unsupported GEMINI_API_VERSION "${raw}". Supported values are "v1" and "v1beta".`
  );
}

function isPalmChatBisonModel(model) {
  const normalized = String(model || '').trim();
  return normalized === 'chat-bison-001' || normalized === 'models/chat-bison-001';
}

function normalizeModelName(model) {
  const normalized = String(model || '').trim();
  if (!normalized) return normalized;
  return normalized.startsWith('models/') ? normalized.slice('models/'.length) : normalized;
}

function buildGeminiEndpoint(env, model, method) {
  const version = getGeminiVersion(env);
  const normalizedModel = normalizeModelName(model);
  return `https://generativelanguage.googleapis.com/${version}/models/${normalizedModel}:${method}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
}

function buildPalmChatEndpoint(env, method) {
  const model = 'chat-bison-001';
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
}

function buildGeminiRequestInit(body, signal) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept-encoding': 'gzip, br'
    },
    body: JSON.stringify(body),
    signal,
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

async function callPalmChatNonStreaming(env, message) {
  const endpoint = buildPalmChatEndpoint(env, 'generateMessage');

  const body = {
    prompt: {
      messages: [{ author: 'user', content: message }]
    }
  };

  const resp = await fetchWithTimeout(endpoint, buildGeminiRequestInit(body), NON_STREAM_TIMEOUT_MS);

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`PaLM error: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  const text = String(data?.candidates?.[0]?.content || '').trim();
  return text || 'No response.';
}

async function callGeminiNonStreaming(env, message) {
  const model = getGeminiModel(env);

  if (isPalmChatBisonModel(model)) {
    return callPalmChatNonStreaming(env, message);
  }

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

      if (isPalmChatBisonModel(model)) {
        await writeEvent({ error: 'Streaming is not supported for chat-bison-001. Use stream=false.' });
        await finish();
        return;
      }

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

    // Trigger version validation early so misconfig returns a clear error.
    try {
      getGeminiVersion(env);
    } catch (e) {
      return json({ reply: String(e?.message || e) }, 400);
    }

    const model = getGeminiModel(env);
    if (stream && isPalmChatBisonModel(model)) {
      return json({ reply: 'Streaming is not supported for chat-bison-001. Set stream=false.' }, 400);
    }

    if (!stream) {
      const reply = await callGeminiNonStreaming(env, message);
      return json({ reply }, 200);
    }

    return streamGeminiAsSse(env, message);
  }
};