import { Text } from '../Text/Text';
import type { Pillar } from '../../data/programs';
import './PillarBox.css';

/**
 * One competency / attitude as a box (사용자 지시 2026-09-22).
 * - Resting: only the Korean name and the English label — the explanation stays hidden.
 * - Hover (mouse): the same kind of preview as 주요 수업들 grows over the box and the
 *   explanation surfaces line by line.
 * - Click: pins that preview open; click it again (or anywhere outside the section) to let go.
 * The preview floats above the column, so opening one never reflows the layout.
 */
type Props = {
  index: number;
  pillar: Pillar;
  pinned: boolean;
  onToggle: () => void;
};

export function PillarBox({ index, pillar, pinned, onToggle }: Props) {
  const number = String(index + 1).padStart(2, '0');
  return (
    <article className="pillar-box" data-pinned={pinned}>
      <button type="button" className="pillar-box__hit" aria-pressed={pinned} aria-label={`${pillar.ko} ${pillar.en} — ${pinned ? '고정 해제' : '설명 고정'}`} onClick={onToggle}>
        <span className="pillar-box__face">
          <Text as="span" typography="Label" color="tertiary">{number}</Text>
          <Text as="span" typography="Title" className="pillar-box__name">{pillar.ko}</Text>
          <Text as="span" typography="Label" color="tertiary">{pillar.en}</Text>
        </span>
        <span className="pillar-box__preview">
          <span className="pillar-box__preview-inner">
            <Text as="span" typography="Label" color="tertiary">{number} · {pillar.en}</Text>
            <Text as="span" typography="Title">{pillar.ko}</Text>
            <Text as="span" typography="Body" color="secondary">{pillar.body}</Text>
          </span>
        </span>
      </button>
    </article>
  );
}
