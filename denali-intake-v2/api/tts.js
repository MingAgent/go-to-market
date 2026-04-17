/**
 * Vercel Serverless Function — Inworld TTS Proxy
 *
 * Keeps the Inworld API key server-side. The client sends { text }
 * and gets back streamed audio/mpeg. Deployed automatically by Vercel
 * when it discovers the api/ directory.
 *
 * Required env var: INWORLD_API_KEY (Base64-encoded Basic auth token)
 * Set in Vercel Dashboard > Settings > Environment Variables
 */

// Inworld voice + model defaults (Echo / Lauren voice)
const INWORLD_VOICE_ID = 'Lauren';
const INWORLD_MODEL = 'inworld-tts-1.5-max';
const INWORLD_URL = 'https://api.inworld.ai/tts/v1/voice:stream';

// Max text length to prevent abuse
const MAX_TEXT_LENGTH = 2000;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  const apiKey = process.env.INWORLD_API_KEY;
  if (!apiKey) {
    console.error('[TTS] INWORLD_API_KEY not configured');
    return res.status(500).json({ error: 'TTS service not configured' });
  }

  // Parse and validate input
  const { text, speakingRate = 1, temperature = 1 } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty "text" field' });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: `Text exceeds ${MAX_TEXT_LENGTH} character limit` });
  }

  const rate = Math.min(Math.max(Number(speakingRate) || 1, 0.5), 2);
  const temp = Math.min(Math.max(Number(temperature) || 1, 0), 2);

  try {
    const response = await fetch(INWORLD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        voice_id: INWORLD_VOICE_ID,
        audio_config: {
          audio_encoding: 'MP3',
          speaking_rate: rate,
        },
        temperature: temp,
        model_id: INWORLD_MODEL,
      }),
    });

    if (!response.ok) {
      // Log the real error server-side, return generic message to client
      const errBody = await response.text().catch(() => '');
      console.error(`[TTS] Inworld returned ${response.status}: ${errBody}`);
      return res.status(502).json({ error: 'TTS generation failed' });
    }

    // Inworld streaming endpoint returns newline-delimited JSON, where each
    // chunk contains base64-encoded audio in result.audioContent or audioContent.
    // We collect all chunks, decode them, and send raw MP3 bytes to the client.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const audioChunks = [];
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process complete JSON lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          const b64 = parsed?.result?.audioContent || parsed?.audioContent;
          if (b64) {
            audioChunks.push(Buffer.from(b64, 'base64'));
          }
        } catch {
          // Skip non-JSON lines (e.g. empty lines, delimiters)
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        const b64 = parsed?.result?.audioContent || parsed?.audioContent;
        if (b64) {
          audioChunks.push(Buffer.from(b64, 'base64'));
        }
      } catch {
        // Ignore trailing non-JSON
      }
    }

    if (audioChunks.length === 0) {
      console.error('[TTS] No audio content in Inworld response');
      return res.status(502).json({ error: 'TTS generation returned no audio' });
    }

    // Send decoded MP3 audio to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    for (const chunk of audioChunks) {
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    console.error('[TTS] Proxy error:', err.message);
    // Only return generic error — never leak internals
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal TTS error' });
    }
    res.end();
  }
}
