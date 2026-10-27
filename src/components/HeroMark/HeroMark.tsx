import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { PhiHero } from './phi-hero-rings';
import './HeroMark.css';

/**
 * 히어로 첫 화면의 Φ 로고 모션(사용자 지시 2026-10-27).
 *
 * phi-motion-study(github.com/yongzu/phi-motion-study)의 예제 src/examples/ref11/Ref11Intro.tsx 로고 모션을 옮겼다 —
 * 타이포 로고(워드마크)와 로크업 이동은 빼고 마크 모션만:
 *  1막(2D) 점 하나가 톡 나타나 → 세로로 길어져 선 → 옆으로 벌어져 타원 → 시계방향으로 돌며 두 링(ring-a · ring-b)으로 나뉜다
 *  다리   2D 링을 3D 링이 멈춘 자세(HERO_MARK_POSE)로 보간한 뒤 3D로 크로스페이드
 *  2막(3D) phi.design 히어로의 three.js 링(phi-hero-rings.js, 키프레임 그대로)이 마크 자세에서 깨어나 한 바퀴(5.61초 ÷ 1.5) 돌고 다시 멈춘다
 * 프레임 값 · 이징은 예제(30fps) 그대로이고, 시간(ms)으로 바꿔 requestAnimationFrame으로 그린다(Remotion 없이).
 *
 * 화면 배치: 1막 · 다리는 화면 한가운데에서, 3D가 돌기 시작하면 크기 그대로 소개 위 제자리로 조금 올라가고(--dy · FLIP —
 * 사용자 지시 2026-10-27, 예전엔 크게 보였다가 작아졌다), 그 뒤 소개 · 버튼이 위에서부터 나온다(ProgramsPage의 HERO_TEXT_AT).
 * 첫 화면 맨 위에서 열었을 때만 움직인다 — 스크롤된 채 새로 고치거나 움직임 줄이기면 2D 마크로 제자리에.
 */

// ---------- 예제의 마크 데이터(kit/remotion/phi-logo.ts phiMark.rings · PhiHeroRings.tsx) — viewBox 800 ----------
type Ellipse = { cx: number; cy: number; rx: number; ry: number; rotate: number; w: number };
type RingId = 'ring-a' | 'ring-b';
const RINGS: Record<RingId, Ellipse> = {
  'ring-a': { cx: 399.5, cy: 400.1, rx: 170.98, ry: 492.83, rotate: 45, w: 54.7 },
  'ring-b': { cx: 399.7, cy: 400.3, rx: 237.88, ry: 461.1, rotate: -45, w: 54.7 },
};
/** 3D 링이 멈춘 자세를 2D 마크 좌표로 옮긴 타원 — 2D → 3D 이음매 */
const POSE: Record<RingId, Ellipse> = {
  'ring-a': { cx: 400.88, cy: 402.54, rx: 123.33, ry: 492.24, rotate: 44.63, w: 48 },
  'ring-b': { cx: 400, cy: 396.93, rx: 236.27, ry: 459.57, rotate: -44.98, w: 48 },
};
/** 3D 캔버스 한 변 = 2D 마크 한 변 × 이 값일 때 같은 크기로 보인다 */
const MARK_SCALE_3D = 1.49;
const INK = '#141414';

// ---------- 타이밍(예제 프레임 · 30fps → ms) ----------
const F = (frame: number) => (frame / 30) * 1000;
const T = {
  stretch: [F(14), F(30)], // 점 → 세로 선
  open: [F(32), F(50)], // 선 → 타원
  split: [F(46), F(86)], // 타원이 돌며 둘로
  toPose: [F(90), F(102)], // 2D 링 → 3D 멈춘 자세
  handoff: [F(102), F(106)], // 2D → 3D 크로스페이드
  line: [F(34), F(40)], // 점 · 선 구간의 둥근 끝 선이 사라짐
} as const;
const HERO_SPEED = 1.5;
/** 3D 한 바퀴(5.61초)를 HERO_SPEED로 — 끝나면 마크 자세로 멈춘다 */
const LOOP_MS = 5610;
const SPIN_MS = LOOP_MS / HERO_SPEED;
/** 화면 가운데에서 제자리로 옮기기 시작하는 시각(ms) — 3D가 돌기 시작한 직후 */
export const SETTLE_AT = F(106) + 150;
export const MOVE_MS = 800;
const END_MS = T.handoff[0] + SPIN_MS + 100;

