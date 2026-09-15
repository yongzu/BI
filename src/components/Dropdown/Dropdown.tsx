import { useId, useState, type ReactNode } from 'react';
import './Dropdown.css';

/**
 * Dropdown panel with an animated open/close.
 * Height animates via grid-template-rows (0fr → 1fr), content fades and rises in,
 * the chevron flips. Stays in the DOM so the transition runs both ways.
 */
type DropdownProps = {
  label: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Dropdown({ label, summary, children, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className={['dropdown', className].filter(Boolean).join(' ')} data-open={open}>
      <button type="button" className="dropdown__trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <span className="dropdown__label">{label}</span>
        {summary && <span className="dropdown__summary">{summary}</span>}
        <span className="dropdown__chevron" aria-hidden="true" />
      </button>
      <div id={id} className="dropdown__panel" role="region" aria-hidden={!open} inert={!open}>
        <div className="dropdown__inner">{children}</div>
      </div>
    </div>
  );
}
