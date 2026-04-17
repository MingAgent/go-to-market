import { useState, useRef, useEffect, useCallback } from 'react';
import { useTypewriter } from '../hooks/useTypewriter';
import WaveformCanvas from './WaveformCanvas';
import { PAUSE_STEP, PAUSE_LINE, PAUSE_SHORT, PAUSE_MED, PAUSE_LONG } from '../config';

function pause(ms) { return new Promise((r) => setTimeout(r, ms)); }

/**
 * Highlight "Echo" in cyan within a string (returns JSX).
 */
function highlightEcho(text) {
  const parts = text.split(/\b(Echo)\b/);
  return parts.map((part, i) =>
    part === 'Echo'
      ? <span key={i} className="echo-name">{part}</span>
      : <span key={i}>{part}</span>
  );
}

/**
 * Onboarding — 8-step typewriter sequence.
 * Props: onComplete(firstName) called when user finishes onboarding.
 */
export default function Onboarding({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showOrbPreview, setShowOrbPreview] = useState(false);
  const [showSpeakerHighlight, setShowSpeakerHighlight] = useState(false);
  const [showSpeakerIcon, setShowSpeakerIcon] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSoundOn, setShowSoundOn] = useState(false);
  const [skippedIntro, setSkippedIntro] = useState(false);

  const nameRef = useRef(null);
  const consentResolveRef = useRef(null);
  const nameResolveRef = useRef(null);
  const skipIntroRef = useRef(false);
  const { typewrite, skipRef } = useTypewriter();

  // Commit the current typewriter text as a finished line
  const commitLine = useCallback((text) => {
    setLines((prev) => [...prev, text]);
    setCurrentText('');
  }, []);

  // Type a line: sets currentText char by char, then commits
  const typeLine = useCallback(async (text, speed) => {
    setIsTyping(true);
    await typewrite(setCurrentText, text, speed);
    commitLine(text);
    setIsTyping(false);
  }, [typewrite, commitLine]);

  const clearLines = useCallback(() => {
    setLines([]);
    setCurrentText('');
  }, []);

  // Skip Intro — jump directly to name input
  const handleSkipIntro = useCallback(() => {
    skipIntroRef.current = true;
    setShowSkipIntro(false);
    setShowOrbPreview(false);
    setShowSpeakerIcon(false);
    setShowSpeakerHighlight(false);
    setShowSoundOn(false);
    clearLines();
    // Show name input + consent together
    setShowNameInput(true);
    setShowConsent(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  }, [clearLines]);

  // Click to skip
  useEffect(() => {
    const handler = () => { skipRef.current = true; };
    document.addEventListener('click', handler, { capture: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, [skipRef]);

  // Run the sequence
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const skip = () => cancelled || skipIntroRef.current;

      // Step 1 — Opening
      await typeLine('Welcome to Echo.');
      if (skip()) return;
      await pause(PAUSE_STEP);

      // Show "Skip intro" button after ~2s of typewriter
      setTimeout(() => { if (!cancelled) setShowSkipIntro(true); }, 2000);

      await typeLine('I am your strategic intake concierge. Over the next thirty minutes, I will help you build the foundation for a go-to-market roadmap built specifically for your business.');
      if (skip()) return;
      await pause(PAUSE_STEP);

      // Step 2 — Name Collection
      if (skip()) return;
      await typeLine('Before we begin \u2014 what should I call you?');
      if (skip()) return;
      await pause(PAUSE_SHORT);

      setShowSkipIntro(false);
      if (!skipIntroRef.current) {
        setShowNameInput(true);
        setTimeout(() => nameRef.current?.focus(), 100);
      }

      const firstName = await new Promise((resolve) => {
        nameResolveRef.current = resolve;
      });
      if (cancelled) return;

      setShowNameInput(false);
      setShowSkipIntro(false);
      await pause(300);

      // Step 3 — Greeting
      if (skip()) return;
      clearLines();
      await typeLine(`Good to meet you, ${firstName}.`);
      if (skip()) return;
      await pause(PAUSE_LONG);

      // Step 4 — Process Overview
      if (skip()) return;
      await typeLine('Here is how this works.');
      if (skip()) return;
      await pause(PAUSE_LINE);

      if (skip()) return;
      await typeLine('We will move through ten short phases together. Each takes two to four minutes. I will ask questions, you answer \u2014 by voice or by typing, your choice.');
      if (skip()) return;
      await pause(PAUSE_LONG);

      if (skip()) return;
      await typeLine('You may pause at any point and return later. Your answers save automatically. You can also come back and edit anything within 48 hours of completing the intake.');
      if (skip()) return;
      await pause(PAUSE_STEP);

      // Step 5 — Depth Expectation
      if (skip()) return;
      clearLines();
      await typeLine(`One thing worth knowing, ${firstName}.`);
      if (skip()) return;
      await pause(PAUSE_MED);

      if (skip()) return;
      await typeLine('The more detail you share, the sharper your roadmap will be. I would rather have one well-considered answer than five rushed ones. Take your time.');
      if (skip()) return;
      await pause(PAUSE_STEP);

      // Step 6 — Interface Tour
      if (skip()) return;
      clearLines();
      await typeLine('Two things to know about the interface.');
      if (skip()) return;
      await pause(PAUSE_LINE);

      setShowOrbPreview(true);
      await pause(500);
      if (skip()) return;
      setShowSoundOn(true); // Sound-on prompt appears 500ms after orb preview

      if (skip()) return;
      await typeLine('This is the Echo Orb. Tap it when you are ready to speak with me. Or type your answer in the field below \u2014 I read both.');
      if (skip()) return;
      await pause(PAUSE_STEP);

      setShowSpeakerIcon(true);
      await pause(300);
      setShowSpeakerHighlight(true);

      if (skip()) return;
      await typeLine('If you prefer to read my responses rather than hear them, tap the speaker icon to mute my voice. Your microphone still works \u2014 only my output changes.');
      if (skip()) return;

      setTimeout(() => setShowSpeakerHighlight(false), 2000);
      await pause(PAUSE_STEP);

      // Step 7 — Consent
      if (skip()) return;
      clearLines();
      setShowOrbPreview(false);
      setShowSpeakerIcon(false);
      setShowSoundOn(false);
      await pause(300);

      if (skip()) return;
      await typeLine('I will record and process our conversation to build your roadmap. Your data stays private and is not shared outside of Mingma.');
      if (skip()) return;
      await pause(PAUSE_LINE);

      if (skip()) return;
      await typeLine('Is that agreeable?');
      if (skip()) return;
      await pause(PAUSE_SHORT);

      setShowConsent(true);

      const consent = await new Promise((resolve) => {
        consentResolveRef.current = resolve;
      });
      if (cancelled) return;

      setShowConsent(false);

      if (!consent) {
        clearLines();
        setDeclined(true);
        await typeLine('Understood. I will end here \u2014 reach out when you are ready.');
        return;
      }

      // Step 8 — Transition
      clearLines();
      onComplete(firstName);
    }

    run();
    return () => { cancelled = true; };
  }, []); // Run once on mount

  const handleNameSubmit = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      nameResolveRef.current?.(e.target.value.trim());
    }
  };

  if (declined) {
    return (
      <div className="onboarding">
        <div className="onboarding-logo">
          <img src="/echo1-thumbnail.svg" alt="Echo 1 Labs" />
        </div>
        <div className="onboarding-text">
          {lines.map((line, i) => (
            <div key={i} className="onboarding-line visible">{highlightEcho(line)}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-logo">
        <img src="/echo1-thumbnail.svg" alt="Echo 1 Labs — Process Engineered Business Systems" />
      </div>

      <div className="onboarding-text">
        {lines.map((line, i) => (
          <div key={i} className="onboarding-line visible">{highlightEcho(line)}</div>
        ))}
        {currentText && (
          <div className="onboarding-line visible">
            {currentText}<span className="tw-cursor" />
          </div>
        )}

        {/* Consent buttons — inline with text, directly below "Is that agreeable?" */}
        {showConsent && (
          <div className="consent-wrap visible">
            <button className="consent-btn" onClick={() => {
              if (consentResolveRef.current) {
                consentResolveRef.current(true);
              } else {
                const name = nameRef.current?.value?.trim() || '';
                setShowConsent(false);
                setShowNameInput(false);
                onComplete(name);
              }
            }}>
              Yes, let&apos;s begin
            </button>
            <button className="consent-btn decline" onClick={() => {
              if (consentResolveRef.current) {
                consentResolveRef.current(false);
              } else {
                setShowConsent(false);
                setShowNameInput(false);
                setDeclined(true);
              }
            }}>
              Not right now
            </button>
          </div>
        )}
      </div>

      {showNameInput && (
        <div className="name-input-wrap visible">
          <input
            ref={nameRef}
            className="name-input"
            type="text"
            placeholder="Your first name"
            autoComplete="given-name"
            onKeyDown={handleNameSubmit}
          />
        </div>
      )}

      {/* Skip intro button — fades in after ~2s, hidden once name input shows */}
      {showSkipIntro && !showNameInput && !showConsent && (
        <button type="button" className="skip-intro-btn" onClick={handleSkipIntro}>
          Skip intro
        </button>
      )}

      {showOrbPreview && (
        <div className={`orb-preview ${showOrbPreview ? 'visible' : ''}`}>
          <WaveformCanvas size={200} energy={0.15} className="orb-preview-canvas" />
          {showSpeakerIcon && (
            <div className={`speaker-preview visible`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6aafef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </div>
          )}
          {showSpeakerHighlight && <div className="speaker-highlight visible" />}
          {showSoundOn && (
            <div className="sound-on-prompt visible">
              <span>Tap the orb</span>
              <span className="sound-on-dot">&middot;</span>
              <span>Sound on &#128266;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
