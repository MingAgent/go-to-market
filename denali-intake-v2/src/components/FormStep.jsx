import { useState, useEffect } from 'react';
import FormField from './FormField';

export default function FormStep({ phase, formData, onChange, onMultiSelect }) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [phase.id]);

  return (
    <div key={animKey} className="slide-in">
      {/* Phase heading */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          {phase.name}
        </h2>
        <p className="text-xs font-mono text-[#00b4e6]/60 tracking-wider">
          {phase.subtitle}
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-6">
        {phase.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {field.label}
            </label>
            <FormField
              field={field}
              value={formData[field.key]}
              onChange={onChange}
              onMultiSelect={onMultiSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
