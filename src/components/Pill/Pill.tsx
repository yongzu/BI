import type { ComponentPropsWithoutRef } from 'react';
import './Pill.css';

/**
 * Quiet pressable pill. Idle = gray text on nothing; hover/selected = ink on fill.
 * No borders, no black fills — the fill tone alone signals state.
 */
type PillProps = ComponentPropsWithoutRef<'button'> & { selected?: boolean; count?: number };

export function Pill({ selected = false, count, className, children, ...rest }: PillProps) {
  return (
    <button type="button" aria-pressed={selected} className={['pill', className].filter(Boolean).join(' ')} {...rest}>
      {children}
      {count !== undefined && <span className="pill__count">{count}</span>}
    </button>
  );
}
