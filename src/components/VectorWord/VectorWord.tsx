import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import glyphs from '../../data/vectorGlyphs.json';
import './VectorWord.css';

/**
 * 벡터 인터랙션(v18, 2026-10-23) — phi.design 첫 화면(#manifesto, 사용자 제공 화면 녹화 · 코드)을 따른다.
 * - 영역 전체(data-hero-crosshair-zone): 포인터를 늘 십자선(화면 끝까지 가로 · 세로 점선)과 좌표가 따라다닌다.
 * - 낱말에 올리면 디자인 도구의 벡터 보기: 글자 면이 0.15초에 걸쳐 윤곽선으로 바뀌고(채움 → 테두리), 앵커가 0.25초에 떠오른다 —
 *   직선이 꺾이는 모서리는 네모, 곡선 위 점은 원. 앵커는 최소한으로(사용자 지시 — 조절점 없이, 가까운 점은 합침).
 *   낱말을 감싼 바운딩 박스(네 모서리 손잡이) · 박스 네 변의 안내선 · 왼쪽 끝 좌표가 함께 뜬다.
 * 윤곽은 Pretendard Bold에서 미리 뽑아 둔 실제 글자 모양(scripts/vector-glyphs.mjs → data/vectorGlyphs.json).
 *
 * 십자선 · 안내선 · 박스 · 좌표는 영역마다 하나인 VectorGuides가 그린다 — 낱말 · Φ 모션(PhiMotion)이 vectorHover()로 알린다.
 */
/** nodes: [x, y, 0 = 곡선 위 점(원) | 1 = 모서리(네모)] */
type Glyphs = { ascent: number; descent: number; words: Record<string, { width: number; d: string; nodes: number[][] }> };
const data: Glyphs = glyphs;

/** 벡터 보기 대상(바운딩 박스) — null이면 끝 */
export type VectorTarget = DOMRect | null;
const EVENT = 'vector-hover';
export const vectorHover = (target: VectorTarget) => window.dispatchEvent(new CustomEvent<VectorTarget>(EVENT, { detail: target }));

/**
 * 영역의 벡터 인터랙션 끄기 · 켜기(v19 — 큰 제목이 줄어드는 동안은 꺼 둔다, 사용자 지시 2026-10-23).
 * 영역에 data-vector="off"를 달고, 켜져 있던 벡터 보기 · 십자선 · 박스를 모두 거둔다(흐려지며)
 */
const RESET = 'vector-reset';
export function setVectorZone(zone: HTMLElement, on: boolean) {
  const off = zone.dataset.vector === 'off';
  if (on === !off) return;
  if (on) delete zone.dataset.vector;
  else {
    zone.dataset.vector = 'off';
    window.dispatchEvent(new Event(RESET));
  }
}
const zoneOff = (el: Element) => !!el.closest('[data-vector="off"]');

/** 마우스를 쓰는 화면에서만 — 터치로 누르면 벡터 보기가 남아 글을 가린다 */
const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * 글자 잉크에 딱 맞는 상자(사용자 지시 2026-10-23 — 줄 높이 · 끝 자간만큼 남던 여백을 없앤다).
 * 같은 글꼴로 캔버스에서 잰다: 인라인 상자의 위 끝 = 기준선 − 글꼴 ascent이므로, 기준선에서 잉크의 위 · 아래 · 왼쪽 · 오른쪽 끝을 더한다
 */
let ctx: CanvasRenderingContext2D | null = null;
function inkRect(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return box;
  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
  const m = ctx.measureText(el.textContent ?? '');
  const base = box.top + m.fontBoundingBoxAscent;
  const left = box.left - m.actualBoundingBoxLeft;
  const top = base - m.actualBoundingBoxAscent;
  return new DOMRect(left, top, box.left + m.actualBoundingBoxRight - left, base + m.actualBoundingBoxDescent - top);
}

/**
 * boxOnly: 앵커 없이 바운딩 박스 · 안내선 — 글자는 바깥 윤곽선만 · 흰 속(여덟 방향 그림자, 본문 낱말, 사용자 지시 2026-10-23).
 * 제목 낱말은 윤곽 + 앵커까지.
 */
