import { useEffect, useId, useState, type ReactNode } from 'react';
import './Dropdown.css';

/**
 * Dropdown panel with an animated open/close.
 * - autoOpen: opens by itself once, AUTO_OPEN_MS after the page loads — no scrolling needed
 *   (사용자 지시 2026-09-30). From then on only a click folds or unfolds it; scrolling or
 *   returning to the top never closes it.
 * - Click always toggles, and a click before the auto-open wins.
 * Height animates via grid-template-rows (0fr → 1fr), content surfaces from a blur,
 * the chevron flips. Stays in the DOM so the transition runs both ways.
 */
type DropdownProps = {
  label: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
  autoOpen?: boolean;
  /** Always open, no toggling — for an invisible copy that reserves the open height */
  staticOpen?: boolean;
};

const AUTO_OPEN_MS = 500;

export function Dropdown({ label, summary, children, className, autoOpen = false, staticOpen = false }: DropdownProps) {
  const [auto, setAuto] = useState(false);
  const [manual, setManual] = useState<boolean | null>(null);
  const id = useId();
  const open = staticOpen || (manual ?? auto);

  useEffect(() => {
    if (!autoOpen) return;
    const timer = window.setTimeout(() => setAuto(true), AUTO_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [autoOpen]);

  return (
    <div className={['dropdown', className].filter(Boolean).join(' ')} data-open={open}>
      <button type="button" className="dropdown__trigger" aria-expanded={open} aria-controls={id} onClick={() => setManual(!open)}>
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
