/** Semantic names shared by <Text /> and docs. Mirrors src/styles/tokens/typography.css. */
export const typographies = ['Display', 'Heading', 'Lead', 'Intro', 'Title', 'Label', 'Body'] as const;
export type Typography = (typeof typographies)[number];

export const textColors = ['primary', 'secondary', 'tertiary', 'inherit'] as const;
export type TextColor = (typeof textColors)[number];
