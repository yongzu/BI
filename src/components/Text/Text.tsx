import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import type { Typography, TextColor } from './typography';

/**
 * Base text component.
 * Every piece of text goes through one semantic typography + one semantic color,
 * so the page can never drift into ad-hoc sizes, weights or grays.
 *
 * <Text typography="Title" color="primary">Programs</Text>
 */

/** Sensible default element per style, overridable with `as`. */
const defaultElement: Record<Typography, ElementType> = {
  Title: 'h2',
  Heading: 'p',
  Label: 'h3',
  Body: 'p',
  Copy: 'p',
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
