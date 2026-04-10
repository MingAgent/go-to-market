import { useState, useRef, useCallback, useEffect } from 'react';

const CYAN = '#00b4e6';

// ── Map Vapi assistant IDs to phase numbers ──
const PHASE_MAP = {
  '01dd6386-5991-4b44-afb7-591f83730749': 0,  // Router
  '36fe4e09-8319-4163-9c5e-eec233fe377b': 1,  // Phase 1 — Identity Scan
  '06a157b2-11a2-4732-8976-6a74c428c717': 2,  // Phase 2 — System Detection
  '68b9e554-b16a-4616-9a55-4549578f7146': 3,  // Phase 3 — Engine Diagnostics
  '8849ba5c-f668-4bd0-8ad1-c45b3ed36569': 4,  // Phase 4 — DNA Extraction
  '3bb5b88a-c760-440c-9131-ebb15942f574': 5,  // Phase 5 — Signal Lock
  'c89eb847-00b0-48c9-8a62-c8467c78fd63': 6,  // Phase 6 — Arsenal Loaded
  '16df75b0-a9e8-41f2-bf25-f9cbae76d872': 7,  // Phase 7 — Broadcast Config
  '643e6695-df5b-497b-8c1f-caeb6bee4a98': 8,  // Phase 8 — Outreach Matrix
  'ecc117e1-316b-43fd-9aa3-80f283b1c610': 9,  // Phase 9 — Resource Allocation
  'aa5eaba3-c0cb-42cd-ae7e-0d4579bd03cd': 10, // Phase 10 — Final Calibration
};

export default function VoiceToggle({ squadId, sessionId, resumePhase, isActive, onToggle, onTranscript, onPhaseChange }) {
  const vapiRef = useRef(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Lazy-load Vapi SDK
  const getVapi = useCallback(async () => {
    if (vapiRef.current) return vapiRef.current;
    try {
      const { default: Vapi } = await import('@vapi-ai/web');
      const instance = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY || '');

      instance.on('speech-start', () => setVolumeLevel(0.6));
      instance.on('speech-end', () => setVolumeLevel(0));
      instance.on('volume-level', (level) => setVolumeLevel(level));

      instance.on('message', (msg) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final' && msg.role === 'user') {
          onTranscript(msg.transcript);
        }
      });

      instance.on('message', (msg) => {
        if (msg.type === 'squad.member.joined') {
          const assistantId = msg.assistant?.id || msg.assistantId || '';
          const phase = PHASE_MAP[assistantId] ?? -1;
          if (phase > 0 && onPhaseChange) {
            onPhaseChange(phase);
          }
        }
      });

      instance.on('call-end', () => {
        onToggle(false);
        setVolumeLevel(0);
      });

      instance.on('error', (err) => {
        console.error('Vapi error:', err);
        onToggle(false);
        setIsConnecting(false);
      });

      vapiRef.current = instance;
      return instance;
    } catch (err) {
      console.error('Failed to load Vapi SDK:', err);
      return null;
    }
  }, [onToggle, onTranscript, onPhaseChange]);

  const toggleVoice = useCallback(async () => {
    if (isActive) {
      vapiRef.current?.stop();
      onToggle(false);
      setVolumeLevel(0);
      return;
    }

    setIsConnecting(true);
    const vapi = await getVapi();
    if (!vapi) {
      setIsConnecting(false);
      alert('Voice mode requires a Vapi API key. Set VITE_VAPI_PUBLIC_KEY in your .env file.');
      return;
    }

    try {
      await vapi.start({
        squadId: squadId,
        metadata: {
          session_id: sessionId,
          resume_phase: resumePhase || null,
          source: 'web',
        },
      });
      onToggle(true);
    } catch (err) {
      console.error('Failed to start voice squad:', err);
    }
    setIsConnecting(false);
  }, [isActive, squadId, sessionId, resumePhase, getVapi, onToggle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  // Wave animation speed scales with volume
  const waveSpeed = isActive ? Math.max(0.8, 2 - volumeLevel * 1.5) : 2;

  return (
    <div className="relative flex items-center justify-center">
      {/* Wave rings when active */}
      {isActive && (
        <>
          <span
            className="absolute rounded-full orb-wave-ring"
            style={{
              width: '100%',
              height: '100%',
              border: `2px solid ${CYAN}`,
              animationDuration: `${waveSpeed}s`,
              animationDelay: '0s',
            }}
          />
          <span
            className="absolute rounded-full orb-wave-ring"
            style={{
              width: '100%',
              height: '100%',
              border: `2px solid ${CYAN}`,
              animationDuration: `${waveSpeed}s`,
              animationDelay: `${waveSpeed / 3}s`,
            }}
          />
          <span
            className="absolute rounded-full orb-wave-ring"
            style={{
              width: '100%',
              height: '100%',
              border: `1px solid ${CYAN}`,
              animationDuration: `${waveSpeed}s`,
              animationDelay: `${(waveSpeed / 3) * 2}s`,
            }}
          />
        </>
      )}

      {/* Main orb button */}
      <button
        onClick={toggleVoice}
        disabled={isConnecting}
        className={`
          relative z-10 rounded-full flex items-center justify-center
          w-28 h-28 sm:w-36 sm:h-36
          transition-all duration-500 cursor-pointer
          ${isConnecting ? '' : isActive ? 'orb-active' : 'orb-idle'}
        `}
        style={{
          background: isActive
            ? `radial-gradient(circle, ${CYAN}30 0%, ${CYAN}10 60%, transparent 100%)`
            : `radial-gradient(circle, ${CYAN}15 0%, ${CYAN}05 60%, transparent 100%)`,
          border: `1.5px solid ${isActive ? CYAN + '60' : CYAN + '25'}`,
        }}
        title={isActive ? 'Tap to stop' : 'Tap to talk'}
      >
        {/* Connecting spinner */}
        {isConnecting ? (
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full orb-connecting"
            style={{
              border: `3px solid ${CYAN}20`,
              borderTopColor: CYAN,
            }}
          />
        ) : (
          /* Mic icon */
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300"
            fill={isActive ? CYAN : 'none'}
            stroke={isActive ? 'none' : CYAN + '80'}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
