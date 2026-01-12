const NON_STREAM_TIMEOUT_MS = 25000;
const STREAM_TIMEOUT_MS = 120000;

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

function getAIModel(env) {
  return String(env?.AI_MODEL || 'claude-3-5-sonnet-20241022').trim();
}

function getAIProvider(env) {
  return String(env?.AI_PROVIDER || 'anthropic').trim().toLowerCase();
}

async function callAnthropicAPI(env, message, history = []) {
  const model = getAIModel(env);
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }wrangler secre

  // Log API key format for debugging (safely)
  const keyStart = apiKey.substring(0, 10);
  const keyEnd = apiKey.substring(apiKey.length - 4);
  console.log('API Key format:', keyStart + '...' + keyEnd);
  console.log('API Key length:', apiKey.length);
  console.log('Model:', model);

  // Convert history to Anthropic format
  const messages = [];
  
  // Process history and ensure proper alternation
  if (history && history.length > 0) {
    let lastRole = null;
    
    for (const item of history) {
      const role = item.role === 'bot' ? 'assistant' : 'user';
      
      if (role === lastRole && messages.length > 0) {
        messages[messages.length - 1].content += '\n' + item.text;
      } else {
        messages.push({
          role: role,
          content: item.text
        });
        lastRole = role;
      }
    }
    
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMessage = messages.pop();
      message = lastUserMessage.content + '\n' + message;
    }
  }
  
  messages.push({
    role: 'user',
    content: message
  });

  const body = {
    model: model,
    max_tokens: 4096,
    messages: messages
  };

  console.log('Request body:', JSON.stringify(body, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), NON_STREAM_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    const responseText = await response.text().catch(() => '');
    console.log('Response body length:', responseText.length);
    console.log('Response body:', responseText.substring(0, 500)); // First 500 chars

    if (!response.ok) {
      let errorDetail = 'No error details';
      try {
        const errorData = JSON.parse(responseText);
        errorDetail = JSON.stringify(errorData, null, 2);
        console.error('Parsed error:', errorDetail);
      } catch (e) {
        console.error('Could not parse error response');
        errorDetail = responseText || 'Empty response';
      }
      
      throw new Error(`Anthropic API error: ${response.status} - ${errorDetail}`);
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error('Failed to parse success response:', e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    const text = data?.content?.[0]?.text || '';
    
    if (!text) {
      console.warn('No text in response:', JSON.stringify(data));
      return `No response. Stop reason: ${data?.stop_reason || 'unknown'}`;
    }

    console.log('Success! Response length:', text.length);
    return text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    console.error('callAnthropicAPI error:', error);
    throw error;
  }
}

export default {
  async fetch(request, env) {
    try {
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
      const history = payload.history || [];

      if (!message) {
        return json({ reply: 'Please type a message.' }, 200);
      }

      const provider = getAIProvider(env);
      console.log('Provider:', provider);

      if (provider === 'anthropic') {
        if (!env.ANTHROPIC_API_KEY) {
          return json({ reply: 'Server is missing ANTHROPIC_API_KEY. Please set it in Cloudflare dashboard.' }, 500);
        }

        try {
          const reply = await callAnthropicAPI(env, message, history);
          return json({ reply }, 200);
        } catch (error) {
          console.error('Anthropic API Error:', error.message);
          console.error('Error stack:', error.stack);
          return json({ 
            reply: `Error calling Claude API: ${error.message}` 
          }, 500);
        }
      } else {
        return json({ reply: 'Only Anthropic provider is configured.' }, 400);
      }

    } catch (error) {
      console.error('Worker Error:', error);
      return json({ 
        reply: `Worker error: ${error.message}` 
      }, 500);
    }
  }
};