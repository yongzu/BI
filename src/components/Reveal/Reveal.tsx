import type { ReactNode } from 'react';
import './Reveal.css';

/**
 * Disclosure row from the Phi Brain style kit.
 * Idle: a dot bullet + gray label. Hover/open: the row slides 10px, the dot turns
 * into an arrow and the label floats on a soft white chip. On wide screens the
 * open content sits to the right of the label instead of pushing it down.
 */
type RevealProps = {
  label: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function Reveal({ label, meta, children, defaultOpen }: RevealProps) {
  return (
    <details className="reveal" open={defaultOpen}>
      <summary className="reveal__trigger">
        <span className="reveal__bullet" aria-hidden="true" />
        <span className="reveal__label">{label}</span>
        {meta && <span className="reveal__meta">{meta}</span>}
      </summary>
      <div className="reveal__content">{children}</div>
    </details>
  );
}

export function RevealList({ children }: { children: ReactNode }) {
  return <div className="reveal-list">{children}</div>;
}
