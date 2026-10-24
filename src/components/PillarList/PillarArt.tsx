import type { CSSProperties, ReactNode } from 'react';
import './PillarArt.css';

/**
 * 역량과 태도 이미지 박스의 그래픽 열 장(사용자 지시 2026-10-24) — 모노톤, 벡터 · 디지털 · 픽셀 요소, 조금씩 움직인다.
 * 가운데엔 토스 이미지 박스처럼 영문 이름. 고른 줄을 따라 세로 트랙이 넘어가고(PillarList), 보이지 않는 장은 움직임을 멈춘다(CSS).
 *
 * 역량
 *  01 Aesthetic Sense — 황금비 사각형 위로 나선이 그려진다(벡터). 비례를 알아보는 눈
 *  02 Articulation — 흐릿한 글줄이 한 줄씩 써지고 커서가 깜박인다(디지털). 생각이 언어가 된다
 *  03 Structural Thinking — 뿌리에서 가지로 선이 이어지고 마디가 차례로 켜진다(벡터). 숲과 나무
 *  04 Problem Definition — 지직거리는 픽셀 사이로 조준선이 좁혀져 한 칸을 고른다(픽셀). 증상이 아닌 본질
 *  05 Reframing — 선으로만 된 정육면체가 천천히 돈다(3D 와이어). 같은 것을 다른 각도로
 * 태도 · Phi OS
 *  06 Active Learning — 점 격자 위를 한 칸씩 스스로 나아가며 자취를 남긴다(픽셀)
 *  07 Discovering Unknowns — 가려진 타일이 하나씩 뒤집혀 드러난다(픽셀). 모르는 것을 꺼낸다
 *  08 Unpacking the Compression — 한 줄로 눌린 선 다발이 층층이 펼쳐졌다 다시 접힌다(벡터)
 *  09 Dissatisfaction Sensor — 흐르는 신호에서 기준선을 넘는 튐을 잡아낸다(디지털 파형)
 *  10 Learning by Sharing — 가운데에서 퍼진 물결이 둘레의 점들에 차례로 닿는다(벡터)
 */

const W = 240;
const H = 315;

/** 고정된 의사 난수 — 그릴 때마다 같은 무늬 */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const v = (o: Record<string, string | number>) => o as CSSProperties;

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg className="pa-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/* ---------- 01 Aesthetic Sense: 황금비 사각형 + 나선 ---------- */
const golden = (() => {
  const phi = (1 + Math.sqrt(5)) / 2;
  let r = { x: 20, y: (H - 200 / phi) / 2, w: 200, h: 200 / phi };
  const squares: [number, number, number][] = [];
  let d = `M ${r.x} ${r.y + r.h}`;
  for (let i = 0; i < 9; i += 1) {
    const dir = i % 4;
    if (dir === 0) {
      const s = r.h;
      squares.push([r.x, r.y, s]);
      d += ` A ${s} ${s} 0 0 1 ${r.x + s} ${r.y}`;
      r = { x: r.x + s, y: r.y, w: r.w - s, h: r.h };
    } else if (dir === 1) {
      const s = r.w;
      squares.push([r.x, r.y, s]);
      d += ` A ${s} ${s} 0 0 1 ${r.x + s} ${r.y + s}`;
      r = { x: r.x, y: r.y + s, w: r.w, h: r.h - s };
    } else if (dir === 2) {
      const s = r.h;
      squares.push([r.x + r.w - s, r.y, s]);
      d += ` A ${s} ${s} 0 0 1 ${r.x + r.w - s} ${r.y + s}`;
      r = { x: r.x, y: r.y, w: r.w - s, h: r.h };
    } else {
      const s = r.w;
      squares.push([r.x, r.y + r.h - s, s]);
      d += ` A ${s} ${s} 0 0 1 ${r.x} ${r.y + r.h - s}`;
      r = { x: r.x, y: r.y, w: r.w, h: r.h - s };
    }
  }
  return { squares, d, eye: { x: r.x + r.w / 2, y: r.y + r.h / 2 } };
})();

function Aesthetic() {
  return (
    <Svg>
      {golden.squares.map(([x, y, s], i) => (
        <rect key={i} className="pa-thin" x={x} y={y} width={s} height={s} style={v({ '--d': `${i * 0.15}s` })} />
      ))}
      <path className="pa-draw" d={golden.d} pathLength={1} />
      <circle className="pa-eye" cx={golden.eye.x} cy={golden.eye.y} r={3} />
    </Svg>
  );
}

