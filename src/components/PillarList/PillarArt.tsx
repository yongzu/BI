import type { CSSProperties, ReactNode } from 'react';
import './PillarArt.css';

/**
 * 역량과 태도 이미지 박스의 그래픽 열 장 — 2026-10-27(사용자 지시): linear.app 'Purpose-built'(Fig 0.2 · 0.3)의 라인 드로잉을
 * 참고해, 예전 Reframing(선으로만 된 정육면체가 도는 그림)의 느낌으로 모두 다시 그렸다. 어두운 면 위에 가는 흰 선의 등각(isometric)
 * 와이어프레임 — 면(Plane) · 정육면체(Cube) · 세운 선(Riser)을 CSS 3D로 쌓고 천천히 움직인다. 고른 장만 움직인다(CSS).
 *
 * 역량
 *  01 Aesthetic Sense — 바닥 격자 위로 떠 있는 판에 황금비 사각형과 나선이 그려진다. 비례를 알아보는 눈
 *  02 Articulation — 흩어진 점(생각) → 짧은 조각 → 가지런한 글줄(말)로 세 층이 쌓이고, 맨 위 줄이 써진다
 *  03 Structural Thinking — 아홉 · 셋 · 하나의 마디가 세 층으로 이어지고 아래에서 위로 차례로 켜진다. 숲과 나무
 *  04 Problem Definition — 지직거리는 칸들 위로 큰 틀이 내려오며 좁혀져 한 칸에 맞물린다. 증상이 아닌 본질
 *  05 Reframing — 선으로만 된 정육면체 둘이 서로 반대로 돈다(예전 그림 그대로). 같은 것을 다른 각도로
 * 태도 · Phi OS
 *  06 Active Learning — 격자 위 정육면체가 한 칸씩 계단처럼 올라가며 스스로 나아간다
 *  07 Discovering Unknowns — 바닥의 타일이 하나씩 떠올라 속이 드러났다 내려앉는다. 모르는 것을 꺼낸다
 *  08 Unpacking the Compression — 납작하게 눌린 판 여섯 장이 층층이 펼쳐졌다 다시 접힌다
 *  09 Dissatisfaction Sensor — 세운 판 위를 흐르는 신호가 기준 판을 넘는 순간을 잡아낸다
 *  10 Learning by Sharing — 가운데에서 퍼진 물결이 둘레의 정육면체에 차례로 닿는다
 *
 * 이름은 박스 왼쪽 아래 — 두 낱말이면 두 줄, 세 낱말이면 첫 낱말 뒤에서 줄을 바꾼다(사용자 지시 2026-10-27).
 */

/** 등각 무대의 한 변(px) — 그림 좌표는 이 정사각형 안(0 – S) */
const S = 132;
const v = (o: Record<string, string | number>) => o as CSSProperties;
/** 고정된 의사 난수 — 그릴 때마다 같은 무늬 */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 등각 무대 — spin이면 천천히 돈다 */
function Iso({ spin, children }: { spin?: boolean; children: ReactNode }) {
  return (
    <div className="pa-stage">
      <div className={spin ? 'pa-iso pa-iso--spin' : 'pa-iso'}>{children}</div>
    </div>
  );
}

/** 높이 z에 뜬 판(무대 전체 크기, 다르면 x · y · w · h) */
function Plane({ z = 0, x = 0, y = 0, w = S, h = S, className = '', style, children }: {
  z?: number; x?: number; y?: number; w?: number; h?: number; className?: string; style?: CSSProperties; children?: ReactNode;
}) {
  return (
    <div className={`pa-plane ${className}`} style={{ left: x, top: y, width: w, height: h, '--z': `${z}px`, ...style } as CSSProperties}>
      {children}
    </div>
  );
}

/** (x, y)에서 z0부터 위로 h만큼 세운 선 */
function Riser({ x, y, z = 0, h, dashed }: { x: number; y: number; z?: number; h: number; dashed?: boolean }) {
  return <span className={dashed ? 'pa-riser pa-riser--dashed' : 'pa-riser'} style={v({ left: x, top: y, height: h, '--z': `${z}px` })} />;
}

