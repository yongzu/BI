import { useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import './Dropdown.css';

/**
 * Dropdown panel with an animated open/close.
 * - Hover (mouse): opens as a preview while the pointer is over the dropdown.
 * - Click: pins it open; click again to unpin and close.
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
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const suppressHover = useRef(false);
  const id = useId();
  const open = pinned || hovered;

  const enter = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !suppressHover.current) setHovered(true);
  };
  const leave = () => {
    suppressHover.current = false;
    setHovered(false);
  };
  const toggle = () => {
    if (pinned) {
      // Unpinning while still hovering: close now, re-arm hover after the pointer leaves
      suppressHover.current = true;
      setHovered(false);
    }
    setPinned(!pinned);
  };

  return (
    <div
      className={['dropdown', className].filter(Boolean).join(' ')}
      data-open={open}
      data-pinned={pinned}
      onPointerEnter={enter}
      onPointerLeave={leave}
    >
      <button type="button" className="dropdown__trigger" aria-expanded={open} aria-pressed={pinned} aria-controls={id} onClick={toggle}>
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
