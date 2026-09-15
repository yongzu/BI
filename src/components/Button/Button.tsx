import type { ComponentPropsWithoutRef } from 'react';
import './Button.css';

/**
 * Pill button (Apple 980px radius). Monotone: primary = ink fill, secondary = gray control.
 */
type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return <button type="button" className={['button', `button--${variant}`, `button--${size}`, className].filter(Boolean).join(' ')} {...rest} />;
}

/** Round icon button: plus / close / previous / next. */
type IconButtonProps = ComponentPropsWithoutRef<'button'> & {
  icon: 'plus' | 'close' | 'prev' | 'next';
  label: string;
  tone?: 'control' | 'action';
};

export function IconButton({ icon, label, tone = 'control', className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} className={['icon-button', `icon-button--${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        {icon === 'plus' && <path d="M10 4v12M4 10h12" />}
        {icon === 'close' && <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />}
        {icon === 'prev' && <path d="M12 4.5L6.5 10l5.5 5.5" />}
        {icon === 'next' && <path d="M8 4.5l5.5 5.5L8 15.5" />}
      </svg>
    </button>
  );
}
