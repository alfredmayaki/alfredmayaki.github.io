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
      const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are the website assistant. Be concise and helpful.' },
          { role: 'user', content: message }
        ]
      });

      const reply = String(result?.response || result?.output_text || result?.text || '').trim() || JSON.stringify(result);
      return json({ reply }, 200);
    }

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
        const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          stream: true,
          messages: [
            { role: 'system', content: 'You are the website assistant. Be concise and helpful.' },
            { role: 'user', content: message }
          ]
        });

        for await (const chunk of result) {
          const delta =
            (typeof chunk === 'string' ? chunk : null) ||
            chunk?.response ||
            chunk?.delta ||
            chunk?.text ||
            '';

          if (delta) {
            await writeEvent({ delta: String(delta) });
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