// ---------- 이징 ----------
/** cubic-bezier(x1, y1, x2, y2) — 뉴턴법으로 x → t */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
  const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
  const c = (p1: number) => 3 * p1;
  const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t -= (at(t, x1, x2) - x) / s;
    }
    return at(Math.min(1, Math.max(0, t)), y1, y2);
  };
}
const EASE_FUNDAMENTAL = bezier(0.83, 0, 0.17, 1); // 예제(11번 레퍼런스)의 강한 가속 · 감속
const EASE_EXPAND = bezier(0.35, 0, 0, 1); // Phi 인트로 이징
/** Remotion spring(damping 12, mass 0.5, stiffness 100)과 같은 감쇠 진동 — 점이 톡 나타나는 크기 */
function pop(ms: number) {
  const t = ms / 1000;
  if (t <= 0) return 0;
  const w0 = Math.sqrt(100 / 0.5);
  const z = 12 / (2 * Math.sqrt(100 * 0.5));
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpE = (a: Ellipse, b: Ellipse, t: number): Ellipse => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
  rotate: lerp(a.rotate, b.rotate, t),
  w: lerp(a.w, b.w, t),
});
const iv = (ms: number, [a, b]: readonly [number, number], ease?: (t: number) => number) => {
  const t = Math.min(1, Math.max(0, (ms - a) / (b - a)));
  return ease ? ease(t) : t;
};

// 갈라지기 직전의 타원 하나: 두 링의 중간 모양, 세로로 선 상태
const SEED: Ellipse = {
  cx: 400,
  cy: 400,
  rx: (RINGS['ring-a'].rx + RINGS['ring-b'].rx) / 2,
  ry: (RINGS['ring-a'].ry + RINGS['ring-b'].ry) / 2,
  rotate: 0,
  w: RINGS['ring-a'].w,
};
const TINY = 0.5; // 0이면 SVG가 타원을 그리지 않는다
// 회전하며 나뉨: 둘 다 시계방향으로 돌되 도는 양이 달라 벌어진다(타원은 180° 대칭)
const SPIN: Record<RingId, number> = { 'ring-a': RINGS['ring-a'].rotate + 180, 'ring-b': RINGS['ring-b'].rotate + 180 };

/** ms 시점의 링 하나(마크 좌표) */
function ringAt(ms: number, id: RingId): Ellipse {
  const p = pop(ms);
  const stretch = iv(ms, T.stretch, EASE_FUNDAMENTAL);
  const open = iv(ms, T.open, EASE_FUNDAMENTAL);
  const split = iv(ms, T.split, EASE_FUNDAMENTAL);
  const toPose = iv(ms, T.toPose, EASE_EXPAND);
  let e: Ellipse = { ...SEED, rx: lerp(TINY, SEED.rx, open), ry: lerp(TINY, SEED.ry, stretch), w: SEED.w * p };
  e = lerpE(e, { ...RINGS[id], rotate: SPIN[id] }, split);
  const pose = POSE[id];
  return lerpE(e, { ...pose, rotate: pose.rotate + 180 }, toPose);
}

type Stage = 'still' | 'center' | 'settle';

