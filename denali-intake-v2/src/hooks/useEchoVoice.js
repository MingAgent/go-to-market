import { useRef, useCallback, useState } from 'react';

/**
 * useEchoVoice — Inworld TTS via server-side proxy.
 *
 * The API key stays on the server (api/tts.js). This hook only calls
 * /api/tts with the text to speak. Returns { speak, stop, isSpeaking, isLoading }.
 */
export function useEchoVoice() {
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cleanup = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    cleanup();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanup]);

  const speak = useCallback(async (text, { onStart, onEnd, speakingRate = 1 } = {}) => {
    // Stop any current playback
    stop();

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    try {
      // Call our server-side proxy — no API key in the client
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speakingRate }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `TTS error: ${response.status}`);
      }

      // Collect streamed chunks into a single blob
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Check if aborted during stream
      if (controller.signal.aborted) return;

      // Create audio blob and play
      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsSpeaking(true);
        onStart?.();
      };

      audio.onended = () => {
        setIsSpeaking(false);
        cleanup();
        audioRef.current = null;
        onEnd?.();
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        cleanup();
        audioRef.current = null;
        onEnd?.();
      };

      await audio.play();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[EchoVoice] TTS error:', err.message);
      }
      setIsSpeaking(false);
      setIsLoading(false);
    }
  }, [stop, cleanup]);

  return { speak, stop, isSpeaking, isLoading };
}
