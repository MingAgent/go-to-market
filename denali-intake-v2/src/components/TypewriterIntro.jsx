import { useState, useEffect, useRef } from 'react';

const TYPING_SPEED = 45;
const PAUSE_AFTER = 2000;
const PAUSE_AFTER_LONG = 3500;
const DISSOLVE_DURATION = 600;
const PAUSE_BEFORE_NEXT = 300;

const CYAN = '#00b4e6';
const GREEN = '#4ade80';

// Phrases that get a longer pause (index in their respective array)
const LONG_PAUSE_POST = [2]; // "What does the future look like..."

// Highlight rules: { text, color } — applied in order
const STATIC_HIGHLIGHTS = [
  { text: 'Denali', color: CYAN },
  { text: 'business life cycle management engine', color: CYAN },
  { text: 'AI-enhanced automations', color: CYAN },
  { text: 'AI-enhanced automation', color: CYAN },
  { text: 'go-to-market plan', color: CYAN },
  { text: 'founder-led', color: CYAN },
  { text: 'process engineering', color: CYAN },
  { text: 'full name', color: GREEN },
  { text: 'Echo', color: GREEN },
];

function renderWithHighlights(text, dynamicHighlights = []) {
  if (!text) return null;
  const allHighlights = [...STATIC_HIGHLIGHTS, ...dynamicHighlights];
  let parts = [text];
  for (const { text: hl, color } of allHighlights) {
    const next = [];
    for (const part of parts) {
      if (typeof part !== 'string') { next.push(part); continue; }
      const idx = part.indexOf(hl);
      if (idx === -1) { next.push(part); continue; }
      if (idx > 0) next.push(part.slice(0, idx));
      next.push(<span key={hl + idx} style={{ color }}>{hl}</span>);
      if (idx + hl.length < part.length) next.push(part.slice(idx + hl.length));
    }
    parts = next;
  }
  // Convert \n in string parts to <br />
  const final = [];
  let brKey = 0;
  for (const part of parts) {
    if (typeof part !== 'string') { final.push(part); continue; }
    const lines = part.split('\n');
    lines.forEach((line, i) => {
      if (i > 0) final.push(<br key={`br-${brKey++}`} />);
      if (line) final.push(line);
    });
  }
  return final;
}

const playToggleSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

