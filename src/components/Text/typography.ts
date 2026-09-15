/** Semantic names shared by <Text /> and docs. Mirrors src/styles/tokens/typography.css. */
export const typographies = ['Title', 'Heading', 'Label', 'Body', 'Copy'] as const;
export type Typography = (typeof typographies)[number];

export const textColors = ['primary', 'secondary', 'disabled', 'inherit'] as const;
export type TextColor = (typeof textColors)[number];
