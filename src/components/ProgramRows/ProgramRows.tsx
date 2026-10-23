import { useEffect, useState, type ReactNode, type TransitionEvent } from 'react';
import './ProgramRows.css';

/**
 * 1년제 프로그램 줄 목록(v16, 2026-10-23) — sui.io 'Sui is' 목록(Policy-enforced assets … Performance without compromise)을 따른
 * 작은 회색 라벨과 큰 제목 줄들. 줄 사이 가는 선(사용자 시안: 제목 · 영문 · 오른쪽 +).
 * sui의 왼쪽 좁은 칸('[ → ]')은 뺐다 — 라벨 · 줄은 교육 철학 글과 같은 왼쪽 선(사용자 지시 2026-10-23).
 *
 * 훑기 → 깊이(핵심 경험 2026-10-23): 접힌 줄에도 판단에 필요한 답 한 줄(summary)이 오른쪽에 보이고, 누르면 그 아래로 내용이 펼쳐진다.
 * 여러 줄을 함께 열어 둘 수 있다. 펼치는 동안만 내용을 잘라 두고(overflow), 다 펼친 뒤엔 풀어
 * 커리큘럼의 붙는 탭(position: sticky)이 동작하게 한다(data-settled).
 */
/** 바깥에서 줄을 여는 이벤트 — detail은 줄 id(목차가 쓴다). 줄의 요소 id는 `program-${id}` */
export const PROGRAM_OPEN_EVENT = 'program-row-open';

export type ProgramRow ={ id: string; title: string; en: string; summary: string; content: ReactNode };

export function ProgramRows({ label, rows }: { label: string; rows: ProgramRow[] }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // 목차(v18 — v3의 오른쪽 위 목차)에서 줄을 누르면 그 줄을 연다
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (rows.some((r) => r.id === id)) setOpen((prev) => new Set(prev).add(id));
    };
    window.addEventListener(PROGRAM_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(PROGRAM_OPEN_EVENT, onOpen);
  }, [rows]);

  // 펼침이 끝나면(높이 전환) 잘라 두던 것을 푼다 — 접기 시작하면 data-open이 먼저 빠져 다시 잘린다(CSS)
  const settle = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'grid-template-rows') return;
    e.currentTarget.toggleAttribute('data-settled', e.currentTarget.parentElement?.dataset.open === 'true');
  };

  return (
    <section id="program" className="program" aria-labelledby="program-label">
      <div className="program__list">
        <span id="program-label" className="program__label">{label}</span>
        <ul className="program__rows">
          {rows.map((r) => {
            const isOpen = open.has(r.id);
            return (
              <li key={r.id} id={`program-${r.id}`} className="program-row" data-open={isOpen}>
                <button
                  type="button"
                  className="program-row__hit"
                  aria-expanded={isOpen}
                  aria-controls={`program-panel-${r.id}`}
                  onClick={() => toggle(r.id)}
                >
                  <span className="program-row__titles">
                    <span className="program-row__title">{r.title}</span>
                    <span className="program-row__en">{r.en}</span>
                  </span>
                  <span className="program-row__summary">{r.summary}</span>
                  <span className="program-row__plus" aria-hidden="true" />
                </button>
                <div
                  id={`program-panel-${r.id}`}
                  className="program-row__panel"
                  role="region"
                  aria-label={r.title}
                  inert={!isOpen}
                  onTransitionEnd={settle}
                >
                  <div className="program-row__inner">{r.content}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
