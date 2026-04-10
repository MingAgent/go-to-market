import { formPhases } from '../data/formSteps';

export default function ReviewStep({ formData }) {
  return (
    <div className="slide-in">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          System Armed
        </h2>
        <p className="text-xs font-mono text-[#00b4e6]/60 tracking-wider">
          // review all parameters before launch
        </p>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {formPhases.map((phase, idx) => {
          const filledFields = phase.fields.filter((f) => {
            const v = formData[f.key];
            if (Array.isArray(v)) return v.length > 0;
            return v !== '' && v !== undefined && v !== null;
          });

          if (filledFields.length === 0) return null;

          return (
            <div key={phase.id} className="fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono text-gray-600">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="text-sm font-semibold text-[#00b4e6] tracking-wide uppercase">
                  {phase.name}
                </h3>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
              <div className="bg-[#0a0f14] rounded-lg p-4 border border-gray-800/50 space-y-2">
                {filledFields.map((f) => (
                  <div key={f.key} className="flex flex-wrap gap-x-2 text-sm">
                    <span className="text-gray-500 font-medium">{f.label}:</span>
                    <span className="text-gray-300">
                      {Array.isArray(formData[f.key])
                        ? formData[f.key].join(', ')
                        : String(formData[f.key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
