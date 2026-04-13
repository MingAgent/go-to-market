import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Echo1Logo from './Echo1Logo';
import ConsentGate from './ConsentGate';

const TYPING_SPEED = 45;
const TYPING_SPEED_FAST = 25;
const PAUSE_AFTER = 2000;
const PAUSE_AFTER_STACK = 800;
const PAUSE_AFTER_LONG = 3500;
const DISSOLVE_DURATION = 600;
const PAUSE_BEFORE_NEXT = 300;

const CYAN = '#00b4e6';
const GREEN = '#4ade80';

// Highlight rules — longest matches first to prevent partial conflicts
const STATIC_HIGHLIGHTS = [
  { text: 'AI-enhanced business systems', color: CYAN },
  { text: 'sales and marketing strategy', color: CYAN },
  { text: 'sales and marketing infrastructure', color: CYAN },
  { text: 'lifecycle management', color: CYAN },
  { text: 'every platform', color: CYAN },
  { text: 'speed control', color: CYAN },
  { text: 'your answers', color: CYAN },
  { text: 'show you how', color: CYAN },
  { text: 'founder-led', color: CYAN },
  { text: 'work email', color: CYAN },
  { text: 'full name', color: CYAN },
  { text: 'right place', color: CYAN },
  { text: 'speed up', color: CYAN },
  { text: 'GTM Engine', color: CYAN },
  { text: 'arrows', color: CYAN },
  { text: 'record', color: CYAN },
  { text: 'number', color: CYAN },
  { text: 'Skip', color: CYAN },
  { text: 'Back', color: CYAN },
  { text: 'edit', color: CYAN },
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

const playToggleSound = (on) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = on ? 660 : 440;
    gain.gain.value = 0.35;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
};

// ── Phrase definitions ──
function buildPhrases(firstName) {
  const fn = firstName || '...';
  return [
    // Phase 1 — Before Begin
    { text: 'Welcome to GTM Engine.' },
    { text: 'My name is Echo.', showOrb: true },
    { text: 'Can I have your full name?', input: 'name', highlight: 'name-input' },
    { text: `${fn}, I'm glad you're here —\nyou're looking for a smarter way\nto run sales and marketing\nwithout adding headcount.` },
    { text: "You're in the right place." },
    { text: 'Let me show you how.', begin: true, highlight: 'begin-btn' },

    // Phase 2 — After Begin + Consent
    { text: `Thank you, ${fn}.` },
    { text: "We solve one problem —\ngiving founder-led companies\nthe sales and marketing infrastructure\nthat used to require a full team,\npowered by AI-enhanced business systems." },
    { text: "Here's what happens next." },
    { text: 'The GTM Engine builds you a\ncomplete sales and marketing strategy\ntailored to your market —\nready to execute, not just read.' },

    // Stacked services
    { text: 'Content across every platform.', stack: 'services' },
    { text: 'Outbound sales sequences.', stack: 'services' },
    { text: 'Competitive intelligence.', stack: 'services' },
    { text: 'Full SEO audit and roadmap.', stack: 'services' },
    { text: 'End-to-end lifecycle management.', stack: 'services' },

    // Phase 3 — Closing + Data Collection
    { text: 'No more guessing what to post.' },
    { text: "No more wondering if leads\nare being followed up on." },
    { text: "Let's build yours." },
    { text: "What's your work email?", input: 'email', highlight: 'email-input' },
    { text: 'Best number to reach you?', input: 'mobile', highlight: 'phone-input' },

    // Phase 4 — Interactive Tour
    { text: "I'm going to ask you questions\nabout your business and record\nyour answers — that's how we\nbuild your strategy.", showNav: true, highlight: 'nav-buttons' },
    { text: "See this orb?\nTap it to answer by voice —\nmost people find it faster.", highlight: 'orb' },
    { text: "This is your speed control.\nTap to speed up or slow down\nanything I say.", highlight: 'speed' },
    { text: "Skip jumps to the next question.\nThe arrows inside speed me up.", highlight: 'skip' },
    { text: "Back lets you edit any answer.", highlight: 'back' },
    { text: "That's the basics.\nLet's set up your account.", final: true, highlight: 'continue-btn' },
  ];
}

