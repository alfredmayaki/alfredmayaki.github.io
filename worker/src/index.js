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

async function callGeminiNonStreaming(env, message) {
  const model = getGeminiModel(env);
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: message }] }]
    })
  });

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
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }]
        })
      });

      if (!upstream.ok || !upstream.body) {
        const err = await upstream.text().catch(() => '');
        await writeEvent({ error: `Upstream error: ${upstream.status} ${err}` });
        await finish();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let evt;
          try {
            evt = JSON.parse(trimmed);
          } catch {
            continue;
          }

          const parts = evt?.candidates?.[0]?.content?.parts;
          const delta = Array.isArray(parts)
            ? parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('')
            : '';

          if (delta) {
            await writeEvent({ delta });
          }
        }
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