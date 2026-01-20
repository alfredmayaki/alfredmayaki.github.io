import Anthropic from "@anthropic-ai/sdk";

const NON_STREAM_TIMEOUT_MS = 25000;
const STREAM_TIMEOUT_MS = 120000;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB limit

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" }
  });
}

function getAIModel(env) {
  return String(env?.AI_MODEL || "claude-opus-4-5-20251101").trim();
}

function getAIProvider(env) {
  return String(env?.AI_PROVIDER || "anthropic").trim().toLowerCase();
}

// Extract text from PDF (simple text extraction)
async function extractTextFromPDF(arrayBuffer) {
  try {
    const text = new TextDecoder("utf-8").decode(arrayBuffer);

    // Extract text between stream objects (simple PDF text extraction)
    const matches = text.match(/\(([^)]+)\)/g);
    if (matches) {
      return matches.map((m) => m.replace(/[()]/g, "")).join(" ");
    }

    // Fallback: try to extract any readable text
    const readableText = text.replace(/[^\x20-\x7E\n]/g, " ").trim();
    if (readableText.length > 100) {
      return readableText;
    }

    return "PDF content detected but text extraction failed. Please try converting to .txt or .md format for better results.";
  } catch (error) {
    return `Error extracting PDF text: ${error.message}`;
  }
}

// Extract text from DOCX (XML-based)
async function extractTextFromDOCX(arrayBuffer) {
  try {
    const text = new TextDecoder("utf-8").decode(arrayBuffer);

    // DOCX is a ZIP file containing XML. Look for document.xml content
    const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (matches) {
      return matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
    }

    // Try alternative extraction
    const paraMatches = text.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);
    if (paraMatches) {
      return paraMatches.map((p) => p.replace(/<[^>]+>/g, " ").trim()).join("\n\n");
    }

    return "DOCX content detected but text extraction failed. Please try converting to .txt or .md format for better results.";
  } catch (error) {
    return `Error extracting DOCX text: ${error.message}`;
  }
}

// Extract text from different file types
async function extractTextFromFile(file, fileName) {
  const extension = fileName.toLowerCase().split(".").pop();

  try {
    // For text-based files
    if (["txt", "md", "json", "csv", "log"].includes(extension)) {
      const text = await file.text();
      return text;
    }

    // For PDF files
    if (extension === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractTextFromPDF(arrayBuffer);
      return `[PDF Document: ${fileName}]\n\n${extractedText}`;
    }

    // For DOCX files
    if (extension === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractTextFromDOCX(arrayBuffer);
      return `[Word Document: ${fileName}]\n\n${extractedText}`;
    }

    // For other files
    return `[${extension.toUpperCase()} file: ${fileName}]\n\nNote: This file type requires conversion to .txt, .md, .pdf, or .docx for analysis.`;
  } catch (error) {
    return `Error reading file: ${error.message}`;
  }
}

