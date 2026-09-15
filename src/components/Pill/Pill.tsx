import type { ComponentPropsWithoutRef } from 'react';
import './Pill.css';

/**
 * Pressable chip. Always fully rounded — in this system radius signals "you can press this".
 * Selected = inverse (black) fill; resting = subtle gray fill.
 */
type PillProps = ComponentPropsWithoutRef<'button'> & { selected?: boolean; count?: number };

export function Pill({ selected = false, count, className, children, ...rest }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={['pill', 'typo-subtitle2', selected && 'pill--selected', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
      {count !== undefined && <span className="pill__count typo-caption1">{count}</span>}
    </button>
  );
}
