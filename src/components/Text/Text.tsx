import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import type { Typography, TextColor } from './typography';

/**
 * Base text component.
 * Every piece of text goes through one semantic typography + one semantic color,
 * so the page can never drift into ad-hoc sizes, weights or grays.
 *
 * <Text typography="Headline" color="primary">한눈에 보기.</Text>
 */

/** Sensible default element per style, overridable with `as`. */
const defaultElement: Record<Typography, ElementType> = {
  Hero: 'h1',
  Headline: 'h2',
  Stat: 'p',
  Eyebrow: 'h2',
  Title: 'h3',
  Intro: 'p',
  Body: 'p',
  Label: 'p',
  Caption: 'p',
  Footnote: 'p',
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
