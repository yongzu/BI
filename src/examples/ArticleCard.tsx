import { Text } from '../components/Text/Text';
import './examples.css';

/**
 * Example: article card.
 * No size jumps — Label(700, ink) carries the title, Copy(400, gray) the summary,
 * Body(400, gray) the meta. The card only lifts (fill) on hover.
 */
type ArticleCardProps = {
  category: string;
  title: string;
  summary: string;
  meta: string;
  href?: string;
};

export function ArticleCard({ category, title, summary, meta, href = '#' }: ArticleCardProps) {
  return (
    <a className="article-card" href={href}>
      <Text as="span" typography="Body" color="secondary">{category}</Text>
      <Text as="h3" typography="Label">{title}</Text>
      <Text typography="Copy" color="secondary">{summary}</Text>
      <Text as="span" typography="Body" color="secondary" className="article-card__meta">{meta} →</Text>
    </a>
  );
}
