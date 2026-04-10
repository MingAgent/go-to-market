import { formPhases } from '../data/formSteps';

export default function ProgressBar({ currentPhase, totalPhases }) {
  const phase = formPhases[currentPhase];
  const progress = ((currentPhase + 1) / totalPhases) * 100;

  return (
    <div className="mb-8">
      {/* Phase counter + name */}
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-xs font-mono text-gray-500 tracking-wider">
          PHASE {String(currentPhase + 1).padStart(2, '0')} / {String(totalPhases).padStart(2, '0')}
        </span>
        <span className="text-sm font-mono text-[#00b4e6] tracking-wide">
          {phase?.name || 'Review'}
        </span>
      </div>

      {/* Bar */}
      <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#00b4e6] to-[#33c3eb] rounded-full progress-shimmer transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtitle */}
      {phase?.subtitle && (
        <p className="mt-2 text-xs font-mono text-gray-600 tracking-wide">
          {phase.subtitle}
        </p>
      )}
    </div>
  );
}
