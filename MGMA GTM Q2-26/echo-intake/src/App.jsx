import { useState, useCallback } from 'react';
import Onboarding from './components/Onboarding';
import OrbLayout from './components/OrbLayout';
import { useVapi } from './hooks/useVapi';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('onboarding'); // 'onboarding' | 'orb'
  const [firstName, setFirstName] = useState('');
  const [currentPhase, setCurrentPhase] = useState(1);
  const [fadeClass, setFadeClass] = useState('');

  const vapi = useVapi();

  const handleOnboardingComplete = useCallback((name) => {
    setFirstName(name);
    setFadeClass('fade-out');
    setTimeout(() => {
      setScreen('orb');
      setFadeClass('fade-in');
    }, 600);
  }, []);

  const handlePhaseChange = useCallback((phase) => {
    if (vapi.callActive) vapi.stop();
    setCurrentPhase(phase);
    vapi.addLog(`Switched to Phase ${phase}`, 'event');
  }, [vapi]);

  return (
    <div className={`app-wrap ${fadeClass}`}>
      {screen === 'onboarding' ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <OrbLayout
          firstName={firstName}
          vapi={vapi}
          currentPhase={currentPhase}
          onPhaseChange={handlePhaseChange}
          questionIndex={0}
          questionCount={6}
          timeEstimate="~25 min remaining"
          answers={[]}
          onPause={() => vapi.addLog('Session paused & saved', 'event')}
          onReviewAnswers={() => vapi.addLog('Review answers requested', 'event')}
          onBack={() => vapi.addLog('Back requested', 'event')}
          onSkip={() => vapi.addLog('Skip requested', 'event')}
          currentQuestion="What is the name of your company, and in one sentence, what does it do?"
        />
      )}
    </div>
  );
}
