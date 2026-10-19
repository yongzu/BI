import { useState } from 'react';
import { Text } from '../Text/Text';
import type { Pillar } from '../../data/programs';
import './ValueList.css';

/**
 * 역량과 태도(v6, 2026-10-19) — toss.im/company의 Culture 형식.
 * 묶음마다 왼쪽에 라벨 + 한 줄 정의(넓은 화면에서 sticky), 오른쪽에 줄: 번호 · 한글 + 영문 이름 · 요약 한 줄.
 * 요약은 늘 보이고(대부분 읽어야 하는 정보는 숨기지 않는다), 줄을 누르면 그 줄만 전문이 펼쳐진다(10.15 결정).
 * 호버는 "누를 수 있음" 신호(회색 면 · 꺾쇠 진해짐)까지만 — 마우스를 올려 펼치던 v5 동작은 없앴다.
 * 여러 줄을 함께 열 수 있다.
 */
type Group = { id: string; name: string; en: string; definition: string; items: Pillar[] };

export function ValueList({ groups }: { groups: Group[] }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (!next.delete(id)) next.add(id);
    return next;
  });

  return (
    <div className="values">
      {groups.map((g) => (
        <section key={g.id} id={g.id} className="value-group" aria-labelledby={`${g.id}-name`}>
          <header className="value-group__label">
            <span className="value-group__dot" aria-hidden="true" />
            <span className="value-group__names">
              <Text as="h3" id={`${g.id}-name`} typography="Title">{g.name}</Text>
              <Text as="span" typography="Label" color="tertiary">{g.en}</Text>
            </span>
            <Text as="p" typography="Meta" color="secondary" className="value-group__def">{g.definition}</Text>
          </header>
          <ol className="value-rows">
            {g.items.map((p, i) => {
              const id = `${g.id}-${p.en.replace(/\s+/g, '-').toLowerCase()}`;
              const isOpen = open.has(id);
              return (
                <li key={id} className="value-row" data-open={isOpen}>
                  <button type="button" className="value-row__hit" aria-expanded={isOpen} aria-controls={`${id}-body`} onClick={() => toggle(id)}>
                    <Text as="span" typography="Label" color="tertiary" className="value-row__num">{String(i + 1).padStart(2, '0')}</Text>
                    <span className="value-row__names">
                      <Text as="span" typography="Title">{p.ko}</Text>
                      <Text as="span" typography="Label" color="tertiary">{p.en}</Text>
                    </span>
                    <Text as="span" typography="Body" color="secondary" className="value-row__summary">{p.summary}</Text>
                    <span className="value-row__chevron" aria-hidden="true" />
                  </button>
                  <div id={`${id}-body`} className="value-row__panel" role="region" aria-label={p.ko} inert={!isOpen}>
                    <div className="value-row__clip">
                      <Text typography="Body" color="secondary" className="value-row__body">{p.body}</Text>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
