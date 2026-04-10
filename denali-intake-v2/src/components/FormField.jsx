/**
 * Renders a single form field based on its type definition.
 */
export default function FormField({ field, value, onChange, onMultiSelect }) {
  const baseInput =
    'w-full px-4 py-3 bg-[#0a0f14] border border-gray-800 rounded-lg text-white placeholder-gray-600 transition-all duration-200';

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <input
          type={field.type}
          value={value || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={baseInput}
          placeholder={field.placeholder || ''}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          min={field.min ?? 0}
          max={field.max ?? undefined}
          value={value || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={baseInput}
          placeholder={field.placeholder || '0'}
        />
      );

    case 'currency':
      return (
        <div className="flex">
          <span className="inline-flex items-center px-4 py-3 bg-[#0a0f14] border border-r-0 border-gray-800 rounded-l-lg text-[#00b4e6] font-mono text-sm">
            $
          </span>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${baseInput} rounded-l-none`}
            placeholder={field.placeholder || '0'}
          />
        </div>
      );

    case 'color':
      return (
        <div className="flex gap-4 items-center">
          <input
            type="color"
            value={value || '#2E8B8B'}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="w-14 h-12 rounded-lg border border-gray-800 bg-[#0a0f14]"
          />
          <input
            type="text"
            value={value || '#2E8B8B'}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${baseInput} flex-1 font-mono text-sm`}
            placeholder="#000000"
          />
        </div>
      );

    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={3}
          className={`${baseInput} resize-none`}
          placeholder={field.placeholder || ''}
        />
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={baseInput}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'multiselect':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {field.options?.map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  checked
                    ? 'bg-[#00b4e6]/10 border-[#00b4e6]/40 text-white'
                    : 'bg-[#0a0f14] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onMultiSelect(field.key, opt)}
                  className="w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}
