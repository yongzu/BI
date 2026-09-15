import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import './Dropdown.css';

/**
 * Dropdown panel with an animated open/close.
 * - autoOpen: opens by itself once the page is scrolled and the dropdown has risen
 *   into the upper part of the viewport; folds back when the page returns to the top.
 * - Click always toggles. A manual choice wins until the page is back at the top.
 * Height animates via grid-template-rows (0fr → 1fr), content surfaces from a blur,
 * the chevron flips. Stays in the DOM so the transition runs both ways.
 */
type DropdownProps = {
  label: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
  autoOpen?: boolean;
};

const TOP_EPSILON = 8; // px — "back at the top of the page"
const TRIGGER_LINE = 0.75; // opens when the dropdown's top passes 75% of the viewport height

export function Dropdown({ label, summary, children, className, autoOpen = false }: DropdownProps) {
  const [auto, setAuto] = useState(false);
  const [manual, setManual] = useState<boolean | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = manual ?? auto;

  useEffect(() => {
    if (!autoOpen) return;
    const update = () => {
      const el = root.current;
      if (!el) return;
      if (window.scrollY <= TOP_EPSILON) {
        setAuto(false);
        setManual(null);
        return;
      }
      if (el.getBoundingClientRect().top < window.innerHeight * TRIGGER_LINE) setAuto(true);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [autoOpen]);

  return (
    <div ref={root} className={['dropdown', className].filter(Boolean).join(' ')} data-open={open}>
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
