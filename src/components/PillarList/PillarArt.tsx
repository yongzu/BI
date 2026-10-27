import type { CSSProperties, ReactNode } from 'react';
import './PillarArt.css';

/**
 * 역량과 태도 이미지 박스의 그래픽 열 장 — 2026-10-27(사용자 지시): linear.app 'Purpose-built'(Fig 0.2 · 0.3)의 라인 드로잉을
 * 참고해, 예전 Reframing(선으로만 된 정육면체가 도는 그림)의 느낌으로 모두 다시 그렸다. 어두운 면 위에 가는 흰 선의 등각(isometric)
 * 와이어프레임 — 면(Plane) · 정육면체(Cube)를 CSS 3D로 쌓고 천천히 움직인다. 고른 장만 움직인다(CSS).
 *
 * 2026-10-27 다시(사용자 지시 — 더 미니멀하게): 바닥 격자 · 지직거림 · 여러 층을 걷어내고 그림마다 사물 하나 · 움직임 하나만.
 *
 * 역량
 *  01 Aesthetic Sense — 떠 있는 판 하나에 황금비 나선이 그려진다
 *  02 Articulation — 판 하나에 글줄 셋이 차례로 써진다
 *  03 Structural Thinking — 작아지며 쌓인 판 셋이 차례로 밝아진다
 *  04 Problem Definition — 틀이 내려오며 좁혀져 한 점에 맞물린다
 *  05 Reframing — 선으로만 된 정육면체 둘이 서로 반대로 돈다(예전 그림 그대로)
 * 태도 · Phi OS
 *  06 Active Learning — 정육면체 셋이 계단처럼 한 칸씩 나타난다
 *  07 Discovering Unknowns — 아홉 칸 중 하나씩 떠올라 속이 드러난다
 *  08 Unpacking the Compression — 판 넷이 펼쳐졌다 다시 접힌다
 *  09 Dissatisfaction Sensor — 선이 솟아 기준 판을 넘는 순간 표시가 켜진다
 *  10 Learning by Sharing — 가운데 정육면체에서 물결이 퍼진다
 *
 * 이름은 박스 가운데 아래(가운데 정렬) — 두 낱말이면 두 줄, 세 낱말이면 첫 낱말 뒤에서 줄을 바꾼다(사용자 지시 2026-10-27).
 */

/** 등각 무대의 한 변(px) — 그림 좌표는 이 정사각형 안(0 – S) */
const S = 132;
const v = (o: Record<string, string | number>) => o as CSSProperties;

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

/* ---------- 01 Aesthetic Sense: 떠 있는 판 하나에 황금비 나선 ---------- */
const golden = (() => {
  const phi = (1 + Math.sqrt(5)) / 2;
  const w = S - 28;
  let r = { x: 14, y: (S - w / phi) / 2, w, h: w / phi };
  let d = `M ${r.x} ${r.y + r.h}`;
  for (let i = 0; i < 8; i += 1) {
    const dir = i % 4;
    if (dir === 0) {
      const s = r.h;
      d += ` A ${s} ${s} 0 0 1 ${r.x + s} ${r.y}`;
      r = { x: r.x + s, y: r.y, w: r.w - s, h: r.h };
    } else if (dir === 1) {
      const s = r.w;
      d += ` A ${s} ${s} 0 0 1 ${r.x + s} ${r.y + s}`;
      r = { x: r.x, y: r.y + s, w: r.w, h: r.h - s };
    } else if (dir === 2) {
      const s = r.h;
      d += ` A ${s} ${s} 0 0 1 ${r.x + r.w - s} ${r.y + s}`;
      r = { x: r.x, y: r.y, w: r.w - s, h: r.h };
    } else {
      const s = r.w;
      d += ` A ${s} ${s} 0 0 1 ${r.x} ${r.y + r.h - s}`;
      r = { x: r.x, y: r.y, w: r.w, h: r.h - s };
    }
  }
  return d;
})();
function Aesthetic() {
  return (
    <Iso spin>
      <Plane z={20}>
        <Svg><path className="pa-draw" d={golden} pathLength={1} /></Svg>
      </Plane>
    </Iso>
  );
}

