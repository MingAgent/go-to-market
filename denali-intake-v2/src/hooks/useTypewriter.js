import { useRef, useCallback } from 'react';
import { TW_SPEED } from '../config';

/**
 * Typewriter hook — types text character by character.
 * Returns { typewrite, skipRef }
 * - typewrite(setText, text, speed) returns a promise
 * - skipRef.current = true instantly completes the current line
 * Click-to-skip: set skipRef.current = true from a click handler
 */
export function useTypewriter() {
  const skipRef = useRef(false);

  const typewrite = useCallback((setText, text, speed = TW_SPEED) => {
    return new Promise((resolve) => {
      skipRef.current = false;
      let i = 0;

      function tick() {
        if (skipRef.current || i >= text.length) {
          setText(text);
          resolve();
          return;
        }
        i++;
        setText(text.substring(0, i));
        setTimeout(tick, speed);
      }
      tick();
    });
  }, []);

  return { typewrite, skipRef };
}
