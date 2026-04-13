import { useState, useRef, useEffect, useCallback } from 'react';
import VoiceToggle from './VoiceToggle';
import Echo1Logo from './Echo1Logo';
import { supabase } from '../lib/supabase';

// ── Colors ──
const CYAN = '#00b4e6';

// ── TTS playback via Web Speech API ──
const speakText = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
};

// ── Phase names for the indicator ──
const PHASE_NAMES = [
  'Router',             // 0
  'Identity Scan',      // 1
  'System Detection',   // 2
  'Engine Diagnostics', // 3
  'DNA Extraction',     // 4
  'Signal Lock',        // 5
  'Arsenal Loaded',     // 6
  'Broadcast Config',   // 7
  'Outreach Matrix',    // 8
  'Resource Allocation',// 9
  'Final Calibration',  // 10
];

const AIRTABLE_SYNC_URL = import.meta.env.VITE_AIRTABLE_SYNC_URL || '';

export default function ChatInterface({ squadId, sessionId, textProxyUrl, resumeParams }) {
  const [messages, setMessages] = useState(
    resumeParams?.conversationHistory
      ? resumeParams.conversationHistory.map((m, i) => ({
          role: m.role === 'assistant' ? 'agent' : 'user',
          text: m.content,
          ts: Date.now() - (resumeParams.conversationHistory.length - i) * 1000,
        }))
      : []
  );
  const [conversationHistory, setConversationHistory] = useState(
    resumeParams?.conversationHistory || []
  );
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(
    resumeParams?.currentPhase ?? (resumeParams?.resumeToken ? -1 : 0)
  );
  const [completedPhases, setCompletedPhases] = useState(
    resumeParams?.completedPhases || []
  );
  const [isComplete, setIsComplete] = useState(false);
  const [resumeToken, setResumeToken] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const sessionCreatedRef = useRef(false);
  const resumeGreetedRef = useRef(false);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Create / restore Supabase session on mount ──
  useEffect(() => {
    if (sessionCreatedRef.current) return;
    sessionCreatedRef.current = true;

    (async () => {
      const { data, error } = await supabase
        .from('denali_intake_sessions')
        .upsert(
          { session_id: sessionId, current_phase: currentPhase },
          { onConflict: 'session_id' }
        )
        .select('resume_token')
        .single();

      if (!error && data?.resume_token) {
        setResumeToken(data.resume_token);
      }
    })();
  }, [sessionId, currentPhase]);

  // ── Persist phase changes to Supabase ──
  useEffect(() => {
    if (!sessionCreatedRef.current) return;

    supabase
      .from('denali_intake_sessions')
      .update({
        current_phase: currentPhase,
        completed_phases: completedPhases,
      })
      .eq('session_id', sessionId)
      .then(({ error }) => {
        if (error) console.error('Phase sync error:', error);
      });
  }, [currentPhase, completedPhases, sessionId]);

  // ── Persist conversation history (debounced) ──
  useEffect(() => {
    if (!sessionCreatedRef.current || conversationHistory.length === 0) return;

    const timer = setTimeout(() => {
      supabase
        .from('denali_intake_sessions')
        .update({ conversation_history: conversationHistory })
        .eq('session_id', sessionId)
        .then(({ error }) => {
          if (error) console.error('History sync error:', error);
        });
    }, 2000);

    return () => clearTimeout(timer);
  }, [conversationHistory, sessionId]);

  // ── Load resume data if returning ──
  useEffect(() => {
    if (resumeParams?.resumeToken && !resumeGreetedRef.current) {
      resumeGreetedRef.current = true;
      if (!resumeParams.conversationHistory?.length) {
        addAgentMessage("Welcome back! Let me pick up where we left off...");
      }
    }
  }, [resumeParams]);

  // ── Agent initial greeting ──
  const greetedRef = useRef(false);
  useEffect(() => {
    if (resumeParams || greetedRef.current) return;
    const timer = setTimeout(() => {
      if (greetedRef.current) return;
      greetedRef.current = true;
      addAgentMessage(
        "Hi, I'm Echo — your intake guide. I'll walk you through 10 short phases to build your GTM blueprint. I may ask for links, documents, or the name and email of someone who can provide key details. How much time do you have right now?"
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [resumeParams]);

  // ── Message handlers ──
  const addAgentMessage = (text) => {
    setMessages((prev) => [...prev, { role: 'agent', text, ts: Date.now() }]);
    setConversationHistory((prev) => [...prev, { role: 'assistant', content: text }]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { role: 'user', text, ts: Date.now() }]);
    setConversationHistory((prev) => [...prev, { role: 'user', content: text }]);
  };

  // ── Phase change handler (from voice mode squad events) ──
  const handlePhaseChange = useCallback((phase) => {
    setCurrentPhase((prev) => {
      if (prev > 0 && prev !== phase) {
        setCompletedPhases((cp) => cp.includes(prev) ? cp : [...cp, prev]);
      }
      return phase;
    });
  }, []);

  // ── Sync completion to Supabase + Airtable ──
  const syncCompletion = useCallback(async (collectedData) => {
    await supabase
      .from('denali_intake_sessions')
      .update({
        status: 'completed',
        collected_data: collectedData,
        conversation_history: conversationHistory,
      })
      .eq('session_id', sessionId);

    if (AIRTABLE_SYNC_URL) {
      try {
        await fetch(AIRTABLE_SYNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            collected_data: collectedData,
            conversation_history: conversationHistory,
            completed_at: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error('Airtable sync error:', err);
      }
    }
  }, [sessionId, conversationHistory]);

  // ── Send text message via n8n proxy ──
  const sendTextMessage = useCallback(async (text) => {
    setIsTyping(true);
    try {
      const res = await fetch(textProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          current_phase: currentPhase,
          conversation_history: conversationHistory.concat([{ role: 'user', content: text }]),
        }),
      });

      if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
      const data = await res.json();

      setIsTyping(false);

      if (data.response) {
        addAgentMessage(data.response);
      }

      if (data.transfer_to_phase && data.transfer_to_phase !== currentPhase) {
        setCompletedPhases((cp) => cp.includes(currentPhase) ? cp : [...cp, currentPhase]);
        setCurrentPhase(data.transfer_to_phase);
      }

      if (data.transfer_to_phase === 'complete' || currentPhase === 10) {
        const allDone = [...completedPhases, currentPhase].length >= 10;
        if (allDone) {
          setIsComplete(true);
          syncCompletion(data.collected_data || {});
        }
      }
    } catch (err) {
      console.error('Text proxy error:', err);
      setIsTyping(false);
      addAgentMessage("I had a brief connection issue. Could you repeat that?");
    }
  }, [textProxyUrl, sessionId, currentPhase, conversationHistory, completedPhases, syncCompletion]);

  // ── Handle send (text mode) ──
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);
    setInput('');
    sendTextMessage(trimmed);
  }, [input, sendTextMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Voice transcript callback ──
  const handleVoiceTranscript = useCallback((transcript) => {
    if (transcript) {
      addUserMessage(transcript);
    }
  }, []);

  // ── Playback handler — read last agent message aloud ──
  const handlePlayback = useCallback(() => {
    const lastAgentMsg = [...messages].reverse().find((m) => m.role === 'agent');
    if (!lastAgentMsg) return;
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const utter = new SpeechSynthesisUtterance(lastAgentMsg.text);
    utter.rate = 0.95;
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis?.speak(utter);
  }, [messages, isSpeaking]);

  // ── File upload handler ──
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addUserMessage(`📎 Uploaded: ${file.name}`);
    // TODO: Upload file to Supabase storage and send URL to agent
    e.target.value = '';
  }, []);

  // Get latest agent message + all agent messages for history
  const lastAgent = [...messages].reverse().find((m) => m.role === 'agent');
  const agentMessages = messages.filter((m) => m.role === 'agent');

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Phase indicator — thin subtle bar ── */}
      {currentPhase > 0 && (
        <div className="px-4 pt-2 pb-1 flex-shrink-0">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }, (_, i) => {
              const phaseNum = i + 1;
              const isCompleted = completedPhases.includes(phaseNum);
              const isCurrent = phaseNum === currentPhase;
              return (
                <div key={phaseNum} className="flex-1 group relative">
                  <div
                    className="h-0.5 rounded-full transition-all duration-500"
                    style={{
                      background: isCompleted || isCurrent ? CYAN : '#1a2332',
                      boxShadow: isCurrent ? `0 0 6px ${CYAN}60` : 'none',
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <span
                      className="text-[9px] font-mono whitespace-nowrap px-2 py-0.5 rounded"
                      style={{
                        background: '#0a0f14',
                        color: isCompleted || isCurrent ? CYAN : '#555',
                        border: '1px solid #1a2332',
                      }}
                    >
                      {PHASE_NAMES[phaseNum]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] font-mono text-gray-700 text-center mt-1">
            {isComplete ? 'COMPLETE' : `PHASE ${currentPhase}/10`}
          </p>
        </div>
      )}

      {/* ── Hero zone: orb + echo branding + messages + input ── */}
      <div className="flex-1 flex flex-col items-center px-4 min-h-0 overflow-y-auto">
        {isComplete ? (
          <div className="text-center fade-in my-auto">
            <p className="text-sm font-mono tracking-widest" style={{ color: CYAN }}>
              ALL PARAMETERS CAPTURED
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Your GTM blueprint is being compiled. We'll be in touch within 24 hours.
            </p>
          </div>
        ) : (
          <>
            {/* Spacer to push orb to ~30% from top */}
            <div className="flex-shrink-0" style={{ height: '18vh' }} />

            {/* Voice orb */}
            <div className="flex-shrink-0">
              <VoiceToggle
                squadId={squadId}
                sessionId={sessionId}
                resumePhase={resumeParams?.resumePhase || null}
                isActive={isVoiceActive}
                onToggle={setIsVoiceActive}
                onTranscript={handleVoiceTranscript}
                onPhaseChange={handlePhaseChange}
              />
            </div>

            {/* echo branding */}
            <p
              className="mt-3 text-xs tracking-[0.4em] uppercase font-mono flex-shrink-0"
              style={{ color: `${CYAN}50` }}
            >
              echo
            </p>

            {/* DENALI logo + rabbit */}
            <div className="mt-2 flex items-center gap-3 flex-shrink-0">
              <svg className="w-5 h-5 rabbit-glow" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 16a3 3 0 0 1 2.24 5" />
                <path d="M18 12h.01" />
                <path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" />
                <path d="M20 8.54V4a2 2 0 1 0-4 0v3" />
                <path d="M7.612 12.524a3 3 0 1 0-1.6 4.3" />
              </svg>
              <Echo1Logo size="sm" />
            </div>

            {/* ── Conversation history — persistent messages ── */}
            <div className="mt-4 w-full max-w-lg flex-1 min-h-0 overflow-y-auto px-2">
              {messages.map((msg, i) => (
                <div
                  key={msg.ts + i}
                  className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  {msg.role === 'agent' ? (
                    <div className="inline-block text-left max-w-[90%]">
                      <p className="text-base leading-relaxed text-gray-300">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div className="inline-block text-right max-w-[85%]">
                      <p
                        className="text-sm leading-relaxed px-3 py-1.5 rounded-2xl inline-block"
                        style={{ background: '#0d1f2d', color: CYAN }}
                      >
                        {msg.text}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="mb-3 text-left">
                  <div className="flex gap-1.5 items-center py-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CYAN, animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CYAN, animationDelay: '200ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CYAN, animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Playback button — replay last Echo message ── */}
            {lastAgent && (
              <div className="flex-shrink-0 mt-2">
                <button
                  onClick={handlePlayback}
                  className="flex items-center gap-1.5 text-[10px] font-mono transition-colors px-3 py-1 rounded-full"
                  style={{
                    color: isSpeaking ? CYAN : '#555',
                    border: `1px solid ${isSpeaking ? CYAN + '40' : '#222'}`,
                  }}
                >
                  {isSpeaking ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h4v12H6zm8 0h4v12h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  )}
                  {isSpeaking ? 'stop' : 'replay'}
                </button>
              </div>
            )}

            {/* ── Input zone — with upload button ── */}
            <div className="flex-shrink-0 mt-4 mb-4 w-full max-w-md mx-auto px-2 pb-safe">
              <div className="flex items-center gap-2">
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isVoiceActive || isComplete}
                  className="p-1.5 transition-opacity disabled:opacity-20 flex-shrink-0"
                  style={{ color: '#555' }}
                  title="Upload file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg"
                />
                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isVoiceActive ? 'Listening...' : isComplete ? 'Complete' : 'Type a response...'}
                  disabled={isVoiceActive || isComplete}
                  className="flex-1 bg-transparent border-b border-gray-800/60 text-gray-300 text-sm py-2 px-1 placeholder-gray-700 focus:border-[#00b4e6]/40 focus:outline-none transition-colors disabled:opacity-30"
                />
                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isVoiceActive || isComplete}
                  className="p-1.5 transition-opacity disabled:opacity-20 flex-shrink-0"
                  style={{ color: input.trim() ? CYAN : '#333' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-[9px] font-mono text-gray-700 text-center mt-2">
                {isComplete
                  ? 'intake complete'
                  : isVoiceActive
                    ? 'voice active — speak naturally'
                    : 'tap orb to talk · type below'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
