import { useEffect, useRef, type ReactNode } from 'react';
import './CareerReveal.css';

/**
 * 채용 연계(사용자 지시 2026-10-27) — toss.im/company 히어로를 뒤집은 무대.
 * 토스 히어로는 위에서 비치는 푸른 빛이라면, 여기선 그라디언트로 흐린 푸른 원이 화면 아래에서 떠오른다(해돋이처럼).
 * 원이 오르는 동안 큰 문장(토스로 이어진다)이 떠오르고, 원 안쪽(아래)에 채용 전형 · 입사 특전 두 줄이 흰 글로 나타난다.
 *
 * - 길(.career-reveal__track)에 화면 높이 무대가 붙는다. 진행 p는 길 맨 위가 화면 아래에 닿을 때 0 → 길 맨 아래가 화면 아래에 닿을 때 1.
 *   스크롤 자리에 묶여 있어 되돌리면 원이 다시 가라앉는다.
 * - 단계(p): 원 0.12 – 0.62 · 큰 문장 0.3 – 0.55 · 리드 0.42 – 0.62 · 두 줄 0.58 – 0.82(줄마다 조금 늦게). 나머지는 머묾.
 *   값은 CSS 변수(--rise · --say · --lead · --rows)로 넘기고 모양은 CSS가 정한다.
 * - 움직임 줄이기: 붙는 무대 없이 다 드러난 모습(CSS).
 */
export type CareerRow = { id: string; title: string; sub: string; body: string; note?: string };

type Props = { eyebrow: string; statement: ReactNode; lead: string; rows: CareerRow[] };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** p의 [a, b] 구간을 0 – 1로(끝이 부드럽게) */
const span = (p: number, a: number, b: number) => easeOut(clamp01((p - a) / (b - a)));

export function CareerReveal({ eyebrow, statement, lead, rows }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const track = root.querySelector<HTMLElement>('.career-reveal__track')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = reduced.matches ? 1 : clamp01((vh - r.top) / r.height);
      root.style.setProperty('--rise', span(p, 0.12, 0.62).toFixed(4));
      root.style.setProperty('--say', span(p, 0.3, 0.55).toFixed(4));
      root.style.setProperty('--lead', span(p, 0.42, 0.62).toFixed(4));
      root.style.setProperty('--rows', span(p, 0.58, 0.78).toFixed(4));
      root.style.setProperty('--rows2', span(p, 0.64, 0.84).toFixed(4));
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
    <section ref={ref} id="career" className="career-reveal" aria-labelledby="career-title">
      <div className="career-reveal__track">
        <div className="career-reveal__stage">
          {/* 아래에서 떠오르는 흐린 푸른 원 — 두 겹(넓고 옅은 빛 + 가운데 짙은 원)으로 그라디언트 깊이를 낸다 */}
          <div className="career-reveal__orb" aria-hidden="true">
            <span className="career-reveal__glow" />
            <span className="career-reveal__core" />
          </div>
          <div className="career-reveal__head">
            <h2 id="career-title" className="career-reveal__eyebrow">{eyebrow}</h2>
            <p className="career-reveal__statement">{statement}</p>
            <p className="career-reveal__lead">{lead}</p>
          </div>
          <ol className="career-reveal__rows">
            {rows.map((r, i) => (
              <li key={r.id} className="career-reveal__row" style={{ '--k': `var(--rows${i ? '2' : ''})` } as React.CSSProperties}>
                <span className="career-reveal__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="career-reveal__title">
                  {r.title}
                  <span className="career-reveal__sub">{r.sub}</span>
                </h3>
                <p className="career-reveal__body">{r.body}</p>
                {r.note && <p className="career-reveal__note">{r.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