export function VectorWord({ word, boxOnly = false }: { word: string; boxOnly?: boolean }) {
  const glyph = data.words[word];
  const ref = useRef<HTMLSpanElement>(null);
  const [px, setPx] = useState(0); // 1px이 몇 em인지 — 앵커 크기를 화면 px로 맞춘다. 0이면 꺼짐

  // 영역이 꺼지면 켜져 있던 벡터 보기를 거둔다
  useEffect(() => {
    const reset = () => setPx(0);
    window.addEventListener(RESET, reset);
    return () => window.removeEventListener(RESET, reset);
  }, []);

  if (!glyph && !boxOnly) return <>{word}</>;

  const enter = () => {
    if (!canHover() || !ref.current || zoneOff(ref.current)) return;
    setPx(1 / parseFloat(getComputedStyle(ref.current).fontSize));
    // 제목 낱말은 미리 뽑은 윤곽의 상자 그대로(정확), 본문 낱말은 캔버스로 잰 잉크 상자
    const outline = ref.current.querySelector('.vw__outline');
    vectorHover(outline ? outline.getBoundingClientRect() : inkRect(ref.current));
  };
  const leave = () => {
    setPx(0);
    vectorHover(null);
  };

  if (boxOnly) {
    return (
      <span ref={ref} className="vw vw--box" data-on={px > 0} onPointerEnter={enter} onPointerLeave={leave}>
        {word}
      </span>
    );
  }
  const h = data.ascent + data.descent;
  return (
    <span ref={ref} className="vw" data-on={px > 0} onPointerEnter={enter} onPointerLeave={leave}>
      {word}
      <svg
        className="vw__svg"
        viewBox={`0 ${-data.ascent} ${glyph.width} ${h}`}
        style={{ width: `${glyph.width}em`, height: `${h}em` }}
        aria-hidden="true"
      >
        <path className="vw__outline" d={glyph.d} />
        {px > 0 && (
          <g className="vw__anchors">
            {glyph.nodes.map(([x, y, corner], i) =>
              corner ? (
                <rect key={i} x={x - 2.2 * px} y={y - 2.2 * px} width={4.4 * px} height={4.4 * px} />
              ) : (
                <circle key={i} cx={x} cy={y} r={2.3 * px} />
              ),
            )}
          </g>
        )}
      </svg>
    </span>
  );
}

/**
 * 영역(zone)마다 하나 — 포인터를 따라다니는 십자선 · 좌표, 벡터 보기 대상의 바운딩 박스 · 안내선 · 좌표.
 * 좌표는 화면 기준(px — 사용자 제공 이미지). 포인터 십자선은 짙은 점선 + 교차점 검은 네모 + 오른쪽 아래 좌표. 마우스를 쓰는 화면에서만.
 * 영역에 들어오고 나갈 때 · 박스가 생기고 없어질 때 뚝 끊기지 않게 마지막 자리를 둔 채 흐려지며 사라진다(사용자 지시 2026-10-23, data-on → CSS).
 */
export function VectorGuides({ zone }: { zone: RefObject<HTMLElement | null> }) {
  const [pointer, setPointer] = useState<{ x: number; y: number; on: boolean } | null>(null);
  const [target, setTarget] = useState<{ rect: DOMRect; on: boolean } | null>(null);

  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !canHover()) return;
      setPointer({ x: e.clientX, y: e.clientY, on: !zoneOff(el) });
    };
    // 나가면 마지막 자리에 둔 채 흐려진다
    const leave = () => setPointer((p) => (p ? { ...p, on: false } : p));
    const onTarget = (e: Event) => {
      const rect = (e as CustomEvent<VectorTarget>).detail;
      setTarget((t) => (rect ? { rect, on: true } : t ? { ...t, on: false } : t));
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    const reset = () => {
      setPointer((p) => (p ? { ...p, on: false } : p));
      setTarget((t) => (t ? { ...t, on: false } : t));
    };
    window.addEventListener(EVENT, onTarget);
    window.addEventListener(RESET, reset);
    return () => {
      window.removeEventListener(RESET, reset);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      window.removeEventListener(EVENT, onTarget);
    };
  }, [zone]);

  if (!pointer && !target) return null;
  const r = target?.rect;
  return createPortal(
    <div className="vguides" aria-hidden="true">
      {pointer && (
        <div className="vguides__group vguides__group--cross" data-on={pointer.on}>
          <span className="vguides__h vguides__h--cross" style={{ top: pointer.y }} />
          <span className="vguides__v vguides__v--cross" style={{ left: pointer.x }} />
          <span className="vguides__dot" style={{ left: pointer.x, top: pointer.y }} />
          <span className="vguides__pointer" style={{ left: pointer.x, top: pointer.y }}>
            {Math.round(pointer.x)}, {Math.round(pointer.y)}
          </span>
        </div>
      )}
      {r && (
        <div className="vguides__group" data-on={target.on}>
          <span className="vguides__h" style={{ top: r.top }} />
          <span className="vguides__h" style={{ top: r.bottom }} />
          <span className="vguides__v" style={{ left: r.left }} />
          <span className="vguides__v" style={{ left: r.right }} />
          <span className="vguides__box" style={{ left: r.left, top: r.top, width: r.width, height: r.height }} />
          {[[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]].map(([cx, cy], i) => (
            <span key={i} className="vguides__handle" style={{ left: cx, top: cy }} />
          ))}
          <span className="vguides__label" style={{ top: r.top }}>({Math.round(r.left)},{Math.round(r.top)})</span>
          <span className="vguides__label" style={{ top: r.bottom }}>({Math.round(r.right)},{Math.round(r.bottom)})</span>
        </div>
      )}
    </div>,
    document.body,
  );
}
