import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import type { Typography, TextColor } from './typography';

/**
 * Base text component.
 * Every piece of text goes through one semantic typography + one semantic color,
 * so the page can never drift into ad-hoc sizes, weights or grays.
 *
 * <Text typography="Heading" color="primary">역량과 태도</Text>
 */

/** Sensible default element per style, overridable with `as`. */
const defaultElement: Record<Typography, ElementType> = {
  Display: 'h1',
  Heading: 'h2',
  Subheading: 'h2',
  Lead: 'p',
  Intro: 'p',
  Title: 'h3',
  Label: 'p',
  Body: 'p',
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
