// drop this before </body> or merge into existing client script
(async function () {
  const fileInput = document.getElementById('docUploadInput');
  if (!fileInput) return;

  window.uploadedDocs = window.uploadedDocs || [];

  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const form = new FormData();
      form.append('file', f);
      try {
        const resp = await fetch('/api/upload', { method: 'POST', body: form });
        const json = await resp.json();
        if (resp.ok && json.text) {
          window.uploadedDocs.push({ name: json.filename, text: json.text });
          // Optional: update UI with status
          window.__updateUploadStatus?.(json.filename, 'Ready');
        } else {
          window.__updateUploadStatus?.(f.name, 'Failed');
        }
      } catch (err) {
        console.warn('upload client error', err);
        window.__updateUploadStatus?.(f.name, 'Error');
      }
    }

    // signal to search handler that docs are available (if needed)
    if (typeof window.onUploadedDocsReady === 'function') window.onUploadedDocsReady(window.uploadedDocs);

    // clear selection
    e.target.value = '';
  });
})();

// After user selects file(s) -> upload each file, store extracted text, then optionally send prompt
async function uploadAndPrompt(file) {
  // 1) upload/extract
  const form = new FormData();
  form.append('file', file);

  const upResp = await fetch('/api/upload', { method: 'POST', body: form });
  const upJson = await upResp.json();
  if (!upResp.ok || !upJson.text) {
    console.warn('Extraction failed', upResp.status, upJson);
    return;
  }

  const extracted = upJson.text; // server-extracted text
  // store for later or immediate prompt
  window.uploadedDocs = window.uploadedDocs || [];
  window.uploadedDocs.push({ name: upJson.filename || file.name, text: extracted });

  // 2) assemble prompt (trim/summarize as needed)
  const prompt = `Use the following extracted document as context:\n\n--- ${file.name} ---\n${extracted.slice(0, 3000)}\n\nAnswer the user's question: ${userQuery || 'Please summarise.'}`;

  // 3) call chat/claude endpoint that proxies to Claude
  const chatResp = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-opus-4.5', prompt })
  });
  const chatJson = await chatResp.json().catch(() => ({}));
  console.log('Claude reply', chatJson.reply || chatJson);

  // If server implements /chat to accept file uploads:
  const form = new FormData();
  form.append('file', file);
  form.append('query', userQuery);

  const resp = await fetch('/chat', { method: 'POST', body: form });
  const json = await resp.json();
  console.log('chat reply', json.reply);
}