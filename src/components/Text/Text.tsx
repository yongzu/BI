import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import type { Typography, TextColor } from './typography';

/**
 * Base text component.
 * Every piece of text goes through one semantic typography + one semantic color,
 * so the page can never drift into ad-hoc sizes, weights or grays.
 *
 * <Text typography="Title1" color="primary">Programs</Text>
 */

/** Sensible default element per style, overridable with `as`. */
const defaultElement: Record<Typography, ElementType> = {
  Display1: 'h2',
  Display2: 'h2',
  Title1: 'h1',
  Title2: 'h2',
  Title3: 'h3',
  Subtitle1: 'h4',
  Subtitle2: 'p',
  Body1: 'p',
  Body2: 'p',
  Caption1: 'span',
  Caption2: 'span',
};

type TextProps<E extends ElementType> = {
  as?: E;
  typography: Typography;
  color?: TextColor;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'color' | 'children'>;

export function Text<E extends ElementType = 'p'>({
  as,
  typography,
  color = 'primary',
  className,
  children,
  ...rest
}: TextProps<E>) {
  const Component = as ?? defaultElement[typography];
  const classes = [`typo-${typography.toLowerCase()}`, `color-${color}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
