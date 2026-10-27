import { useEffect, useRef, type ReactNode } from 'react';
import './CareerReveal.css';

/**
 * 채용 연계(사용자 지시 2026-10-27) — toss.im/company 히어로를 뒤집은 섹션.
 * 토스 히어로는 위에서 하늘색 빛 고리가 비치고 가운데는 페이지처럼 하얗게 퍼진다. 여기선 그 빛이 아래에서 떠오른다.
 *
 * - 구성은 다른 섹션과 같다: 섹션 제목 · 리드(header), 아래에 줄 둘. 줄은 토스 'Vision' 줄 형식 — 위에 가는 선,
 *   왼쪽 칸은 비우고(점 · 라벨은 쓰지 않는다, 사용자 지시) 오른쪽 칸에 굵은 제목 · 설명.
 * - 빛: 섹션 맨 아래를 가운데로 둔 넓은 타원 — 가운데 하양, 둘레 하늘색, 바깥 투명. 섹션이 화면에 들어오는 만큼(진행 --rise)
 *   아래에서 떠오르며 진해진다. 스크롤 자리에 묶여 있어 되돌리면 가라앉는다. 무대를 붙잡지는 않는다(글이 잘리지 않게).
 * - 움직임 줄이기: 떠오른 모습 그대로.
 */
export type CareerRow = { id: string; title: string; body: string; note?: string };

type Props = { header: ReactNode; rows: CareerRow[] };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function CareerReveal({ header, rows }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // 섹션 맨 아래가 화면 아래 1.4배 자리에 있을 때 0 → 화면 60% 높이에 오면 1
      const p = reduced.matches ? 1 : clamp01((vh * 1.4 - r.bottom) / (vh * 0.8));
      root.style.setProperty('--rise', easeOut(p).toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduced.addEventListener('change', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduced.removeEventListener('change', onScroll);
    };
  }, []);

  return (
    <section ref={ref} id="career" className="section section--wide section--last career-reveal">
      {/* 아래에서 떠오르는 빛 — 가운데 하양 · 둘레 하늘색 */}
      <div className="career-reveal__sky" aria-hidden="true">
        <span className="career-reveal__halo" />
      </div>
      {header}
      <ol className="career-reveal__rows">
        {rows.map((r) => (
          <li key={r.id} className="career-reveal__row">
            <div className="career-reveal__text">
              <h3 className="career-reveal__title">{r.title}</h3>
              <p className="career-reveal__body">{r.body}</p>
              {r.note && <p className="career-reveal__note">{r.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