/* ---------- 02 Articulation: 써지는 글줄 + 커서 ---------- */
const LINES = [150, 176, 120, 168, 96, 140];
function Articulation() {
  const top = 182;
  const last = LINES.length - 1;
  return (
    <Svg>
      <text className="pa-quote" x={30} y={96}>“</text>
      {LINES.map((w, i) => (
        <rect key={i} className="pa-line" x={32} y={top + i * 18} width={w} height={6} rx={3} style={v({ '--d': `${i * 0.45}s` })} />
      ))}
      <rect className="pa-caret" x={32 + LINES[last] + 6} y={top + last * 18 - 4} width={2} height={14} />
    </Svg>
  );
}

/* ---------- 03 Structural Thinking: 나무 구조 ---------- */
const TREE = {
  // 가운데 영문 이름 띠(약 140–175)를 피해 둔다
  nodes: [[120, 52], [70, 112], [170, 112], [40, 240], [100, 240], [140, 240], [200, 240]] as [number, number][],
  edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]] as [number, number][],
};
function Structural() {
  return (
    <Svg>
      {TREE.edges.map(([a, b], i) => {
        const [x1, y1] = TREE.nodes[a];
        const [x2, y2] = TREE.nodes[b];
        const my = (y1 + y2) / 2;
        return <path key={i} className="pa-edge" d={`M ${x1} ${y1} V ${my} H ${x2} V ${y2}`} pathLength={1} style={v({ '--d': `${(i < 2 ? 0 : 0.6) + i * 0.1}s` })} />;
      })}
      {TREE.nodes.map(([x, y], i) => (
        <rect key={i} className="pa-node" x={x - 5} y={y - 5} width={10} height={10} style={v({ '--d': `${i === 0 ? 0 : i < 3 ? 0.5 : 1.1}s` })} />
      ))}
    </Svg>
  );
}

/* ---------- 04 Problem Definition: 픽셀 잡음 + 좁혀지는 조준선 ---------- */
const PCOLS = 10;
const PROWS = 13;
const TARGET = { c: 6, r: 8 };
function Problem() {
  const x0 = 30;
  const y0 = 40;
  const step = 18;
  const tx = x0 + TARGET.c * step + 7;
  const ty = y0 + TARGET.r * step + 7;
  return (
    <Svg>
      {Array.from({ length: PCOLS * PROWS }, (_, i) => {
        const c = i % PCOLS;
        const r = Math.floor(i / PCOLS);
        if (c === TARGET.c && r === TARGET.r) return null;
        return (
          <rect key={i} className="pa-noise" x={x0 + c * step} y={y0 + r * step} width={14} height={14}
            style={v({ '--d': `${-rand(i) * 2}s`, '--t': `${0.8 + rand(i + 99) * 1.6}s`, '--o': (0.06 + rand(i + 7) * 0.22).toFixed(2) })} />
        );
      })}
      <rect className="pa-target" x={tx - 7} y={ty - 7} width={14} height={14} />
      <g className="pa-reticle" style={v({ transformOrigin: `${tx}px ${ty}px` })}>
        <circle cx={tx} cy={ty} r={26} />
        <path d={`M ${tx - 40} ${ty} H ${tx - 16} M ${tx + 16} ${ty} H ${tx + 40} M ${tx} ${ty - 40} V ${ty - 16} M ${tx} ${ty + 16} V ${ty + 40}`} />
      </g>
    </Svg>
  );
}

/* ---------- 05 Reframing: 도는 와이어 정육면체(CSS 3D) ---------- */
function Reframing() {
  return (
    <div className="pa-cube-stage" aria-hidden="true">
      <div className="pa-cube">
        {['front', 'back', 'right', 'left', 'top', 'bottom'].map((f) => <span key={f} className={`pa-face pa-face--${f}`} />)}
      </div>
      <div className="pa-cube pa-cube--inner">
        {['front', 'back', 'right', 'left', 'top', 'bottom'].map((f) => <span key={f} className={`pa-face pa-face--${f}`} />)}
      </div>
    </div>
  );
}

/* ---------- 06 Active Learning: 점 격자 위를 스스로 나아가는 자취 ---------- */
const WALK: [number, number][] = [[1, 10], [1, 9], [2, 9], [3, 9], [3, 8], [3, 7], [4, 7], [5, 7], [5, 6], [5, 5], [6, 5], [7, 5], [7, 4], [7, 3], [6, 3], [6, 2], [6, 1]];
function Active() {
  const x0 = 32;
  const y0 = 46;
  const step = 22;
  return (
    <Svg>
      {Array.from({ length: 9 * 12 }, (_, i) => (
        <circle key={i} className="pa-dot" cx={x0 + (i % 9) * step} cy={y0 + Math.floor(i / 9) * step} r={1.2} />
      ))}
      {WALK.map(([c, r], i) => (
        <rect key={i} className="pa-step" x={x0 + c * step - 6} y={y0 + r * step - 6} width={12} height={12} style={v({ '--d': `${i * 0.28}s` })} />
      ))}
    </Svg>
  );
}