async function callAnthropicAPI(env, message, history = [], documentContext = null) {
  const model = getAIModel(env);
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  // Convert history to Anthropic format
  const messages = [];

  // Process history and ensure proper alternation
  if (history && history.length > 0) {
    let lastRole = null;

    for (const item of history) {
      const role = item.role === "bot" ? "assistant" : "user";

      if (role === lastRole && messages.length > 0) {
        messages[messages.length - 1].content += "\n" + item.text;
      } else {
        messages.push({
          role: role,
          content: item.text
        });
        lastRole = role;
      }
    }

    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      const lastUserMessage = messages.pop();
      message = lastUserMessage.content + "\n" + message;
    }
  }

  // Add document context if provided
  let finalMessage = message;
  if (documentContext) {
    finalMessage = `[DOCUMENT CONTEXT]\n${documentContext}\n\n[USER QUESTION]\n${message}\n\nPlease analyze the document context above and answer the user's question based on it.`;
  }

  messages.push({
    role: "user",
    content: finalMessage
  });

  const body = {
    model: model,
    max_tokens: 4096,
    messages: messages
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), NON_STREAM_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text().catch(() => "");
    if (!response.ok) {
      let errorDetail = responseText;
      try {
        const errorData = JSON.parse(responseText);
        errorDetail = JSON.stringify(errorData, null, 2);
      } catch {
        // Use raw text if not JSON
      }

      throw new Error(`Anthropic API error: ${response.status} - ${errorDetail}`);
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    const text = data?.content?.[0]?.text || "";
    if (!text) {
      return `No response. Stop reason: ${data?.stop_reason || "unknown"}`;
    }

    return text;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // TTS endpoint: POST /tts  -> accepts JSON { text: "..." } or form-data text
      if (url.pathname === "/tts") {
        if (request.method === "OPTIONS") {
          return new Response(null, { headers: corsHeaders() });
        }
        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
        }

        if (!env.AI) {
          return json({ error: "AI binding is not configured on this Worker." }, 500);
        }

        // parse incoming text
        const contentType = request.headers.get("content-type") || "";
        let textInput = "";
        if (contentType.includes("application/json")) {
          const data = await request.json().catch(() => ({}));
          textInput = String(data.text || data.message || "").trim();
        } else if (contentType.includes("multipart/form-data")) {
          const fd = await request.formData();
          textInput = String(fd.get("text") || fd.get("message") || "").trim();
        } else {
          // plain text body
          textInput = (await request.text()).trim();
        }

        if (!textInput) {
          return json({ error: "No text provided for TTS." }, 400);
        }

        try {
          // Call Cloudflare Workers AI binding (Deepgram Aura-2)
          const audioResponse = await env.AI.run("@cf/deepgram/aura-2-en", { text: textInput });

          // audioResponse will be an ArrayBuffer-like response from the binding.
          return new Response(audioResponse, {
            status: 200,
            headers: { ...corsHeaders(), "Content-Type": "audio/mpeg" }
          });
        } catch (err) {
          console.error("TTS error:", err);
          return json({ error: `TTS generation failed: ${err.message}` }, 500);
        }
      }

      // Existing chat route continues below
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders() });
      }

      if (url.pathname !== "/chat") {
        return new Response("Not found", { status: 404, headers: corsHeaders() });
      }

      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
      }

      // Parse request body
      const contentType = request.headers.get("content-type") || "";
      let payload;
      let documentContext = null;

      if (contentType.includes("multipart/form-data")) {
        // Handle file upload
        const formData = await request.formData();
        const message = formData.get("message");
        const file = formData.get("file");
        const history = formData.get("history");

        if (!message) {
          return json({ reply: "Please type a message." }, 200);
        }

        // Process uploaded file
        if (file && file.size > 0) {
          if (file.size > MAX_FILE_SIZE) {
            return json({
              reply: "File too large. Maximum size is 1MB."
            }, 400);
          }

          const fileName = file.name;
          documentContext = await extractTextFromFile(file, fileName);
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

      const message = String(payload.message || "").trim();
      const history = payload.history || [];
      const docContext = payload.documentContext || null;

      if (!message) {
        return json({ reply: "Please type a message." }, 200);
      }

      const provider = getAIProvider(env);

      if (provider === "anthropic") {
        if (!env.ANTHROPIC_API_KEY) {
          return json({
            reply: "Server is missing ANTHROPIC_API_KEY. Please set it in Cloudflare dashboard."
          }, 500);
        }

        try {
          const reply = await callAnthropicAPI(env, message, history, docContext);
          return json({ reply }, 200);
        } catch (error) {
          console.error("Anthropic API Error:", error.message);
          return json({
            reply: `Error calling Claude API: ${error.message}`
          }, 500);
        }
      } else {
        return json({ reply: "Only Anthropic provider is configured." }, 400);
      }
    } catch (error) {
      console.error("Worker Error:", error);
      return json({
        reply: `Worker error: ${error.message}`
      }, 500);
    }
  }
};