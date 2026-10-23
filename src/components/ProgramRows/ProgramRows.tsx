import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type TransitionEvent } from 'react';
import { scrollToTarget } from '../../smoothScroll';
import './ProgramRows.css';

/**
 * 1년제 프로그램 줄 목록(v16, 2026-10-23) — sui.io 'Sui is' 목록(Policy-enforced assets … Performance without compromise)을 따른
 * 작은 회색 라벨과 큰 제목 줄들. 줄 사이 가는 선(사용자 시안: 제목 · 오른쪽 +).
 * sui의 왼쪽 좁은 칸('[ → ]')은 뺐다 — 라벨 · 줄은 교육 철학 글과 같은 왼쪽 선(사용자 지시 2026-10-23).
 *
 * 훑기 → 깊이(핵심 경험 2026-10-23): 제목 아래 판단에 필요한 답 한 줄(summary)이 접혀 있어도 보이고, 누르면 그 아래로 내용이 펼쳐진다.
 * 여러 줄을 함께 열어 둘 수 있다.
 *
 * v17(사용자 지시 2026-10-23 — 통제와 자유):
 * - 열린 줄의 머리(제목 · 답 · −)는 화면 위(TOP, 로고 판 아래)에 붙는다. 긴 내용을 읽는 동안에도 어느 줄인지 보이고 바로 닫을 수 있다.
 *   다음 줄에 닿으면 그 줄 머리가 밀어 올린다(줄마다 붙는 범위가 제 줄 안).
 * - 붙은 머리를 눌러 닫으면 줄 위 끝을 머리 자리로 먼저 옮긴 뒤 접는다 — 닫아도 머리는 화면의 같은 자리에 머물고 아래 줄들이 올라온다.
 *   내용 끝의 '접기'도 같다.
 * - 화면 아래쪽에서 줄을 열면 그 머리가 위로 올라오도록 스크롤한다 — 열린 내용이 화면 밖에서 펼쳐져 반응이 안 보였다.
 * - 머리 높이를 재 --pr-head-h로 둔다 — 커리큘럼 탭은 머리 아래에 붙는다(CourseExplorer --ce-tabs-top).
 * - 제목은 h2(줄 목록 = 페이지의 다섯 장), 줄마다 주소(#curriculum 등) — 그 주소로 들어오면 그 줄이 열린 채로 간다.
 * - 접힌 내용은 hidden="until-found" — 페이지 찾기(Ctrl+F)로 찾으면 그 줄이 저절로 열린다(beforematch).
 *   펼침이 끝나면(transitionend) 잘라 두던 것을 풀어 붙는 탭이 동작하게 한다(data-settled).
 */
export type ProgramRow = { id: string; title: string; summary: string; content: ReactNode };

/** 머리가 붙는 높이(px) — 로고 판(위 10 ~ 51px) 바로 아래. CSS .program-row__head top과 같다 */
const TOP = 56;

