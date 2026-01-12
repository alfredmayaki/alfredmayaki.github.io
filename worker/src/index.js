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
  }

  // Convert history to Anthropic format
  // Anthropic requires alternating user/assistant messages
  const messages = [];
  
  // Process history and ensure proper alternation
  if (history && history.length > 0) {
    let lastRole = null;
    
    for (const item of history) {
      const role = item.role === 'bot' ? 'assistant' : 'user';
      
      // Skip consecutive messages from the same role (merge them if needed)
      if (role === lastRole && messages.length > 0) {
        // Append to previous message
        messages[messages.length - 1].content += '\n' + item.text;
      } else {
        messages.push({
          role: role,
          content: item.text
        });
        lastRole = role;
      }
    }
    
    // If history ends with assistant message, we can add the new user message
    // If history ends with user message, we need to remove it (will add current message)
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      // Merge the last user message with the current one
      const lastUserMessage = messages.pop();
      message = lastUserMessage.content + '\n' + message;
    }
  }
  
  // Add current message
  messages.push({
    role: 'user',
    content: message
  });

  const body = {
    model: model,
    max_tokens: 4096,
    messages: messages
  };

  console.log('Anthropic API Request:', JSON.stringify(body, null, 2));

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

    const responseText = await response.text().catch(() => '');

    if (!response.ok) {
      console.error('Anthropic API Error Response:', responseText);
      throw new Error(`Anthropic API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    // Extract text from Claude's response
    const text = data?.content?.[0]?.text || '';
    
    if (!text) {
      return `No response. Stop reason: ${data?.stop_reason || 'unknown'}`;
    }

    return text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
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

      if (provider === 'anthropic') {
        if (!env.ANTHROPIC_API_KEY) {
          return json({ reply: 'Server is missing ANTHROPIC_API_KEY. Please set it in Cloudflare dashboard.' }, 500);
        }

        try {
          const reply = await callAnthropicAPI(env, message, history);
          return json({ reply }, 200);
        } catch (error) {
          console.error('Anthropic API Error:', error);
          return json({ 
            reply: `Error calling Claude API: ${error.message}` 
          }, 500);
        }
      } else {
        // If you want Gemini fallback, implement callGeminiAPI here
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