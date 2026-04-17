import { useState, useRef, useCallback, useEffect } from 'react';
import { VAPI_PUBLIC_KEY, PHASES } from '../config';

/**
 * Vapi SDK hook — lazy-loads the CDN script tag SDK.
 * Returns { start, stop, callActive, orbState, caption, log entries }
 */
export function useVapi() {
  const vapiRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [orbState, setOrbState] = useState('idle');
  const [caption, setCaption] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((msg, type = '') => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev.slice(-200), { ts, msg, type }]);
    console.log(`[${type || 'info'}] ${msg}`);
  }, []);

  // Load SDK on first call
  const loadSDK = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (ready && vapiRef.current) { resolve(); return; }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js';
      script.defer = true;
      script.async = true;

      script.onload = () => {
        try {
          vapiRef.current = window.vapiSDK.run({
            apiKey: VAPI_PUBLIC_KEY,
            assistant: PHASES[1].id,
            config: {
              position: 'bottom-right',
              idle: { color: 'transparent', type: 'round', icon: '' },
              loading: { color: 'transparent', type: 'round', icon: '' },
              active: { color: 'transparent', type: 'round', icon: '' },
            },
          });
          setReady(true);
          addLog('Vapi SDK loaded', 'event');
          resolve();
        } catch (e) {
          addLog(`SDK init error: ${e.message}`, 'error');
          reject(e);
        }
      };

      script.onerror = () => {
        addLog('Failed to load Vapi CDN script', 'error');
        reject(new Error('CDN load failed'));
      };

      document.body.appendChild(script);
    });
  }, [ready, addLog]);

  // Wire events whenever vapi instance changes
  useEffect(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    const onCallStart = () => {
      setCallActive(true);
      setOrbState('listening');
      addLog('Call started', 'event');
    };
    const onCallEnd = () => {
      setCallActive(false);
      setOrbState('processing');
      addLog('Call ended', 'event');
      setTimeout(() => setOrbState((s) => s === 'processing' ? 'idle' : s), 2000);
    };
    const onSpeechStart = () => {
      setOrbState('speaking');
      addLog('Echo speaking', 'speech');
    };
    const onSpeechEnd = () => {
      setOrbState((s) => s === 'speaking' ? 'listening' : s);
      addLog('Echo finished', 'speech');
    };
    const onMessage = (msg) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        const who = msg.role === 'assistant' ? 'Echo' : 'You';
        addLog(`[${who}] ${msg.transcript}`, msg.role === 'assistant' ? 'speech' : 'transcript');
        if (msg.role === 'assistant') setCaption(msg.transcript);
      }
    };
    const onError = (err) => {
      setOrbState('error');
      addLog(`Error: ${JSON.stringify(err)}`, 'error');
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('message', onMessage);
    vapi.on('error', onError);

    return () => {
      // Vapi SDK doesn't have .off() — events persist for the instance lifetime
    };
  }, [ready, addLog]);

  const start = useCallback(async (phaseNum) => {
    if (!ready) {
      setOrbState('connecting');
      addLog('Loading Vapi SDK', 'event');
      await loadSDK();
    }

    const phase = PHASES[phaseNum];
    if (!phase) return;

    setOrbState('connecting');
    addLog(`Starting Phase ${phaseNum} — ${phase.name}`, 'event');

    try {
      await vapiRef.current.start(phase.id);
    } catch (e) {
      setOrbState('error');
      addLog(`Start error: ${e.message}`, 'error');
    }
  }, [ready, loadSDK, addLog]);

  const stop = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      addLog('Call stopped by user', 'event');
    }
  }, [addLog]);

  return { start, stop, callActive, orbState, setOrbState, caption, logs, addLog };
}