export function ProgramRows({ label, rows }: { label: string; rows: ProgramRow[] }) {
  const [open, setOpen] = useState<Set<string>>(() => {
    const hash = window.location.hash.slice(1);
    return new Set(rows.some((r) => r.id === hash) ? [hash] : []);
  });
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const rowTop = (id: string) => {
    const li = rowRefs.current[id];
    return li ? window.scrollY + li.getBoundingClientRect().top - TOP : 0;
  };

  const setRow = (id: string, next: boolean) => {
    const li = rowRefs.current[id];
    if (!li) return;
    if (next) {
      // 화면 아래쪽(위에서 45% 아래)에서 열면 머리를 위로 — 펼쳐지는 내용이 보이게
      if (li.getBoundingClientRect().top > window.innerHeight * 0.45) scrollToTarget(rowTop(id), { duration: 0.5 });
      window.history.replaceState(null, '', `#${id}`);
    } else if (li.getBoundingClientRect().top < TOP) {
      // 머리가 붙어 있는 채로 닫으면: 줄 위 끝을 머리 자리로 옮겨 둔 뒤 접는다 — 머리는 제자리, 아래 줄들이 올라온다.
      // 같은 프레임에 옮겨야 해서 브라우저 스크롤을 바로 쓴다(Lenis는 다음 프레임에 옮긴다 — 그 사이 한 번 접힌 화면이 보인다)
      window.scrollTo({ top: rowTop(id), behavior: 'instant' });
    }
    setOpen((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  };

  // 주소로 들어오면(#curriculum 등) 그 줄로 — 처음 그린 뒤 한 번. 처음부터 열려 있어 펼침 전환이 없으니 바로 푼다(data-settled)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const li = document.getElementById(hash);
    if (!li?.classList.contains('program-row')) return;
    li.querySelector('.program-row__panel')?.setAttribute('data-settled', '');
    requestAnimationFrame(() => scrollToTarget(window.scrollY + li.getBoundingClientRect().top - TOP, { immediate: true }));
  }, []);

  // 접힌 줄은 페이지 찾기로만 찾히게(hidden="until-found"), 찾으면 연다. 열 땐 펼치기 전에 먼저 푼다.
  // 닫는 중(data-closing)엔 접히는 모습이 보이게 두고 다 접힌 뒤 settle이 숨긴다 — 전환이 없는 움직임 줄이기에선 바로 숨긴다
  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups: (() => void)[] = [];
    for (const r of rows) {
      const inner = rowRefs.current[r.id]?.querySelector<HTMLElement>('.program-row__inner');
      if (!inner) continue;
      if (open.has(r.id)) inner.removeAttribute('hidden');
      else if (reduced || !inner.closest('.program-row__panel')?.hasAttribute('data-closing')) inner.setAttribute('hidden', 'until-found');
      const onMatch = () => setOpen((prev) => new Set(prev).add(r.id));
      inner.addEventListener('beforematch', onMatch);
      cleanups.push(() => inner.removeEventListener('beforematch', onMatch));
    }
    return () => cleanups.forEach((c) => c());
  }, [open, rows]);

  // 머리 높이 → --pr-head-h(커리큘럼 탭이 그 아래에 붙는다)
  useLayoutEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const li = (e.target as HTMLElement).closest<HTMLElement>('.program-row');
        li?.style.setProperty('--pr-head-h', `${Math.ceil((e.target as HTMLElement).offsetHeight)}px`);
      }
    });
    Object.values(rowRefs.current).forEach((li) => {
      const head = li?.querySelector<HTMLElement>('.program-row__head');
      if (!li || !head) return;
      li.style.setProperty('--pr-head-h', `${Math.ceil(head.offsetHeight)}px`); // 첫 값은 바로 — 관찰은 다음 그리기부터 온다
      ro.observe(head);
    });
    return () => ro.disconnect();
  }, []);

  // 펼침이 끝나면 잘라 두던 것을 풀고, 접힘이 끝나면 내용을 찾기 전용으로 숨긴다
  const settle = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'grid-template-rows') return;
    const panel = e.currentTarget;
    const isOpen = panel.closest<HTMLElement>('.program-row')?.dataset.open === 'true';
    panel.toggleAttribute('data-settled', isOpen);
    panel.removeAttribute('data-closing');
    if (!isOpen) panel.querySelector('.program-row__inner')?.setAttribute('hidden', 'until-found');
  };

  return (
    <section id="program" className="program" aria-labelledby="program-label">
      <div className="program__list">
        <span id="program-label" className="program__label">{label}</span>
        <ul className="program__rows">
          {rows.map((r) => {
            const isOpen = open.has(r.id);
            return (
              <li key={r.id} id={r.id} ref={(el) => { rowRefs.current[r.id] = el; }} className="program-row" data-open={isOpen}>
                <h2 className="program-row__head">
                  <button
                    type="button"
                    className="program-row__hit"
                    aria-expanded={isOpen}
                    aria-controls={`program-panel-${r.id}`}
                    onClick={(e) => {
                      // 닫는 동안엔 내용을 보이게 둔다(접히는 모습) — 다 접힌 뒤 settle이 숨긴다
                      if (isOpen) e.currentTarget.closest('.program-row')?.querySelector('.program-row__panel')?.setAttribute('data-closing', '');
                      setRow(r.id, !isOpen);
                    }}
                  >
                    <span className="program-row__titles">
                      <span className="program-row__title">{r.title}</span>
                      <span className="program-row__summary">{r.summary}</span>
                    </span>
                    <span className="program-row__plus" aria-hidden="true" />
                  </button>
                </h2>
                <div
                  id={`program-panel-${r.id}`}
                  className="program-row__panel"
                  role="region"
                  aria-label={r.title}
                  onTransitionEnd={settle}
                >
                  <div className="program-row__inner">
                    {r.content}
                    <button
                      type="button"
                      className="program-row__close"
                      onClick={(e) => {
                        e.currentTarget.closest('.program-row__panel')?.setAttribute('data-closing', '');
                        setRow(r.id, false);
                      }}
                    >
                      {r.title} 접기
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
