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

    if (!stream) {
      const reply = await nonStreamingReply(env, message);
      return json({ reply }, 200);
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const writeLine = async (line) => writer.write(encoder.encode(line));
    const writeEvent = async (obj) => writeLine(`data: ${JSON.stringify(obj)}\n\n`);
    const done = async () => {
      await writeLine('data: [DONE]\n\n');
      await writer.close();
    };

    (async () => {
      try {
        const upstream = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            stream: true,
            input: [
              {
                role: 'system',
                content: [{ type: 'text', text: 'You are the website assistant. Be concise and helpful.' }]
              },
              {
                role: 'user',
                content: [{ type: 'text', text: message }]
              }
            ]
          })
        });

        if (!upstream.ok || !upstream.body) {
          const err = await upstream.text().catch(() => '');
          await writeEvent({ error: `Upstream error: ${upstream.status} ${err}` });
          await done();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done: readDone } = await reader.read();
          if (readDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const data = trimmed.slice(5).trim();
            if (!data || data === '[DONE]') continue;

            let evt;
            try {
              evt = JSON.parse(data);
            } catch {
              continue;
            }

            // Responses streaming: common delta event shape
            // Example: { "type":"response.output_text.delta", "delta":"..." }
            if (evt?.type === 'response.output_text.delta' && typeof evt?.delta === 'string') {
              await writeEvent({ delta: evt.delta });
            }

            // Final text (optional)
            if (evt?.type === 'response.output_text.done' && typeof evt?.text === 'string') {
              // You can ignore this or use it to ensure final formatting.
            }

            // Error (optional)
            if (evt?.type === 'error' && typeof evt?.message === 'string') {
              await writeEvent({ error: evt.message });
              await done();
              return;
            }
          }
        }

        await done();
      } catch (e) {
        await writeEvent({ error: String(e?.message || e) });
        await done();
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
};

async function nonStreamingReply(env, message) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: [{ type: 'text', text: 'You are the website assistant. Be concise and helpful.' }] },
        { role: 'user', content: [{ type: 'text', text: message }] }
      ]
    })
  });

  const data = await response.json();

  // Minimal extraction: first output_text
  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (c?.type === 'output_text' && typeof c?.text === 'string') return c.text;
    }
  }
  return 'No response.';
}

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