export default function TypewriterIntro({ onComplete }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState('typing');
  const [displayText, setDisplayText] = useState('');
  const [textOpacity, setTextOpacity] = useState(1);

  // Collected data
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [inputType, setInputType] = useState(null);

  // UI state
  const [showOrb, setShowOrb] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // Speed control
  const [speed, setSpeed] = useState(1);
  const speedManualRef = useRef(false);

  // Tour highlight
  const [activeHighlight, setActiveHighlight] = useState(null);

  const inputRef = useRef(null);
  const stackBaseRef = useRef('');

  // Build phrases from current state
  const phrases = useMemo(() => buildPhrases(firstName), [firstName]);
  const currentPhrase = phrases[phraseIdx] || {};

  // Dynamic highlights for collected names
  const dynHighlights = useMemo(() => {
    const h = [];
    if (firstName) h.push({ text: firstName, color: GREEN });
    return h;
  }, [firstName]);

  // Focus input when it appears
  useEffect(() => {
    if (inputType) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputType]);

  // Handle triggers when a phrase starts
  useEffect(() => {
    const p = phrases[phraseIdx];
    if (!p) return;
    if (p.showOrb) setShowOrb(true);
    if (p.showNav) setShowNav(true);
    setActiveHighlight(p.highlight || null);
  }, [phraseIdx, phrases]);

  // Speed control auto-demo when Echo introduces it (Step 22)
  useEffect(() => {
    if (phraseIdx !== 22 || speedManualRef.current) return;
    const speeds = [1.5, 2, 1];
    let i = 0;
    const timer = setInterval(() => {
      if (i >= speeds.length) { clearInterval(timer); return; }
      setSpeed(speeds[i]);
      i++;
    }, 500);
    return () => clearInterval(timer);
  }, [phraseIdx]);

  // ── Typewriter engine ──
  useEffect(() => {
    if (inputType || showButton || showConsent || showFinal) return;

    const p = phrases[phraseIdx];
    if (!p) return;

    // Derive speed-adjusted intervals
    const typingInterval = p.stack
      ? Math.round(TYPING_SPEED_FAST / speed)
      : Math.round(TYPING_SPEED / speed);
    const pauseAfter = Math.max(Math.round(PAUSE_AFTER / speed), 600);
    const pauseAfterStack = Math.max(Math.round(PAUSE_AFTER_STACK / speed), 400);
    const dissolveDuration = Math.max(Math.round(DISSOLVE_DURATION / speed), 300);

    if (phase === 'typing') {
      if (charIdx < p.text.length) {
        const timer = setTimeout(() => {
          const typed = p.text.slice(0, charIdx + 1);
          setDisplayText(stackBaseRef.current + typed);
          setCharIdx(charIdx + 1);
        }, typingInterval);
        return () => clearTimeout(timer);
      }
      // Done typing this phrase
      if (p.input) {
        const timer = setTimeout(() => {
          setInputType(p.input);
          setCurrentInput('');
        }, pauseAfter);
        return () => clearTimeout(timer);
      }
      setPhase('paused');
      return;
    }

    if (phase === 'paused') {
      if (p.begin) {
        const timer = setTimeout(() => setShowButton(true), pauseAfter);
        return () => clearTimeout(timer);
      }
      if (p.final) {
        const timer = setTimeout(() => setShowFinal(true), pauseAfter);
        return () => clearTimeout(timer);
      }
      // Stacked phrase — don't dissolve, advance to next in group
      const nextP = phrases[phraseIdx + 1];
      if (p.stack && nextP?.stack === p.stack) {
        const timer = setTimeout(() => {
          stackBaseRef.current = stackBaseRef.current + p.text + '\n';
          setCharIdx(0);
          setPhraseIdx(phraseIdx + 1);
          setPhase('typing');
        }, pauseAfterStack);
        return () => clearTimeout(timer);
      }
      // Normal dissolve
      const delay = p.longPause ? PAUSE_AFTER_LONG : pauseAfter;
      const timer = setTimeout(() => {
        setPhase('dissolving');
        setTextOpacity(0);
        setActiveHighlight(null);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (phase === 'dissolving') {
      const timer = setTimeout(() => setPhase('waiting'), dissolveDuration);
      return () => clearTimeout(timer);
    }

    if (phase === 'waiting') {
      const timer = setTimeout(() => {
        stackBaseRef.current = '';
        setDisplayText('');
        setCharIdx(0);
        setPhraseIdx(phraseIdx + 1);
        setTextOpacity(1);
        setPhase('typing');
      }, PAUSE_BEFORE_NEXT);
      return () => clearTimeout(timer);
    }
  }, [charIdx, phraseIdx, phase, phrases, inputType, showButton, showConsent, showFinal, speed]);

  // ── Input submission ──
  const handleInputSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmed = currentInput.trim();
    if (!trimmed) return;

    if (inputType === 'name') {
      setFirstName(trimmed.split(/\s+/)[0]);
    } else if (inputType === 'email') {
      setEmail(trimmed);
    } else if (inputType === 'mobile') {
      setMobile(trimmed);
    }

    setInputType(null);
    setCurrentInput('');
    stackBaseRef.current = '';
    setDisplayText('');
    setCharIdx(0);
    setPhraseIdx(phraseIdx + 1);
    setTextOpacity(1);
    setPhase('typing');
  }, [currentInput, inputType, phraseIdx]);

  // ── Skip: jump to next input gate or to final ──
  const handleSkip = useCallback(() => {
    for (let i = phraseIdx + 1; i < phrases.length; i++) {
      if (phrases[i].input || phrases[i].final) {
        setInputType(null);
        setCurrentInput('');
        stackBaseRef.current = '';
        setDisplayText('');
        setCharIdx(0);
        setPhraseIdx(i);
        setTextOpacity(1);
        setPhase('typing');
        setActiveHighlight(null);
        return;
      }
    }
  }, [phraseIdx, phrases]);

  // ── Back: go to previous phrase ──
  const handleBack = useCallback(() => {
    if (phraseIdx <= 0) return;
    setInputType(null);
    setCurrentInput('');
    stackBaseRef.current = '';
    setDisplayText('');
    setCharIdx(0);
    setPhraseIdx(phraseIdx - 1);
    setTextOpacity(1);
    setPhase('typing');
    setActiveHighlight(null);
  }, [phraseIdx]);

  // Input config
  const inputConfig = {
    name: { placeholder: 'Your full name', type: 'text', autoComplete: 'name' },
    email: { placeholder: 'Work email', type: 'email', autoComplete: 'email' },
    mobile: { placeholder: 'Best phone number', type: 'tel', autoComplete: 'tel' },
  };
  const ic = inputType ? inputConfig[inputType] : null;

  // ── Consent handlers ──
  const handleConsentAccept = useCallback(() => {
    setShowConsent(false);
    setShowButton(false);
    stackBaseRef.current = '';
    setDisplayText('');
    setCharIdx(0);
    setPhraseIdx(phraseIdx + 1);
    setTextOpacity(1);
    setPhase('typing');
  }, [phraseIdx]);

  const handleConsentDecline = useCallback(() => {
    setShowConsent(false);
  }, []);

  // Helper: check if element is tour-highlighted
  const isHL = (target) => activeHighlight === target;

  // ── Render ConsentGate when triggered mid-flow ──
  if (showConsent) {
    return <ConsentGate onAccept={handleConsentAccept} onDecline={handleConsentDecline} />;
  }

  // Is the typewriter actively typing?
  const isTyping = phase === 'typing' && !inputType && !showButton && !showConsent && !showFinal;

  // Shared speed control renderer
  const renderSpeedControl = (inForm = false) => (
    <div
      className={`flex items-center gap-0 overflow-hidden transition-all duration-300 ${isHL('speed') ? 'tour-highlight' : ''}`}
      style={{
        borderRadius: 20,
        border: `1px solid ${isHL('speed') ? CYAN : 'rgba(255,255,255,0.08)'}`,
        background: 'rgba(255,255,255,0.05)',
      }}
    >
      {[1, 1.5, 2].map(s => (
        <button
          key={s}
          type={inForm ? 'button' : undefined}
          onClick={() => { speedManualRef.current = true; setSpeed(s); }}
          className="font-mono transition-all duration-200"
          style={{
            padding: '8px 18px',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 1,
            background: speed === s ? 'rgba(0,180,230,0.25)' : 'transparent',
            color: speed === s ? CYAN : 'rgba(255,255,255,0.3)',
            borderRadius: speed === s ? 16 : 0,
            boxShadow: speed === s ? '0 0 12px rgba(0,180,230,0.15)' : 'none',
            minHeight: 44,
            cursor: 'pointer',
          }}
          aria-label={`Playback speed ${s}x`}
          aria-pressed={speed === s}
        >
          {s}x
        </button>
      ))}
    </div>
  );

  // Shared Back/Skip buttons renderer
  const renderNavButtons = (inForm = false) => (
    <div className={`flex items-center ${isHL('nav-buttons') ? 'tour-highlight' : ''}`} style={{ gap: 120, borderRadius: 999, padding: '8px 16px' }}>
      <button
        type={inForm ? 'button' : undefined}
        onClick={handleBack}
        className={`flex flex-col items-center transition-all duration-300 ${isHL('back') ? 'tour-highlight' : ''}`}
        style={{ gap: 4 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            border: `1.5px solid ${isHL('back') ? CYAN + '60' : 'rgba(255,255,255,0.2)'}`,
            boxShadow: isHL('back') ? `0 0 12px ${CYAN}30` : 'none',
            color: isHL('back') ? CYAN : 'rgba(255,255,255,0.5)',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </div>
        <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: 3, color: isHL('back') ? CYAN : 'rgba(255,255,255,0.35)' }}>
          Back
        </span>
      </button>
      <button
        type={inForm ? 'button' : undefined}
        onClick={handleSkip}
        className={`flex flex-col items-center transition-all duration-300 ${isHL('skip') ? 'tour-highlight' : ''}`}
        style={{ gap: 4 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            border: `1.5px solid ${isHL('skip') ? CYAN + '60' : 'rgba(255,255,255,0.2)'}`,
            boxShadow: isHL('skip') ? `0 0 12px ${CYAN}30` : 'none',
            color: isHL('skip') ? CYAN : 'rgba(255,255,255,0.5)',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: 3, color: isHL('skip') ? CYAN : 'rgba(255,255,255,0.35)' }}>
          Skip
        </span>
      </button>
    </div>
  );

  return (
    <div
      className="h-screen flex flex-col items-center overflow-hidden relative"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', padding: '0 24px' }}
    >
      {/* Logo branding — 80px from top */}
      <div className="fade-in flex flex-col items-center flex-shrink-0" style={{ paddingTop: 80 }}>
        <Echo1Logo size="lg" />
        <div style={{ marginTop: 6, height: 2, width: 64, background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)` }} />
        <p className="font-mono uppercase" style={{ marginTop: 6, marginBottom: 40, fontSize: 10, letterSpacing: 3, color: CYAN, whiteSpace: 'nowrap' }}>
          AI-Enhanced Go-to-Market Engine
        </p>
      </div>

      {/* Orb — after subtitle */}
      {showOrb && (
        <div className="fade-in flex flex-col items-center flex-shrink-0" style={{ marginBottom: 4 }}>
          <div className="relative">
            <div
              className={`rounded-full flex items-center justify-center ${isHL('orb') ? 'tour-highlight' : 'orb-idle'}`}
              style={{
                width: 120,
                height: 120,
                background: 'radial-gradient(circle, rgba(0,180,230,0.08) 0%, transparent 70%)',
                border: `2px solid ${isHL('orb') ? CYAN : 'rgba(0,180,230,0.5)'}`,
                boxShadow: '0 0 30px rgba(0,180,230,0.15), inset 0 0 20px rgba(0,180,230,0.05)',
                transition: 'border-color 0.3s ease',
              }}
            >
              {/* Voice wave bars — magenta + green, animate during typing */}
              <svg width="40" height="32" viewBox="0 0 40 32" className={isTyping ? 'voice-waves-active' : ''}>
                <rect className="voice-bar voice-bar-1" x="2" y="10" width="3" rx="1.5" fill="#e040fb" opacity="0.8" />
                <rect className="voice-bar voice-bar-2" x="8" y="6" width="3" rx="1.5" fill="#4ade80" opacity="0.8" />
                <rect className="voice-bar voice-bar-3" x="14" y="3" width="3" rx="1.5" fill="#e040fb" opacity="0.8" />
                <rect className="voice-bar voice-bar-4" x="20" y="8" width="3" rx="1.5" fill="#4ade80" opacity="0.8" />
                <rect className="voice-bar voice-bar-5" x="26" y="5" width="3" rx="1.5" fill="#e040fb" opacity="0.8" />
                <rect className="voice-bar voice-bar-6" x="32" y="9" width="3" rx="1.5" fill="#4ade80" opacity="0.8" />
              </svg>
            </div>
            {/* Sound toggle — right edge, vertically centered */}
            <button
              onClick={() => { setSoundOn(s => { playToggleSound(!s); return !s; }); }}
              className="absolute rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                width: 36,
                height: 36,
                right: -6,
                bottom: -6,
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid rgba(255,255,255,0.15)`,
                userSelect: 'auto',
              }}
            >
              {soundOn ? (
                <svg width="16" height="16" fill="none" stroke={CYAN} viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
            </button>
          </div>
          {/* ECHO label */}
          <p className="font-mono uppercase" style={{ marginTop: 8, marginBottom: 2, fontSize: 14, letterSpacing: 8, color: CYAN }}>
            Echo
          </p>
          {/* TAP TO TALK label */}
          <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', marginBottom: 36 }}>
            Tap to Talk
          </p>
        </div>
      )}

      {/* Typewriter text */}
      <div
        className="w-full text-center flex items-center justify-center flex-shrink-0"
        style={{ maxWidth: 320, minHeight: 80, overflowWrap: 'break-word', wordWrap: 'break-word', marginBottom: 32 }}
      >
        {!showButton && !showFinal && (
          <p
            className="w-full font-light"
            style={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.5,
              opacity: inputType ? 1 : textOpacity,
              transition: `opacity ${Math.max(Math.round(DISSOLVE_DURATION / speed), 300)}ms ease-out`,
            }}
          >
            {inputType
              ? renderWithHighlights(currentPhrase.text, dynHighlights)
              : renderWithHighlights(displayText, dynHighlights)}
            {phase === 'typing' && !inputType && <span className="cursor-blink" />}
          </p>
        )}
        {(showButton || showFinal) && (
          <p className="w-full font-light" style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
            {renderWithHighlights(currentPhrase.text, dynHighlights)}
          </p>
        )}
      </div>

      {/* Controls area — below typewriter text */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Non-input view: speed control + back/next */}
        {showOrb && !inputType && !showButton && !showConsent && !showFinal && (
          <>
            {renderSpeedControl()}
            <div style={{ marginTop: 20 }}>
              {renderNavButtons()}
            </div>
          </>
        )}

        {/* Input field — appears at input gates */}
        {inputType && ic && (
          <form onSubmit={handleInputSubmit} className="fade-in flex flex-col items-center">
            <input
              ref={inputRef}
              type={ic.type}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={ic.placeholder}
              className={`bg-transparent text-center font-light focus:outline-none transition-colors ${isHL('name-input') || isHL('email-input') || isHL('phone-input') ? 'tour-highlight' : ''}`}
              style={{
                userSelect: 'text',
                WebkitUserSelect: 'text',
                fontSize: 18,
                maxWidth: 280,
                width: '100%',
                border: 'none',
                borderBottom: `1px solid ${isHL('name-input') || isHL('email-input') || isHL('phone-input') ? CYAN : 'rgba(255,255,255,0.3)'}`,
                paddingBottom: 8,
                color: 'rgba(255,255,255,0.9)',
                caretColor: CYAN,
              }}
              autoComplete={ic.autoComplete}
            />
            <p
              className="font-mono animate-pulse"
              style={{ marginTop: 6, marginBottom: 32, fontSize: 11, letterSpacing: 2, color: 'rgba(0,180,230,0.5)' }}
            >
              Press Enter to continue
            </p>
            {/* Speed control */}
            {showOrb && (
              <div style={{ marginBottom: 20 }}>
                {renderSpeedControl(true)}
              </div>
            )}
            {/* Back & Skip buttons */}
            {showOrb && renderNavButtons(true)}
          </form>
        )}
      </div>

      {/* Mid-flow Begin button */}
      {showButton && !showConsent && (
        <div className="fade-in-slow flex flex-col items-center" style={{ marginTop: 40 }}>
          <button
            onClick={() => setShowConsent(true)}
            className={`group relative rounded-full cta-border-glow transition-all duration-300 hover:bg-[#00b4e6]/10 ${isHL('begin-btn') ? 'tour-highlight' : ''}`}
            style={{
              background: '#0a1929',
              border: `2.5px solid ${CYAN}`,
              padding: '24px 64px',
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
          <p className="font-mono" style={{ marginTop: 48, fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
            10 phases &middot; ~8 minutes
          </p>
        </div>
      )}

      {/* Final → transition to agent */}
      {showFinal && (
        <div className="fade-in-slow" style={{ marginTop: 40 }}>
          <button
            onClick={onComplete}
            className={`group relative rounded-full cta-border-glow transition-all duration-300 hover:bg-[#00b4e6]/10 ${isHL('continue-btn') ? 'tour-highlight' : ''}`}
            style={{
              background: '#0a1929',
              border: `2.5px solid ${CYAN}`,
              padding: '20px 60px',
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="text-lg font-semibold" style={{ color: CYAN }}>
                Continue
              </span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke={CYAN} viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="absolute left-0 right-0 text-center font-mono" style={{ bottom: 20, fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.15)' }}>
        &copy; 2026 Mingma Inc. All rights reserved.
      </p>
    </div>
  );
}