export function HeroMark() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<Stage>('still');
  const [dy, setDy] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    const svg = svgRef.current;
    const canvas = canvasRef.current;
    if (!el || !svg || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.scrollY > 0) return;
    const r = el.getBoundingClientRect();
    setDy(window.innerHeight / 2 - (r.top + r.height / 2)); // 제자리 가운데 → 화면 가운데
    setStage('center');

    const line = svg.querySelector<SVGLineElement>('.hero-mark__line')!;
    const rings = [...svg.querySelectorAll<SVGEllipseElement>('.hero-mark__ring')];
    const g2d = svg.querySelector<SVGGElement>('.hero-mark__2d')!;
    let hero: PhiHero | null = null;
    let disposed = false;
    // three.js는 따로 불러온다(첫 화면 글자를 늦추지 않게) — 3D가 필요한 3.4초 전에 넉넉히 들어온다
    import('./phi-hero-rings')
      .then(({ createPhiHero }) => {
        if (disposed) return;
        const css = parseFloat(getComputedStyle(canvas).width);
        hero = createPhiHero({ canvas, size: css, pixelRatio: Math.min(2, window.devicePixelRatio || 1) });
        hero.renderAt(LOOP_MS); // 마크 자세
      })
      .catch(() => {}); // WebGL을 못 쓰면 2D 마크로 끝난다

    const start = performance.now();
    let raf = 0;
    const draw = () => {
      const ms = performance.now() - start;
      // 1막 · 다리: 점 → 선 → 타원 → 두 링 → 3D 자세
      const lineOp = 1 - iv(ms, T.line);
      if (lineOp > 0) {
        const e = ringAt(ms, 'ring-a');
        line.setAttribute('y1', String(e.cy - e.ry));
        line.setAttribute('y2', String(e.cy + e.ry));
        line.setAttribute('stroke-width', String(e.w));
      }
      line.style.opacity = String(lineOp);
      (['ring-b', 'ring-a'] as const).forEach((id, i) => {
        const e = ringAt(ms, id);
        const el2 = rings[i];
        el2.style.display = ms >= T.open[0] ? '' : 'none';
        el2.setAttribute('cx', String(e.cx));
        el2.setAttribute('cy', String(e.cy));
        el2.setAttribute('rx', String(e.rx));
        el2.setAttribute('ry', String(e.ry));
        el2.setAttribute('stroke-width', String(e.w));
        el2.setAttribute('transform', `rotate(${e.rotate} ${e.cx} ${e.cy})`);
      });
      // 2D → 3D
      const handoff = hero ? iv(ms, T.handoff) : 0;
      g2d.style.opacity = String(1 - handoff);
      canvas.style.opacity = String(handoff);
      if (hero && ms >= T.handoff[0]) hero.renderAt(LOOP_MS + Math.min(LOOP_MS, (ms - T.handoff[0]) * HERO_SPEED));
      if (ms < END_MS) raf = requestAnimationFrame(draw);
    };
    draw(); // 첫 그림은 바로 — 칠하기 전에 점 하나(크기 0)로 바꿔 둔다(정지 상태의 2D 마크가 한 프레임 비치지 않게)
    const t = window.setTimeout(() => setStage('settle'), SETTLE_AT);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      hero?.dispose();
    };
  }, []);

  return (
    <div ref={ref} className="hero-mark" data-stage={stage} style={{ '--dy': `${dy}px`, '--move': `${MOVE_MS}ms` } as CSSProperties} aria-hidden="true">
      <svg ref={svgRef} className="hero-mark__svg" viewBox="0 0 800 800">
        <g className="hero-mark__2d" fill="none" stroke={INK}>
          {/* 점 · 선 구간: 아주 납작한 타원은 끝이 각져 보여 둥근 끝 선으로 그린다(예제와 같다) */}
          <line className="hero-mark__line" x1={400} x2={400} y1={400} y2={400} strokeLinecap="round" strokeWidth={0} />
          {(['ring-b', 'ring-a'] as const).map((id) => {
            const e = RINGS[id];
            // 움직이지 않을 때(still)는 2D 마크 그대로
            return (
              <ellipse key={id} className="hero-mark__ring" cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} strokeWidth={e.w} transform={`rotate(${e.rotate} ${e.cx} ${e.cy})`} />
            );
          })}
        </g>
      </svg>
      <canvas ref={canvasRef} className="hero-mark__3d" style={{ '--k3': MARK_SCALE_3D } as CSSProperties} />
    </div>
  );
}
