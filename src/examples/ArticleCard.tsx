import { Text } from '../components/Text/Text';
import './examples.css';

/**
 * Example: typography + monotone color on a simple article card.
 * - Caption2 / tertiary : category (quiet, but readable — gray-500 passes AA)
 * - Title3  / primary   : the one thing to read first
 * - Body2   / secondary : supporting copy
 * - Caption1/ tertiary  : meta
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
      <Text typography="Caption2" color="tertiary">{category}</Text>
      <Text as="h3" typography="Title3" color="primary">{title}</Text>
      <Text typography="Body2" color="secondary">{summary}</Text>
      <Text typography="Caption1" color="tertiary" className="article-card__meta">{meta}</Text>
    </a>
  );
}
