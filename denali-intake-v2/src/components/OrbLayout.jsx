import { useState, useRef, useEffect, useCallback } from 'react';
import WaveformCanvas from './WaveformCanvas';

const ORB_ENERGY = {
  idle: 0.15,
  connecting: 0.3,
  listening: 0.5,
  speaking: 0.85,
  processing: 0.4,
  error: 0.1,
};

const ORB_LABELS = {
  idle: 'Tap to speak',
  connecting: 'Connecting\u2026',
  listening: 'Listening\u2026',
  speaking: '',
  processing: 'Processing\u2026',
  error: 'Connection lost \u2014 tap to retry',
};

const PHASE_NAMES = {
  1: 'Identity',
  2: 'Market',
  3: 'Product',
  4: 'Audience',
  5: 'Competition',
  6: 'Channels',
  7: 'Pricing',
  8: 'Operations',
  9: 'Vision',
};

/**
 * OrbLayout — main voice interface after onboarding.
 * Props: firstName, vapi, currentPhase, onPhaseChange,
 *        questionIndex, questionCount, timeEstimate, answers,
 *        onPause, onResumeLater, onReviewAnswers, onBack, onSkip
 */
export default function OrbLayout({
  firstName,
  vapi,
  currentPhase,
  onPhaseChange,
  phaseLabel,
  questionIndex = 0,
  questionCount = 6,
  timeEstimate = '~25 min remaining',
  answers = [],
  onPause,
  onReviewAnswers,
  onBack,
  onSkip,
  currentQuestion = '',
}) {
  const { start, stop, callActive, orbState, setOrbState, caption, transcript, editTranscript, logs, addLog } = vapi;

  const [muted, setMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [displayedCaption, setDisplayedCaption] = useState('');
  const [pendingFile, setPendingFile] = useState(null); // { name, type, size, data (base64) }
  const [fileError, setFileError] = useState('');
  const logEndRef = useRef(null);
  const captionQueueRef = useRef([]);
  const captionTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasAutoStarted = useRef(false);
  const transcriptEndRef = useRef(null);
  const longPressRef = useRef(null);

  const energy = ORB_ENERGY[orbState] || 0.15;
  const label = ORB_LABELS[orbState] || '';
  const phaseName = phaseLabel || PHASE_NAMES[currentPhase] || '';
  const progressPct = questionCount > 0
    ? ((questionIndex + 1) / questionCount) * 100
    : 0;

  // Auto-scroll dev log
  useEffect(() => {
    if (showLog) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, showLog]);

  // Dev log toggle — Ctrl+Shift+L (hidden from UI)
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setShowLog((s) => !s);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Auto-start voice on mount — Echo greets the user
  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    const timer = setTimeout(() => {
      if (!callActive) {
        start(currentPhase);
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOrbClick = useCallback(() => {
    if (callActive) {
      stop();
    } else {
      start(currentPhase);
    }
  }, [callActive, stop, start, currentPhase]);

  const handleTextSubmit = useCallback((e) => {
    if (e.key === 'Enter' && (textInput.trim() || pendingFile)) {
      const msg = textInput.trim();
      const filePart = pendingFile ? ` [+${pendingFile.name}]` : '';
      addLog(`[You \u2014 typed] ${msg || '(file only)'}${filePart}`, 'transcript');
      setTextInput('');
      setPendingFile(null);
      setFileError('');
      // Text input + file will be handled by the Vapi assistant context in a future iteration
    }
  }, [textInput, pendingFile, addLog]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
    addLog(muted ? 'Echo voice unmuted' : 'Echo voice muted', 'event');
  }, [muted, addLog]);

  // Speed control — apply to any active audio element from Vapi
  const handleSpeed = useCallback((val) => {
    setSpeed(val);
    setSpeedOpen(false);
    addLog(`Playback speed set to ${val}x`, 'event');
    // Attempt to apply to any active Vapi audio element
    try {
      const audioEls = document.querySelectorAll('audio');
      audioEls.forEach((el) => { el.playbackRate = val; });
    } catch (e) {
      // Speed will be applied on next speech segment
    }
  }, [addLog]);

  // Volume control — apply to Vapi audio
  const handleVolume = useCallback((val) => {
    const v = Number(val);
    setVolume(v);
    try {
      const audioEls = document.querySelectorAll('audio');
      audioEls.forEach((el) => { el.volume = v / 100; });
    } catch (e) { /* no-op */ }
  }, []);

  // File upload handler
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt';

  const handleFileSelect = useCallback((e) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result, // base64 data URL
      });
      addLog(`File attached: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`, 'event');
    };
    reader.onerror = () => {
      setFileError('Failed to read file');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be re-selected
  }, [addLog]);

  const clearFile = useCallback(() => {
    setPendingFile(null);
    setFileError('');
  }, []);

  // Re-apply speed/volume when speech starts
  useEffect(() => {
    if (orbState === 'speaking') {
      try {
        const audioEls = document.querySelectorAll('audio');
        audioEls.forEach((el) => {
          el.playbackRate = speed;
          el.volume = volume / 100;
        });
      } catch (e) { /* no-op */ }
    }
  }, [orbState, speed, volume]);

  // ── Subtitle sentence pacing ──
  // Split caption into sentences, display one at a time with 2s hold between each
  useEffect(() => {
    if (!caption) {
      setDisplayedCaption('');
      captionQueueRef.current = [];
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
      return;
    }

    // Split into sentences (period, ?, ! followed by space or end)
    const sentences = caption.match(/[^.!?]*[.!?]+(?:\s|$)|[^.!?]+$/g) || [caption];
    const trimmed = sentences.map((s) => s.trim()).filter(Boolean);

    // If only one sentence, display directly
    if (trimmed.length <= 1) {
      setDisplayedCaption(caption);
      return;
    }

    // Queue sentences
    captionQueueRef.current = trimmed;
    let index = 0;

    function showNext() {
      if (index < captionQueueRef.current.length) {
        setDisplayedCaption(captionQueueRef.current[index]);
        index++;
        captionTimerRef.current = setTimeout(showNext, 2000);
      }
    }

    showNext();

    return () => {
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    };
  }, [caption]);

  // Clear caption display when not speaking
  useEffect(() => {
    if (orbState !== 'speaking') {
      // Keep displayed caption visible briefly after speaking ends
      const t = setTimeout(() => {
        if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
        setDisplayedCaption('');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [orbState]);

  // Auto-scroll transcript to bottom on new entries
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Save edited transcript entry
  const saveEdit = useCallback((id, newText) => {
    if (newText.trim()) editTranscript(id, newText.trim());
    setEditingId(null);
  }, [editTranscript]);

  // Long-press handlers for mobile edit
  const handleTouchStart = useCallback((id) => {
    longPressRef.current = setTimeout(() => setHoveredId(id), 500);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }, []);

  return (
    <div className="orb-layout">

      {/* ── Header: phase / progress / time ── */}
      <div className="orb-header">
        <span className="orb-header__phase">
          Phase {currentPhase} &mdash; {phaseName}
        </span>
        <div className="orb-header__center">
          <span className="orb-header__question">
            Question {questionIndex + 1} of {questionCount}
          </span>
          <div className="orb-header__progress">
            <div
              className="orb-header__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <span className="orb-header__time">{timeEstimate}</span>
      </div>

      {/* ── Scrollable middle zone ── */}
      <div className="orb-scrollable">

        {/* Logo only — mute/volume merged into card */}
        <div className="top-bar">
          <img src="/echo1-favicon.svg" alt="Echo" className="top-favicon" />
        </div>

        {/* Tagline — above the card, close to logo */}
        <p className="orb-tagline">AI-Enhanced Go-To-Market Engine</p>

        {/* ── Orb Card (glassmorphism wrapper) ── */}
        <div className="orb-card">

          {/* Orb area with peripheral controls */}
          <div className="orb-zone">

            {/* Speed pill — collapsed by default, expands to show options */}
            <div className={`speed-pill${speedOpen ? ' open' : ''}`}>
              {speedOpen ? (
                [1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`speed-btn${speed === s ? ' active' : ''}`}
                    onClick={() => handleSpeed(s)}
                  >
                    {s}x
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  className="speed-btn active"
                  onClick={() => setSpeedOpen(true)}
                  title="Change playback speed"
                >
                  {speed}x
                </button>
              )}
            </div>

            {/* Orb */}
            <div className="orb-container" onClick={handleOrbClick}>
              <WaveformCanvas size={500} energy={energy} className="orb-canvas" />
              <div className={`orb-ring ${orbState}`} />
            </div>

            {/* Unified volume — tap to mute, drag to adjust */}
            <div className="volume-unified">
              <button
                type="button"
                className={`volume-mute-btn${muted ? ' muted' : ''}`}
                onClick={toggleMute}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="100"
                value={muted ? 0 : volume}
                onChange={(e) => { if (muted) setMuted(false); handleVolume(e.target.value); }}
                orient="vertical"
              />
            </div>

          </div>

          {/* CTA label */}
          {label && <div className={`orb-label ${orbState}`}>{label}</div>}

          {/* Echo caption / subtitles — below "Tap to speak", cyan 20px */}
          {displayedCaption && (
            <div className="echo-caption">{displayedCaption}</div>
          )}

          {/* Text input with file upload */}
          <div className="text-input-wrap">
            <input
              type="text"
              className="text-input text-input--has-upload"
              placeholder={`Type your answer or attach a file, ${firstName}\u2026`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleTextSubmit}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach a file"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="upload-hidden"
              accept={ACCEPTED_TYPES}
              onChange={handleFileSelect}
            />
          </div>

          {/* File chip */}
          {pendingFile && (
            <div className="file-chip">
              <span className="file-chip__name">{pendingFile.name}</span>
              <button type="button" className="file-chip__remove" onClick={clearFile}>&times;</button>
            </div>
          )}

          {/* File error */}
          {fileError && (
            <p className="file-error">{fileError}</p>
          )}

          <p className="input-hint">Press Enter to submit &middot; or speak your answer</p>

          {/* Back / Pause / Skip navigation */}
          <div className="nav-row">
            <button type="button" className="nav-row__btn" onClick={onBack}>
              <span className="arrow">&lsaquo;</span> Back
            </button>
            <button type="button" className="nav-row__pause" onClick={onPause} title="Pause">
              &#9208;
            </button>
            <button type="button" className="nav-row__btn" onClick={onSkip}>
              Skip <span className="arrow">&rsaquo;</span>
            </button>
          </div>

          {/* Live conversation transcript */}
          <div className="transcript-panel">
            {transcript.length === 0 ? (
              <p className="transcript-empty">Your conversation will appear here...</p>
            ) : (
              transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`transcript-entry transcript-entry--${entry.role}${editingId === entry.id ? ' editing' : ''}`}
                  onMouseEnter={() => entry.role === 'user' && setHoveredId(entry.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onTouchStart={() => entry.role === 'user' && handleTouchStart(entry.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  <span className="transcript-role">
                    {entry.role === 'assistant' ? 'Echo' : 'You'}
                    <span className="transcript-ts">{entry.ts}</span>
                    {entry.edited && <span className="transcript-edited">(edited)</span>}
                  </span>
                  {editingId === entry.id ? (
                    <textarea
                      className="transcript-edit"
                      defaultValue={entry.text}
                      onBlur={(e) => saveEdit(entry.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(entry.id, e.target.value); } }}
                      autoFocus
                    />
                  ) : (
                    <p className="transcript-text">{entry.text}</p>
                  )}
                  {entry.role === 'user' && hoveredId === entry.id && editingId !== entry.id && (
                    <button
                      className="transcript-edit-btn"
                      onClick={() => setEditingId(entry.id)}
                      title="Edit response"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

        </div>
        {/* end .orb-card */}

        {/* Dev log panel (outside card) */}
        {showLog && (
          <div className="dev-log">
            {logs.map((entry, i) => (
              <div key={i} className={`log-entry ${entry.type}`}>
                <span className="log-ts">{entry.ts}</span> {entry.msg}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
      {/* end .orb-scrollable */}

      {/* ── Footer: Review + Pause ── */}
      <div className="orb-footer">
        <button type="button" className="orb-footer__btn" onClick={onReviewAnswers}>
          Review my answers
        </button>
        <button type="button" className="orb-footer__btn" onClick={onPause}>
          Pause &amp; save
        </button>
      </div>

    </div>
  );
}
