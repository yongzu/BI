import { useId, useState, type ReactNode } from 'react';
import './Disclosure.css';

/**
 * Accordion row. Collapsed it shows only what's needed to compare (summary);
 * the long content is one press away. Rounded because it's pressable.
 */
type DisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: 'default' | 'inverse';
};

export function Disclosure({ summary, children, defaultOpen = false, tone = 'default' }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className={`disclosure disclosure--${tone}`} data-open={open}>
      <button
        type="button"
        className="disclosure__trigger"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="disclosure__summary">{summary}</span>
        <span className="disclosure__icon" aria-hidden="true" />
      </button>
      <div id={id} className="disclosure__panel" role="region" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