/* ---------- 07 Discovering Unknowns: 하나씩 드러나는 타일 ---------- */
function Unknowns() {
  const x0 = 30;
  const y0 = 38;
  const step = 30;
  return (
    <Svg>
      {Array.from({ length: 6 * 8 }, (_, i) => {
        const x = x0 + (i % 6) * step;
        const y = y0 + Math.floor(i / 6) * step;
        return (
          <g key={i} className="pa-tile" style={v({ '--d': `${-rand(i + 3) * 9}s` })}>
            <rect className="pa-tile__frame" x={x} y={y} width={26} height={26} />
            <rect className="pa-tile__fill" x={x} y={y} width={26} height={26} style={v({ transformOrigin: `${x + 13}px ${y + 13}px` })} />
            {rand(i + 41) > 0.82 && <text className="pa-tile__q" x={x + 13} y={y + 18}>?</text>}
          </g>
        );
      })}
    </Svg>
  );
}

/* ---------- 08 Unpacking the Compression: 눌린 선 다발이 펼쳐진다 ---------- */
function Unpacking() {
  const n = 9;
  const mid = H / 2;
  return (
    <Svg>
      {Array.from({ length: n }, (_, i) => {
        const y = 62 + i * 24;
        return (
          <g key={i} className="pa-layer" style={v({ '--dy': `${y - mid}px`, '--d': `${Math.abs(i - (n - 1) / 2) * 0.05}s` })}>
            <line x1={40} x2={200} y1={mid} y2={mid} />
            <rect x={36} y={mid - 3} width={6} height={6} />
            <rect x={40 + 40 + rand(i) * 100} y={mid - 2} width={4} height={4} className="pa-layer__mark" />
          </g>
        );
      })}
    </Svg>
  );
}

/* ---------- 09 Dissatisfaction Sensor: 흐르는 파형 + 기준선 넘는 튐 ---------- */
const WAVE = (() => {
  const pts: string[] = [];
  for (let x = 0; x <= W * 2; x += 4) {
    const local = x % W;
    let y = H / 2 + 14 + Math.sin(x / 14) * 6 + (rand(x) - 0.5) * 6;
    if (local > 150 && local < 166) y -= Math.sin(((local - 150) / 16) * Math.PI) * 70; // 튐
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();
function Dissatisfaction() {
  const th = H / 2 - 30;
  return (
    <Svg>
      {Array.from({ length: 7 }, (_, i) => <line key={i} className="pa-grid" x1={0} x2={W} y1={60 + i * 34} y2={60 + i * 34} />)}
      <line className="pa-threshold" x1={0} x2={W} y1={th} y2={th} />
      <g className="pa-wave"><polyline points={WAVE} /></g>
      <rect className="pa-alert" x={W / 2 - 18} y={th - 46} width={36} height={36} />
      <line className="pa-scan" x1={W / 2} x2={W / 2} y1={40} y2={H - 40} />
    </Svg>
  );
}

/* ---------- 10 Learning by Sharing: 가운데서 퍼져 둘레에 닿는 물결 ---------- */
function Sharing() {
  const cx = W / 2;
  const cy = H / 2;
  const outer = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * 84, cy + Math.sin(a) * 84] as [number, number];
  });
  return (
    <Svg>
      {[0, 1, 2].map((i) => <circle key={i} className="pa-ripple" cx={cx} cy={cy} r={100} style={v({ '--d': `${i * 1}s`, transformOrigin: `${cx}px ${cy}px` })} />)}
      {outer.map(([x, y], i) => <line key={i} className="pa-link" x1={cx} y1={cy} x2={x} y2={y} />)}
      {outer.map(([x, y], i) => (
        <g key={i}>
          <circle className="pa-peer" cx={x} cy={y} r={5} style={v({ '--d': `${0.9 + (i % 2) * 0.1}s` })} />
        </g>
      ))}
      <circle className="pa-source" cx={cx} cy={cy} r={7} />
    </Svg>
  );
}

const ARTS = [Aesthetic, Articulation, Structural, Problem, Reframing, Active, Unknowns, Unpacking, Dissatisfaction, Sharing];

/** 이미지 박스 — 세로 트랙에 열 장, 고른 장(active)으로 넘어간다. 가운데엔 영문 이름 */
export function PillarArt({ titles, active }: { titles: string[]; active: number }) {
  return (
    <div className="pa-box" aria-hidden="true">
      <div className="pa-track" style={v({ '--i': active })}>
        {titles.map((title, i) => {
          const Art = ARTS[i % ARTS.length];
          return (
            <div key={title} className="pa-slide" data-active={i === active}>
              <Art />
              <p className="pa-title">{title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