/* ---------- 02 Articulation: 판 하나에 글줄 셋이 써진다 ---------- */
function Articulation() {
  return (
    <Iso>
      <Plane z={20}>
        {[[22, 40, 88], [22, 66, 70], [22, 92, 50]].map(([x, y, w], i) => (
          <span key={i} className="pa-bar pa-bar--type" style={v({ left: x, top: y, width: w, '--d': `${i * 0.6}s` })} />
        ))}
      </Plane>
    </Iso>
  );
}

/* ---------- 03 Structural Thinking: 작아지며 쌓인 판 셋 ---------- */
function Structural() {
  return (
    <Iso spin>
      {[0, 1, 2].map((i) => {
        const w = S - i * 40;
        return <Plane key={i} z={i * 32} x={(S - w) / 2} y={(S - w) / 2} w={w} h={w} className="pa-tier" style={v({ '--d': `${i * 0.5}s` })} />;
      })}
    </Iso>
  );
}

/* ---------- 04 Problem Definition: 틀이 내려와 한 점에 맞물린다 ---------- */
function Problem() {
  const c = S / 2;
  return (
    <Iso>
      <Plane />
      <span className="pa-target" style={v({ left: c, top: c })} />
      <div className="pa-lock" style={v({ left: c - 10, top: c - 10, width: 20, height: 20 })}>
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

/* ---------- 06 Active Learning: 정육면체 셋이 계단처럼 한 칸씩 ---------- */
function Active() {
  return (
    <Iso>
      {/* x로만 나아가며 z로 반 칸씩 오른다 — 화면에선 오른쪽 위로 오르는 계단 */}
      {[0, 1, 2].map((i) => (
        <Cube key={i} x={18 + i * 34} y={52} z={i * 16} s={30} className="pa-cube--step" style={v({ '--d': `${i * 0.6}s` })} />
      ))}
    </Iso>
  );
}

/* ---------- 07 Discovering Unknowns: 판 위 칸 하나가 떠올라 드러난다 ---------- */
function Unknowns() {
  const size = 36;
  const gap = (S - 3 * size) / 4;
  return (
    <Iso>
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="pa-tile"
          // 음수 지연 — 처음 보일 때부터 하나가 떠 있게. 한 번에 하나씩 차례로
          style={v({ left: gap + (i % 3) * (size + gap), top: gap + Math.floor(i / 3) * (size + gap), width: size, height: size, '--d': `${-((i * 4) % 9) * 1}s` })}
        />
      ))}
    </Iso>
  );
}

/* ---------- 08 Unpacking the Compression: 판 넷이 펼쳐졌다 접힌다 ---------- */
function Unpacking() {
  return (
    <Iso spin>
      {[0, 1, 2, 3].map((i) => <Plane key={i} className="pa-layer" style={v({ '--i': i })} />)}
    </Iso>
  );
}

/* ---------- 09 Dissatisfaction Sensor: 기준 판을 넘어 튀는 선 ---------- */
function Dissatisfaction() {
  const c = S / 2;
  return (
    <Iso>
      <Plane z={44} className="pa-plane--threshold" />
      <span className="pa-spike" style={v({ left: c, top: c })} />
      <span className="pa-mark" style={v({ left: c - 9, top: c - 9 })} />
    </Iso>
  );
}

/* ---------- 10 Learning by Sharing: 가운데 정육면체에서 퍼지는 물결 ---------- */
function Sharing() {
  const c = S / 2;
  return (
    <Iso>
      <Plane className="pa-plane--none">
        {[0, 1].map((i) => <span key={i} className="pa-ripple" style={v({ '--d': `${i * 1.5}s` })} />)}
      </Plane>
      <Cube x={c - 12} y={c - 12} s={24} />
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

/** 이미지 박스 — 세로 트랙에 열 장, 고른 장(active)으로 넘어간다. 가운데 아래에 영문 이름 */
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
