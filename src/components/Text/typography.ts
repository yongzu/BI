/** Semantic names shared by <Text /> and docs. Mirrors src/styles/tokens/typography.css. */
export const typographies = [
  'Hero',
  'Headline',
  'Stat',
  'Eyebrow',
  'Title',
  'Intro',
  'Body',
  'Label',
  'Caption',
  'Footnote',
] as const;
export type Typography = (typeof typographies)[number];

export const textColors = ['primary', 'secondary', 'tertiary', 'inverse', 'inherit'] as const;
export type TextColor = (typeof textColors)[number];
