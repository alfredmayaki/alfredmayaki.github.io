const NON_STREAM_TIMEOUT_MS = 25000;
const STREAM_TIMEOUT_MS = 120000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

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
  return String(env?.AI_MODEL || 'claude-3-5-haiku-20241022').trim();
}

function getAIProvider(env) {
  return String(env?.AI_PROVIDER || 'anthropic').trim().toLowerCase();
}

// Extract text from different file types
function extractTextFromFile(fileContent, fileName) {
  const extension = fileName.toLowerCase().split('.').pop();
  
  try {
    // For text-based files
    if (['txt', 'md', 'json', 'csv', 'log'].includes(extension)) {
      return fileContent;
    }
    
    // For other files, return base64 or inform user
    return `[${extension.toUpperCase()} file: ${fileName}]\n\nNote: Binary files are not fully supported. Please provide text-based files for best results.`;
  } catch (error) {
    return `Error reading file: ${error.message}`;
  }
}

async function callAnthropicAPI(env, message, history = [], documentContext = null) {
  const model = getAIModel(env);
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

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
  
  // Add document context if provided
  let finalMessage = message;
  if (documentContext) {
    finalMessage = `[DOCUMENT CONTEXT]\n${documentContext}\n\n[USER QUESTION]\n${message}\n\nPlease analyze the document context above and answer the user's question based on it.`;
  }
  
  messages.push({
    role: 'user',
    content: finalMessage
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

    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify([...response.headers.entries()]));

    const responseText = await response.text().catch(() => '');
    console.log('Response Body:', responseText);

    if (!response.ok) {
      let errorDetail = responseText;
      try {
        const errorData = JSON.parse(responseText);
        errorDetail = JSON.stringify(errorData, null, 2);
      } catch {
        // Use raw text if not JSON
      }
      
      console.error('Anthropic API Error Response:', errorDetail);
      throw new Error(`Anthropic API error: ${response.status} - ${errorDetail}`);
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

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

      // Parse request body
      const contentType = request.headers.get('content-type') || '';
      let payload;
      let documentContext = null;

      if (contentType.includes('multipart/form-data')) {
        // Handle file upload
        const formData = await request.formData();
        const message = formData.get('message');
        const file = formData.get('file');
        const history = formData.get('history');

        if (!message) {
          return json({ reply: 'Please type a message.' }, 200);
        }

        // Process uploaded file
        if (file && file.size > 0) {
          if (file.size > MAX_FILE_SIZE) {
            return json({ 
              reply: 'File too large. Maximum size is 5MB.' 
            }, 400);
          }

          const fileName = file.name;
          const fileContent = await file.text();
          documentContext = extractTextFromFile(fileContent, fileName);
          
          console.log('File uploaded:', fileName, 'Size:', file.size);
        }

        payload = {
          message: message,
          history: history ? JSON.parse(history) : [],
          documentContext: documentContext
        };
      } else {
        // Handle regular JSON request
        payload = await request.json().catch(() => ({}));
      }

      const message = String(payload.message || '').trim();
      const history = payload.history || [];
      const docContext = payload.documentContext || null;

      if (!message) {
        return json({ reply: 'Please type a message.' }, 200);
      }

      const provider = getAIProvider(env);
      console.log('Provider:', provider);

      if (provider === 'anthropic') {
        if (!env.ANTHROPIC_API_KEY) {
          return json({ 
            reply: 'Server is missing ANTHROPIC_API_KEY. Please set it in Cloudflare dashboard.' 
          }, 500);
        }

        try {
          const reply = await callAnthropicAPI(env, message, history, docContext);
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