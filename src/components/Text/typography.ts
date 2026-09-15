/** Semantic names shared by <Text /> and docs. Mirrors src/styles/tokens/typography.css. */
export const typographies = [
  'Display1',
  'Display2',
  'Title1',
  'Title2',
  'Title3',
  'Subtitle1',
  'Subtitle2',
  'Body1',
  'Body2',
  'Caption1',
  'Caption2',
] as const;
export type Typography = (typeof typographies)[number];

export const textColors = [
  'primary',
  'secondary',
  'tertiary',
  'disabled',
  'inverse',
  'inverseSecondary',
  'inverseTertiary',
  'inherit',
] as const;
export type TextColor = (typeof textColors)[number];
