import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import './HeroMark.css';

/**
 * 히어로 첫 화면의 Φ 마크(사용자 지시 2026-10-27 — morphin.dev 'causal.so SaaS' 참고: 로고가 먼저 나오고 그 아래 내용이 이어서 나온다).
 *
 * 1) 화면 한가운데 크게: 7 × 7 픽셀 Φ(파비콘과 같은 모양)의 칸들이 가운데 칸부터 바깥으로 차례로 솟아 맞춰진다.
 * 2) 맞춰지면 제자리(제목 'Programs' 위)로 작아지며 올라간다 — 자리 차이(--dy)는 처음 그릴 때 재서 FLIP으로 옮긴다.
 * 3) 그 뒤 제목 · 소개 · 지원하기가 나온다(ProgramsPage의 HERO_TEXT_AT이 SETTLE_AT + MOVE_MS 무렵).
 *
 * 첫 화면 맨 위에서 열었을 때만 움직인다 — 스크롤된 채 새로 고치거나 움직임 줄이기면 제자리에 그대로.
 */

/** 파비콘(public/favicon.svg)과 같은 7 × 7 칸 — 가운데 세로줄 · 가운데 가로줄 · 양옆 두 칸짜리 사선 넷 */
const CELLS: [number, number][] = [
  [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
  [2, 3], [4, 3],
  [0, 1], [1, 2], [6, 1], [5, 2],
  [1, 4], [0, 5], [5, 4], [6, 5],
];
/** 칸이 솟기 시작하는 시각 · 가운데에서 한 칸 멀어질 때마다 늦어지는 시간(ms) */
const POP_AT = 200;
const POP_STEP = 70;
/** 다 맞춰진 뒤 제자리로 옮기기 시작하는 시각(ms) */
export const SETTLE_AT = 1300;
export const MOVE_MS = 800;

type Stage = 'still' | 'center' | 'settle';

export function HeroMark() {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>('still');
  const [dy, setDy] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.scrollY > 0) return;
    const r = el.getBoundingClientRect();
    // 제자리 가운데 → 화면 가운데까지의 거리
    setDy(window.innerHeight / 2 - (r.top + r.height / 2));
    setStage('center');
    const t = window.setTimeout(() => setStage('settle'), SETTLE_AT);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div ref={ref} className="hero-mark" data-stage={stage} style={{ '--dy': `${dy}px`, '--move': `${MOVE_MS}ms` } as CSSProperties} aria-hidden="true">
      <svg className="hero-mark__svg" viewBox="0 0 7 7" shapeRendering="crispEdges">
        {CELLS.map(([x, y]) => {
          const dist = Math.max(Math.abs(x - 3), Math.abs(y - 3));
          return (
            <rect
              key={`${x}-${y}`}
              className="hero-mark__cell"
              x={x}
              y={y}
              width={1}
              height={1}
              style={{ '--d': `${POP_AT + dist * POP_STEP + (y % 2) * 20}ms` } as CSSProperties}
            />
          );
        })}
      </svg>
    </div>
  );
}
