import { useLayoutEffect, useRef, useState } from 'react';
import { Text } from '../Text/Text';
import './PillarStrip.css';

/**
 * 역량과 태도 — 가로 두 줄(역량 · 태도), 줄마다 상자 다섯(사용자 지시 2026-10-12).
 * AI in Design Report 2026의 사례 카드 줄을 따른다: 마우스를 올린 상자가 옆으로 넓어지고(나머지는 그만큼 좁아짐)
 * 아래로 길어지며 전체 설명이 나온다. 이미지가 없으므로 상자 안에 번호 · 제목 · 영어 제목 · 한 줄 설명.
 *
 * - 누르면 그 상자가 펼친 채 고정된다. 고정은 하나뿐 — 다른 상자를 눌러야 풀린다(같은 상자를 다시 눌러도 그대로).
 * - 고정된 상자가 있어도 다른 상자에 마우스를 올리면 그 상자가 잠깐 펼쳐진다(줄마다 펼치는 상자는 하나).
 *   마우스가 떠나면 고정된 상자로 돌아간다.
 * - 줄이 나뉘어 있어 역량 줄과 태도 줄은 따로 펼친다 — 한 줄의 상자가 넓어져도 다른 줄은 그대로.
 * - 터치 · 키보드는 호버가 없으므로 누름(탭 · Enter)으로만 펼친다.
 *
 * 폭에 따라 형태를 바꾼다(사용자 지시 2026-10-14). 가로 상자는 닫힌 상자 글 폭이 150px쯤은 돼야 단어가 쪼개지지 않는다 —
 * 닫힌 상자 180px × 6.4몫 + 간격 ≈ 줄 폭 1200px. 그보다 좁으면 'list': 상자를 한 줄씩 쌓고(번호 · 제목 · 한 줄 설명을
 * 가로로), 누른 줄만 아래로 펼친다. 줄 목록에선 호버로 펼치지 않는다 — 마우스가 지나갈 때마다 줄이 늘었다 줄면 목록이 출렁인다.
 * 기준은 화면이 아니라 이 줄의 실제 폭이다(넓은 띠 · 여백이 바뀌어도 그대로 맞는다).
 */

export type StripItem = { id: string; title: string; en: string; summary: string; body: string };
export type StripRow = { id: string; title: string; en: string; items: StripItem[] };

const MIN_STRIP_WIDTH = 1200; // 이보다 좁으면 줄 목록

export function PillarStrip({ rows }: { rows: StripRow[] }) {
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [layout, setLayout] = useState<'strip' | 'list'>('strip');
  const root = useRef<HTMLDivElement>(null);

  // 첫 그림 전에 재서 가로 상자 → 목록으로 튀는 장면이 보이지 않게
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => setLayout(el.clientWidth >= MIN_STRIP_WIDTH ? 'strip' : 'list');
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={root} className="pillar-strip" data-layout={layout}>
      {rows.map((row) => {
        // 이 줄에서 펼칠 상자: 마우스가 이 줄 상자 위에 있으면 그것, 아니면 이 줄의 고정된 상자
        const inRow = (id: string | null) => (id && row.items.some((it) => it.id === id) ? id : null);
        const open = (layout === 'strip' ? inRow(hovered) : null) ?? inRow(pinned);
        return (
          <section key={row.id} className="pillar-strip__row" aria-label={`${row.title} · ${row.en}`}>
            <div className="group-label">
              <Text as="h3" typography="Title">{row.title}</Text>
              <Text as="span" typography="Label" color="tertiary">{row.en}</Text>
            </div>
            <div className="pillar-strip__track" data-has-open={open != null} onPointerLeave={() => setHovered(null)}>
              {row.items.map((it, i) => {
                const isOpen = it.id === open;
                return (
                  // 상자 어디를 눌러도(펼친 설명 포함) 고정 — 버튼의 click도 여기로 올라온다
                  <article
                    key={it.id}
                    className="pillar-strip__card"
                    data-open={isOpen}
                    data-pinned={it.id === pinned}
                    onPointerEnter={(e) => { if (e.pointerType === 'mouse' && layout === 'strip') setHovered(it.id); }}
                    // 줄 목록에선 펼친 줄을 다시 누르면 닫힌다(수업 장치 박스와 같은 조작)
                    onClick={() => setPinned(layout === 'list' && pinned === it.id ? null : it.id)}
                  >
                    <button
                      type="button"
                      className="pillar-strip__hit"
                      aria-expanded={isOpen}
                      aria-pressed={it.id === pinned}
                      aria-controls={`strip-${it.id}`}
                    >
                      <Text as="span" typography="Label" color="tertiary" className="pillar-strip__num">{String(i + 1).padStart(2, '0')}</Text>
                      <span className="pillar-strip__titles">
                        <Text as="span" typography="Title" className="pillar-strip__title">{it.title}</Text>
                        <Text as="span" typography="Label" color="tertiary">{it.en}</Text>
                      </span>
                      <Text as="span" typography="Body" color="secondary" className="pillar-strip__summary">{it.summary}</Text>
                    </button>
                    {/* 전체 설명: 높이 0fr → 1fr. 글 폭은 '펼친 상자 폭'으로 고정해 두어 상자가 넓어지는 동안 줄바꿈이 출렁이지 않는다 */}
                    <div id={`strip-${it.id}`} className="pillar-strip__panel" role="region" aria-label={it.title} aria-hidden={!isOpen}>
                      <div className="pillar-strip__clip">
                        <Text typography="Body" color="secondary" className="pillar-strip__body">{it.body}</Text>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
