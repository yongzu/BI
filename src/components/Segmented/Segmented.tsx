import './Segmented.css';

/** Segmented control: gray track, white knob on the selected option (Apple tab switcher). */
type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: Option<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className="segmented__option typo-caption"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
