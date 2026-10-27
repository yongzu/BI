import { useEffect, useId, useRef, useState } from 'react';
import type { Pillar } from '../../data/programs';
import { PillarArt } from './PillarArt';
import './PillarList.css';

/**
 * 역량과 태도(사용자 지시 2026-10-24) — toss.im/company '일하는 방식이 곧 성공 전략'(Culture) 형식.
 *
 * - 제목 아래 가는 선, 그 아래 두 칸: 왼쪽은 화면에 붙는 이미지 박스(줄마다 그래픽 — PillarArt), 오른쪽은 줄 목록.
 * - 오른쪽은 두 묶음(역량 · 태도 · Phi OS)의 01–05 줄이 이어진다. 줄 하나 = 번호 · 이름(영문 / 한글 두 줄) | 설명.
 *   묶음 제목은 왼쪽 이미지 박스 위에 — 고른 줄의 묶음으로 바뀐다(사용자 지시 2026-10-24).
 * - 줄 사이 구분선 · 여백은 토스 값 그대로: 첫 줄 빼고 위에 1px 선 + 24px, 줄 아래 92px(토스 CSS .dcrv6q6).
 * - 고른 줄만 검정, 나머지는 회색(토스). 고른 줄 = 마우스를 올린 줄(처음엔 첫 줄). 스크롤로는 바뀌지 않는다(사용자 지시 2026-10-24) —
 *   고르면 왼쪽 제목 · 그래픽도 그 줄로 넘어간다. 고른 줄은 검정 —
 *   단 번호는 검정이 아니라 진한 회색(사용자 지시).
 * - 토스처럼 줄은 스크롤하면 아래에서 떠오른다(ProgramsPage revealTargets).
 * - 좁은 화면: 이미지 박스 없이 줄만, 이름 아래 설명.
 * 예전 SkillReveal(붙는 무대 · 가로로 흐르는 카드 열 장)은 이 형식으로 바뀌었다.
 * 채용 연계도 같은 줄 형식으로 쓴다(사용자 지시 2026-10-27) — 줄에 각주(note)를 달 수 있고, flat이면 이미지 박스와 묶음 이름 칸 없이
 * 번호 | 이름 | 설명 줄만(채용 연계 — 토스 영상 박스 · 'with Toss'는 뺐다).
 */
export type PillarItem = Pick<Pillar, 'ko' | 'en' | 'body'> & { note?: string };
/** label: 묶음 이름(첫 줄 01 왼쪽에 굵게) · sub: 그 아래 작은 글(태도의 'Phi OS') */
export type PillarGroup = { label: string; sub?: string; items: PillarItem[] };

export function PillarList({ groups, flat = false }: { groups: PillarGroup[]; flat?: boolean }) {
  const [active, setActive] = useState(0);
  const uid = useId(); // 한 페이지에 둘(역량과 태도 · 채용 연계) — 묶음 제목 id가 겹치지 않게
  const ref = useRef<HTMLDivElement>(null);

  // 줄 양옆 빈 여백(화면 끝까지)에 마우스를 올려도 그 높이의 줄을 고른다(사용자 지시 2026-10-27, 역량과 태도).
  // 줄 목록의 위아래 안에서만 — 묶음 사이 틈은 가까운 줄, 왼쪽 이미지 박스 위는 그대로 둔다(그래픽이 마우스 밑에서 바뀌지 않게)
  useEffect(() => {
    const root = ref.current;
    if (flat || !root) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (e.target instanceof Element && e.target.closest('.pillar-list__side')) return;
      const rows = root.querySelectorAll<HTMLElement>('.pillar-row');
      const first = rows[0]?.getBoundingClientRect();
      const last = rows[rows.length - 1]?.getBoundingClientRect();
      if (!first || !last || e.clientY < first.top || e.clientY >= last.bottom) return;
      let best = 0;
      let bestDist = Infinity;
      rows.forEach((row, i) => {
        const r = row.getBoundingClientRect();
        const d = e.clientY < r.top ? r.top - e.clientY : e.clientY >= r.bottom ? e.clientY - r.bottom : 0;
        if (d < bestDist) { best = i; bestDist = d; }
      });
      setActive(best);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, [flat]);

  // 묶음을 이어 센 줄 번호의 시작(고른 줄 비교용) — 역량 0–4, 태도 5–9
  const starts = groups.map((_, gi) => groups.slice(0, gi).reduce((sum, g) => sum + g.items.length, 0));
  return (
    <div ref={ref} className={flat ? 'pillar-list pillar-list--flat' : 'pillar-list'}>
      <div className="pillar-list__rule" aria-hidden="true" />
      <div className="pillar-list__body">
        {!flat && <div className="pillar-list__side">
          {/* 묶음 이름은 이미지 박스 위(2026-10-24)에서 각 묶음 첫 줄 01 왼쪽으로 옮겼다(사용자 지시 2026-10-27) */}
          {/* 이미지 박스 — 줄마다 모노톤 움직이는 그래픽 + 가운데 영문 이름(사용자 지시 2026-10-24). 고른 줄을 따라 넘어간다 */}
          <PillarArt titles={groups.flatMap((g) => g.items.map((p) => p.en))} active={active} />
        </div>}
        <div className="pillar-list__groups">
          {groups.map((g, gi) => (
            <section key={g.label} className="pillar-group" aria-labelledby={`${uid}-group-${gi}`}>
              {/* 보이는 이름은 첫 줄 01 왼쪽(pillar-row__group) — 여기는 화면 읽기 프로그램용 */}
              <h3 id={`${uid}-group-${gi}`} className="visually-hidden">{[g.label, g.sub].filter(Boolean).join(' · ')}</h3>
              <ol className="pillar-group__rows">
                {g.items.map((p, i) => {
                  const index = starts[gi] + i;
                  return (
                    // 마우스를 올리면 그 줄을 고른다 — 글 진하기와 왼쪽 그래픽이 함께 바뀐다(사용자 지시 2026-10-24)
                    <li key={p.en} className="pillar-row" data-active={active === index} onMouseEnter={() => setActive(index)}>
                      <div className="pillar-row__head">
                        {/* 묶음 이름 칸 — 첫 줄에만 글, 나머지 줄은 같은 폭으로 비워 번호 · 이름이 한 선에 선다 */}
                        {!flat && (
                          <span className="pillar-row__group" aria-hidden="true">
                            {i === 0 && <>{g.label}{g.sub && <small>{g.sub}</small>}</>}
                          </span>
                        )}
                        <span className="pillar-row__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <h4 className="pillar-row__name">
                          <span lang="en">{p.en}</span>
                          <span>{p.ko}</span>
                        </h4>
                      </div>
                      <div className="pillar-row__body">
                        <p>{p.body}</p>
                        {p.note && <p className="pillar-row__note">{p.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
