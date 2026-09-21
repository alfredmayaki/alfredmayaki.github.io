// Client-side TTS helper for chatbot popup.
// Usage: speakText(botReplyText);

export async function speakText(text) {
  if (!text || !text.trim()) return;
  const utteranceText = String(text);

  // 1) Prefer native browser TTS (instant, low-latency)
  if ('speechSynthesis' in window) {
    try {
      const utter = new SpeechSynthesisUtterance(utteranceText);
      // Customize voice / lang / rate / pitch as needed:
      utter.lang = 'en-US';
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.cancel(); // stop previous audio
      window.speechSynthesis.speak(utter);
      return;
    } catch (err) {
      // fallthrough to server TTS
      console.warn('Browser TTS failed, falling back to server TTS', err);
    }
  }

  // 2) Fallback: request server TTS (Deepgram via /tts)
  try {
    const res = await fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: utteranceText })
    });

    if (!res.ok) {
      console.error('Server TTS failed:', res.status, await res.text());
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(err => console.error('Play error', err));
    // optional: revoke after playback
    audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  } catch (err) {
    console.error('TTS request failed:', err);
  }
}