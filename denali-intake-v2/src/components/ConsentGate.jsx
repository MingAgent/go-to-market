import { useState } from 'react';

const CYAN = '#00b4e6';

export default function ConsentGate({ onAccept, onDecline }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Shield icon */}
      <div className="mb-8 fade-in">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: 'radial-gradient(circle at 40% 35%, #0a2a3f, #040d14)',
            border: `2px solid ${CYAN}30`,
            boxShadow: `0 0 30px rgba(0, 180, 230, 0.15), 0 0 60px rgba(0, 180, 230, 0.08)`,
          }}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2
        className="text-2xl sm:text-3xl font-light text-center mb-4 fade-in"
        style={{ color: CYAN }}
      >
        Before we begin
      </h2>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-gray-400 text-center max-w-md leading-relaxed mb-8 fade-in">
        We take your privacy and data seriously.
        <br />
        <span className="text-gray-500 text-sm">
          Please review and accept the following to continue.
        </span>
      </p>

      {/* Legal content */}
      <div
        className="max-w-lg w-full rounded-lg p-6 mb-8 fade-in"
        style={{
          background: '#0a0f14',
          border: '1px solid #1a2332',
        }}
      >
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          By clicking <strong style={{ color: CYAN }}>"Accept"</strong> below, you acknowledge and agree to the following:
        </p>

        <ul className="text-xs text-gray-500 space-y-3 mb-4">
          <li className="flex gap-2">
            <span style={{ color: CYAN }}>›</span>
            <span>
              <strong className="text-gray-400">Consent to Contact:</strong> You consent to receive
              communications from GTM Engine / Mingma Inc via email, SMS, and voice at the contact
              information you provide during this intake.
            </span>
          </li>
          <li className="flex gap-2">
            <span style={{ color: CYAN }}>›</span>
            <span>
              <strong className="text-gray-400">A2P Messaging Authorization:</strong> You authorize
              GTM Engine to send application-to-person (A2P) messages related to your go-to-market
              plan, including status updates, follow-ups, and deliverables.
            </span>
          </li>
          <li className="flex gap-2">
            <span style={{ color: CYAN }}>›</span>
            <span>
              <strong className="text-gray-400">Voice Recording:</strong> Your voice interactions
              with Echo may be recorded and transcribed to build your personalized blueprint.
            </span>
          </li>
          <li className="flex gap-2">
            <span style={{ color: CYAN }}>›</span>
            <span>
              <strong className="text-gray-400">Data Usage:</strong> Information collected during
              this intake will be used solely to generate your business go-to-market plan and will
              not be sold to third parties.
            </span>
          </li>
        </ul>

        {/* Expandable full terms */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-mono tracking-wide transition-colors"
          style={{ color: CYAN, userSelect: 'auto' }}
        >
          {expanded ? '▾ HIDE FULL TERMS' : '▸ VIEW FULL TERMS'}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-600 leading-relaxed space-y-2">
            <p>
              Message and data rates may apply. Message frequency varies. Reply STOP to opt out of
              SMS at any time. Reply HELP for assistance.
            </p>
            <p>
              This consent is not a condition of purchase. You may revoke consent at any time by
              contacting support@mingma.io or replying STOP to any message.
            </p>
            <p>
              By providing your phone number, you confirm that you are the subscriber or authorized
              user of the number provided and consent to receive autodialed and/or pre-recorded
              messages from GTM Engine / Mingma Inc.
            </p>
            <p>
              For more information, see our Privacy Policy and Terms of Service at mingma.io.
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-6 fade-in-slow">
        <button
          onClick={onDecline}
          className="px-12 py-5 rounded-full text-sm font-mono transition-all duration-300"
          style={{
            color: '#666',
            border: '2.5px solid #444',
            background: 'transparent',
          }}
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="px-12 py-5 rounded-full text-sm font-mono transition-all duration-300 hover:scale-105"
          style={{
            color: '#fff',
            background: '#0a1929',
            border: `2.5px solid ${CYAN}`,
            boxShadow: `0 0 20px rgba(0, 180, 230, 0.2)`,
          }}
        >
          Accept & Continue
        </button>
      </div>

      {/* TCPA footer */}
      <p className="mt-12 text-[9px] font-mono text-gray-700 text-center max-w-sm">
        TCPA compliant · A2P authorized · Your data is encrypted in transit and at rest
      </p>
    </div>
  );
}