/** 바닥 (x, y) · 높이 z에 놓인 한 변 s의 정육면체 — 면은 어두운 바탕으로 칠해 뒤쪽 선을 가린다 */
function Cube({ x, y, z = 0, s, className = '', style }: { x: number; y: number; z?: number; s: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={`pa-cube ${className}`} style={{ left: x, top: y, width: s, height: s, '--z': `${z}px`, '--s': `${s}px`, ...style } as CSSProperties}>
      {['bottom', 'top', 'front', 'back', 'left', 'right'].map((f) => <span key={f} className={`pa-cube__face pa-cube__face--${f}`} />)}
    </div>
  );
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg className="pa-plane__svg" viewBox={`0 0 ${S} ${S}`} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/* ---------- 01 Aesthetic Sense: 떠 있는 판 위 황금비 사각형 + 나선 ---------- */
const golden = (() => {
  const phi = (1 + Math.sqrt(5)) / 2;
  const w = S - 20;
  let r = { x: 10, y: (S - w / phi) / 2, w, h: w / phi };
  const squares: [number, number, number][] = [];
  let d = `M ${r.x} ${r.y + r.h}`;
  for (let i = 0; i < 8; i += 1) {
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
    <Iso spin>
      <Plane className="pa-grid" />
      {[[0, 0], [S, 0], [0, S], [S, S]].map(([x, y]) => <Riser key={`${x}${y}`} x={x} y={y} h={48} dashed />)}
      <Plane z={48} className="pa-plane--float">
        <Svg>
          {golden.squares.map(([x, y, s], i) => <rect key={i} className="pa-thin" x={x} y={y} width={s} height={s} style={v({ '--d': `${i * 0.15}s` })} />)}
          <path className="pa-draw" d={golden.d} pathLength={1} />
          <circle className="pa-eye" cx={golden.eye.x} cy={golden.eye.y} r={2.5} />
        </Svg>
      </Plane>
    </Iso>
  );
}

/* ---------- 02 Articulation: 점 → 조각 → 글줄, 세 층 ---------- */
const thoughts = Array.from({ length: 16 }, (_, i) => [14 + rand(i) * (S - 28), 14 + rand(i + 40) * (S - 28)]);
function Articulation() {
  return (
    <Iso>
      <Plane className="pa-plane--faint">
        {thoughts.map(([x, y], i) => <span key={i} className="pa-dot pa-dot--blink" style={v({ left: x, top: y, '--d': `${(i % 7) * 0.3}s` })} />)}
      </Plane>
      <Riser x={0} y={0} h={56} dashed />
      <Riser x={S} y={S} h={56} dashed />
      <Plane z={28} className="pa-plane--faint">
        {[[18, 26, 30], [58, 26, 22], [26, 58, 40], [76, 58, 26], [18, 90, 24], [52, 90, 34]].map(([x, y, w], i) => (
          <span key={i} className="pa-bar pa-bar--short" style={v({ left: x, top: y, width: w })} />
        ))}
      </Plane>
      <Plane z={56}>
        {[[18, 22, 96], [18, 46, 80], [18, 70, 92], [18, 94, 54]].map(([x, y, w], i) => (
          <span key={i} className="pa-bar pa-bar--type" style={v({ left: x, top: y, width: w, '--d': `${i * 0.6}s` })} />
        ))}
        <span className="pa-caret" style={v({ left: 76, top: 90 })} />
      </Plane>
    </Iso>
  );
}

/* ---------- 03 Structural Thinking: 아홉 · 셋 · 하나, 세 층 ---------- */
const STEP = [24, 66, 108];
function Structural() {
  return (
    <Iso spin>
      <Plane className="pa-plane--faint">
        <Svg>
          {STEP.map((x) => <line key={x} className="pa-link" x1={x} y1={24} x2={x} y2={108} />)}
        </Svg>
        {STEP.flatMap((x, i) => STEP.map((y, j) => <span key={`${i}${j}`} className="pa-node" style={v({ left: x, top: y, '--d': `${0.2 + (i + j) * 0.12}s` })} />))}
      </Plane>
      {STEP.map((x) => <Riser key={x} x={x} y={66} h={40} />)}
      <Plane z={40} className="pa-plane--ghost">
        <Svg><line className="pa-link" x1={24} y1={66} x2={108} y2={66} /></Svg>
        {STEP.map((x, i) => <span key={x} className="pa-node" style={v({ left: x, top: 66, '--d': `${1.2 + i * 0.12}s` })} />)}
      </Plane>
      <Riser x={66} y={66} z={40} h={40} />
      <Plane z={80} className="pa-plane--ghost">
        <span className="pa-node pa-node--big" style={v({ left: 66, top: 66, '--d': '1.9s' })} />
      </Plane>
    </Iso>
  );
}

/* ---------- 04 Problem Definition: 지직거리는 칸 위로 틀이 내려와 한 칸에 맞물린다 ---------- */
const N = 8;
const CELL = S / N;
const TARGET = { x: 5, y: 2 };
function Problem() {
  return (
    <Iso>
      <Plane className="pa-plane--faint">
        <Svg>
          {Array.from({ length: N * N }, (_, i) => {
            const x = i % N;
            const y = Math.floor(i / N);
            const target = x === TARGET.x && y === TARGET.y;
            return (
              <rect
                key={i}
                className={target ? 'pa-target' : 'pa-noise'}
                x={x * CELL + 2}
                y={y * CELL + 2}
                width={CELL - 4}
                height={CELL - 4}
                style={target ? undefined : v({ '--o': (0.06 + rand(i) * 0.3).toFixed(2), '--t': `${0.8 + rand(i + 99) * 1.6}s`, '--d': `${rand(i + 7) * 2}s` })}
              />
            );
          })}
        </Svg>
      </Plane>
      <div className="pa-lock" style={v({ left: TARGET.x * CELL, top: TARGET.y * CELL, width: CELL, height: CELL })}>
        <span className="pa-lock__frame" />
      </div>
    </Iso>
  );
}

/* ---------- 05 Reframing: 와이어 정육면체 둘(예전 그림) ---------- */
function Reframing() {
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  return (
    <div className="pa-cube-stage">
      <div className="pa-wire">
        {faces.map((f) => <span key={f} className={`pa-wire__face pa-wire__face--${f}`} />)}
      </div>
      <div className="pa-wire pa-wire--inner">
        {faces.map((f) => <span key={f} className={`pa-wire__face pa-wire__face--${f}`} />)}
      </div>
    </div>
  );
}

/* ---------- 06 Active Learning: 계단처럼 한 칸씩 올라가는 정육면체 ---------- */
function Active() {
  return (
    <Iso>
      <Plane className="pa-grid" />
      {Array.from({ length: 5 }, (_, i) => (
        // x로만 나아가며 z로 반 칸씩 오른다 — 화면에선 오른쪽 위로 오르는 계단(x · y를 함께 바꾸면 세로 탑처럼 보였다)
        <Cube key={i} x={6 + i * 24} y={56} z={i * 12} s={22} className="pa-cube--step" style={v({ '--d': `${i * 0.55}s` })} />
      ))}
    </Iso>
  );
}

/* ---------- 07 Discovering Unknowns: 타일이 떠올라 속이 드러난다 ---------- */
function Unknowns() {
  const n = 4;
  const size = 26;
  const gap = (S - n * size) / (n + 1);
  return (
    <Iso>
      <Plane className="pa-plane--faint" />
      {Array.from({ length: n * n }, (_, i) => (
        <span
          key={i}
          className="pa-tile"
          // 음수 지연 — 처음 보일 때부터 몇 장은 떠 있게(양수면 한동안 모두 바닥에 있었다)
          style={v({ left: gap + (i % n) * (size + gap), top: gap + Math.floor(i / n) * (size + gap), width: size, height: size, '--d': `${(-rand(i * 3) * 8).toFixed(2)}s` })}
        />
      ))}
    </Iso>
  );
}

/* ---------- 08 Unpacking the Compression: 눌린 판 여섯 장이 펼쳐졌다 접힌다 ---------- */
function Unpacking() {
  return (
    <Iso spin>
      {Array.from({ length: 6 }, (_, i) => (
        <Plane key={i} className={`pa-layer pa-layer--${i % 3}`} style={v({ '--i': i })}>
          {i % 3 === 1 && <Svg>{[30, 52, 74, 96].map((y) => <line key={y} className="pa-link" x1={22} y1={y} x2={110} y2={y} />)}</Svg>}
          {i % 3 === 2 && Array.from({ length: 9 }, (_, k) => <span key={k} className="pa-dot" style={v({ left: 30 + (k % 3) * 36, top: 30 + Math.floor(k / 3) * 36 })} />)}
        </Plane>
      ))}
    </Iso>
  );
}

/* ---------- 09 Dissatisfaction Sensor: 세운 판 위 신호 · 기준 판을 넘는 튐 ---------- */
// 세운 판 좌표: x 0 – 264(두 바퀴, 흐르며 이어진다), y는 바닥에서 위로(0 = 바닥). 150 – 166에서 기준선(46)을 넘는 튐
const WAVE = (() => {
  const pts: string[] = [];
  for (let x = 0; x <= 264; x += 4) {
    const t = x % 132;
    let y = 22 + Math.sin(t / 9) * 5 + Math.sin(t / 3.7) * 2;
    if (t > 60 && t < 78) y += Math.sin(((t - 60) / 18) * Math.PI) * 44;
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();
function Dissatisfaction() {
  return (
    <Iso>
      <Plane className="pa-grid" />
      <Plane z={46} className="pa-plane--threshold">
        <span className="pa-alert" style={v({ left: 60, top: 60, width: 22, height: 22 })} />
      </Plane>
      <div className="pa-wall" style={v({ left: 0, top: 70, width: S, height: 80 })}>
        <svg className="pa-wall__svg" viewBox={`0 0 ${S} 80`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <g className="pa-wave"><polyline points={WAVE} /></g>
        </svg>
      </div>
    </Iso>
  );
}

/* ---------- 10 Learning by Sharing: 물결이 둘레의 정육면체에 닿는다 ---------- */
function Sharing() {
  const c = S / 2;
  return (
    <Iso>
      <Plane className="pa-plane--faint">
        {[0, 1, 2].map((i) => <span key={i} className="pa-ripple" style={v({ '--d': `${i}s` })} />)}
      </Plane>
      <Cube x={c - 8} y={c - 8} s={16} className="pa-cube--source" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Cube key={i} x={c + Math.cos(a) * 50 - 5} y={c + Math.sin(a) * 50 - 5} s={10} className="pa-cube--peer" style={v({ '--d': `${0.95 + (i % 2) * 0.05}s` })} />;
      })}
    </Iso>
  );
}

const ARTS = [Aesthetic, Articulation, Structural, Problem, Reframing, Active, Unknowns, Unpacking, Dissatisfaction, Sharing];

/** 이름 줄바꿈 — 두 낱말이면 두 줄, 세 낱말 이상이면 첫 낱말 뒤에서(사용자 지시 2026-10-27) */
function TitleLines({ title }: { title: string }) {
  const words = title.split(' ');
  if (words.length < 2) return <>{title}</>;
  return <>{words[0]}<br />{words.slice(1).join(' ')}</>;
}

/** 이미지 박스 — 세로 트랙에 열 장, 고른 장(active)으로 넘어간다. 왼쪽 아래에 영문 이름 */
export function PillarArt({ titles, active }: { titles: string[]; active: number }) {
  return (
    <div className="pa-box" aria-hidden="true">
      <div className="pa-track" style={v({ '--i': active })}>
        {titles.map((title, i) => {
          const Art = ARTS[i % ARTS.length];
          return (
            <div key={title} className="pa-slide" data-active={i === active}>
              <Art />
              <p className="pa-title"><TitleLines title={title} /></p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