// Phases: 'pre' → 'input' → 'post' → 'done'
export default function TypewriterIntro({ onComplete }) {
  const [stage, setStage] = useState('pre');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState('typing');
  const [displayText, setDisplayText] = useState('');
  const [textOpacity, setTextOpacity] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [showOrb, setShowOrb] = useState(false);
  const [showResponseField, setShowResponseField] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const inputRef = useRef(null);

  const prePhrases = [
    'Welcome to Denali.',
    'We\'re not just a marketing tool.\nWe\'re a business life cycle management engine.',
    'I hope you\'re ready to experience what true\nAI-enhanced automation feels like.',
    'We\'re about to build you a full business\ngo-to-market plan, together.',
    'My name is Echo.',
    "I'll be guiding you every step of the way,\nand help you get the most from your experience with us.",
    'You can speak to me by tapping the orb,\nor type in the response field below.',
    'May I have your full name please?',
  ];

  const postPhrases = firstName
    ? [
        `Thank you, ${firstName}.\nIt's nice to meet you.`,
        'We are here to answer one question.',
        'What does the future look like for founder-led companies,\nwhen process engineering meets\nAI-enhanced automations?',
        'Let me show you.',
      ]
    : [];

  const currentPhrases = stage === 'pre' ? prePhrases : postPhrases;
  const nameHighlights = firstName ? [{ text: firstName, color: GREEN }] : [];

  // Show orb once Echo introduces herself (index 4: "My name is Echo.")
  useEffect(() => {
    if (stage === 'pre' && phraseIdx >= 4 && !showOrb) {
      setShowOrb(true);
    }
  }, [stage, phraseIdx, showOrb]);

  // Show response field when Echo mentions it (index 6: "type in the response field")
  useEffect(() => {
    if (stage === 'pre' && phraseIdx >= 6 && !showResponseField) {
      setShowResponseField(true);
    }
  }, [stage, phraseIdx, showResponseField]);

  // Focus name input when it appears
  useEffect(() => {
    if (stage === 'input') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [stage]);

  // Typewriter engine
  useEffect(() => {
    if (stage === 'input' || stage === 'done') return;

    const phrases = currentPhrases;
    if (!phrases.length || phraseIdx >= phrases.length) return;

    const currentPhrase = phrases[phraseIdx];

    if (phase === 'typing') {
      if (charIdx < currentPhrase.length) {
        const timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, charIdx + 1));
          setCharIdx(charIdx + 1);
        }, TYPING_SPEED);
        return () => clearTimeout(timer);
      }
      setPhase('paused');
      return;
    }

    if (phase === 'paused') {
      const isLastPhrase = phraseIdx === phrases.length - 1;

      if (isLastPhrase) {
        if (stage === 'pre') {
          const timer = setTimeout(() => setStage('input'), PAUSE_AFTER);
          return () => clearTimeout(timer);
        } else {
          const timer = setTimeout(() => {
            setStage('done');
            setShowButton(true);
          }, PAUSE_AFTER);
          return () => clearTimeout(timer);
        }
      }

      // Dissolve to next phrase
      const longPauseSet = stage === 'post' ? LONG_PAUSE_POST : [];
      const delay = longPauseSet.includes(phraseIdx) ? PAUSE_AFTER_LONG : PAUSE_AFTER;
      const timer = setTimeout(() => {
        setPhase('dissolving');
        setTextOpacity(0);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (phase === 'dissolving') {
      const timer = setTimeout(() => setPhase('waiting'), DISSOLVE_DURATION);
      return () => clearTimeout(timer);
    }

    if (phase === 'waiting') {
      const timer = setTimeout(() => {
        setDisplayText('');
        setCharIdx(0);
        setPhraseIdx(phraseIdx + 1);
        setTextOpacity(1);
        setPhase('typing');
      }, PAUSE_BEFORE_NEXT);
      return () => clearTimeout(timer);
    }
  }, [charIdx, phraseIdx, phase, stage, currentPhrases]);

  // Handle name submission
  const handleNameSubmit = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    const first = trimmed.split(/\s+/)[0];
    setFirstName(first);

    setPhraseIdx(0);
    setCharIdx(0);
    setDisplayText('');
    setTextOpacity(1);
    setPhase('typing');
    setStage('post');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* DENALI branding */}
      <div className="mb-8 fade-in">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
          DENALI
        </h1>
        <div className="mt-2 h-[2px] w-16 mx-auto bg-gradient-to-r from-transparent via-[#00b4e6] to-transparent" />
        <p className="mt-3 text-xs tracking-[0.35em] uppercase text-gray-500 font-mono">
          by Mingma Inc
        </p>
      </div>

      {/* Decorative orb — appears when Echo introduces herself */}
      {showOrb && (
        <div className="mt-4 mb-8 fade-in flex flex-col items-center">
          <div className="relative">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full orb-idle flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 40% 35%, #0a2a3f, #040d14)',
                border: `2px solid ${CYAN}30`,
              }}
            >
              {/* Mic icon */}
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke={CYAN} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            {/* Sound toggle */}
            <button
              onClick={() => { playToggleSound(); setSoundOn(s => !s); }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: '#0a1929',
                border: `1.5px solid ${soundOn ? CYAN : '#444'}`,
                userSelect: 'auto',
              }}
            >
              {soundOn ? (
                <svg className="w-4 h-4" fill="none" stroke={CYAN} viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="#666" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
            </button>
          </div>
          {/* echo branding under orb */}
          <p
            className="mt-3 text-xs tracking-[0.4em] uppercase font-mono"
            style={{ color: `${CYAN}50` }}
          >
            echo
          </p>
        </div>
      )}

      {/* Typewriter text */}
      <div className="max-w-2xl mx-auto text-center min-h-[80px] flex items-center justify-center">
        {stage !== 'done' && (
          <p
            className="text-xl sm:text-2xl font-light text-gray-300 leading-relaxed"
            style={{
              opacity: stage === 'input' ? 1 : textOpacity,
              transition: `opacity ${DISSOLVE_DURATION}ms ease-out`,
            }}
          >
            {stage === 'input' ? prePhrases[prePhrases.length - 1] : renderWithHighlights(displayText, nameHighlights)}
            {phase === 'typing' && stage !== 'input' && <span className="cursor-blink" />}
          </p>
        )}
        {stage === 'done' && (
          <p className="text-xl sm:text-2xl font-light text-gray-300 leading-relaxed">
            {renderWithHighlights(postPhrases[postPhrases.length - 1], nameHighlights)}
          </p>
        )}
      </div>

      {/* Response field — appears when Echo mentions it */}
      {showResponseField && stage === 'pre' && (
        <div className="mt-6 fade-in w-full max-w-sm mx-auto">
          <input
            type="text"
            disabled
            placeholder="Type your response here..."
            className="w-full bg-transparent border-b-2 border-gray-700 text-center text-lg text-white py-3 px-2 placeholder-gray-600 transition-colors"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          />
        </div>
      )}

      {/* Name input — appears after last pre phrase */}
      {stage === 'input' && (
        <form onSubmit={handleNameSubmit} className="mt-8 fade-in flex flex-col items-center w-full max-w-sm">
          <input
            ref={inputRef}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your full name"
            className="w-full bg-transparent border-b-2 border-gray-700 text-center text-xl text-white py-3 px-2 placeholder-gray-600 focus:border-[#00b4e6] focus:outline-none transition-colors"
            autoComplete="name"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="mt-6 px-8 py-3 rounded-full text-sm font-mono transition-all duration-300 disabled:opacity-20"
            style={{
              color: CYAN,
              border: '1.5px solid #00b4e640',
            }}
          >
            Continue
          </button>
        </form>
      )}

      {/* Begin button */}
      {showButton && (
        <div className="mt-10 fade-in-slow flex flex-col items-center">
          <button
            onClick={onComplete}
            className="group relative rounded-full cta-border-glow transition-all duration-300 hover:bg-[#00b4e6]/10"
            style={{
              background: '#0a1929',
              border: `2.5px solid ${CYAN}`,
              padding: '28px 80px',
            }}
          >
            <span className="relative z-10 flex items-center gap-4">
              <span className="text-lg font-semibold" style={{ color: CYAN }}>
                Begin
              </span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke={CYAN} viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <svg className="w-7 h-7 rabbit-glow" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 16a3 3 0 0 1 2.24 5" />
                <path d="M18 12h.01" />
                <path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" />
                <path d="M20 8.54V4a2 2 0 1 0-4 0v3" />
                <path d="M7.612 12.524a3 3 0 1 0-1.6 4.3" />
              </svg>
            </span>
          </button>
          <p className="text-sm text-gray-500 font-mono tracking-wide" style={{ marginTop: '8rem' }}>
            10 phases &middot; ~8 minutes
          </p>
        </div>
      )}
    </div>
  );
}
