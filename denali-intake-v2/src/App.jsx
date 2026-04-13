import { useState, useMemo, useEffect } from 'react';
import TypewriterIntro from './components/TypewriterIntro';
import ChatInterface from './components/ChatInterface';
import { supabase } from './lib/supabase';

// ── Squad config from environment ──
const VAPI_SQUAD_ID = import.meta.env.VITE_SQUAD_ID || '014719ec-ef30-477d-bb34-8f95ee0000ca';
const TEXT_PROXY_URL = import.meta.env.VITE_TEXT_PROXY_URL || 'https://mingma-dev.app.n8n.cloud/webhook/denali-text-proxy';

export default function App() {
  const [screen, setScreen] = useState('intro'); // 'intro' | 'consent' | 'agent' | 'loading'
  const [resumeData, setResumeData] = useState(null);

  // ── Parse resume token from URL if returning user ──
  const resumeToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('resume') || null;
  }, []);

  // ── Fetch resume session from Supabase ──
  useEffect(() => {
    if (!resumeToken) return;

    setScreen('loading');

    (async () => {
      const { data, error } = await supabase
        .from('denali_intake_sessions')
        .select('session_id, current_phase, completed_phases, conversation_history, collected_data')
        .eq('resume_token', resumeToken)
        .single();

      if (error || !data) {
        console.error('Resume fetch error:', error);
        setResumeData({ resumeToken });
      } else {
        setResumeData({
          resumeToken,
          sessionId: data.session_id,
          currentPhase: data.current_phase,
          completedPhases: data.completed_phases || [],
          conversationHistory: data.conversation_history || [],
          collectedData: data.collected_data || {},
        });
      }
      setScreen('agent');
    })();
  }, [resumeToken]);

  // ── Generate session ID ──
  const sessionId = useMemo(() => {
    if (resumeData?.sessionId) return resumeData.sessionId;
    if (resumeToken) return `resume-${resumeToken}`;
    return `den-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }, [resumeToken, resumeData]);

  // ── Loading state ──
  if (screen === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-xs font-mono text-gray-600 animate-pulse">Restoring session...</p>
      </div>
    );
  }

  // ── Intro screen (skip if resuming) — consent is embedded in TypewriterIntro ──
  if (screen === 'intro' && !resumeToken) {
    return <TypewriterIntro onComplete={() => setScreen('agent')} />;
  }

  // ── Agent screen — full viewport, no card ──
  return (
    <div className="h-screen flex flex-col">
      <ChatInterface
        squadId={VAPI_SQUAD_ID}
        sessionId={sessionId}
        textProxyUrl={TEXT_PROXY_URL}
        resumeParams={resumeData}
      />
    </div>
  );
}
