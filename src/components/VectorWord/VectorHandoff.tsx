import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './VectorHandoff.css';

/**
 * 교육 철학 → 역량과 태도 이어 주기(사용자 지시 2026-10-24, 사용자 제공 이미지).
 *
 * 교육 철학 마지막 단락의 [역량과 태도] 낱말이 벡터 보기(흰 속 · 윤곽 · 바운딩 박스 · 네 모서리 손잡이 · 화면 끝까지 점선 안내선 · 좌표)로
 * 바뀌고, 스크롤을 따라 그 상자째 아래로 내려가 '역량과 태도' 섹션 제목 자리에 내려앉는다. 내려앉으며 커지고(본문 → 제목 크기)
 * 속이 검정으로 채워지고, 상자 · 안내선이 흐려지며 실제 제목으로 바뀐다.
 *
 * - 진행 t: 교육 철학 무대가 풀리는 순간(제목이 화면 아래 섹션 윗여백만큼 밖) 0 → 제목이 화면 위 END_TOP에 오면 1. 스크롤 자리에 묶여 있다.
 * - 저절로 진행은 뺐다(사용자 지시 2026-10-27 — 둘째 단락을 읽는 도중 다음으로 넘어가 버렸다). 사용자가 직접 스크롤하는 만큼만 진행된다.
 *   (2026-10-24 ~ 10-27엔 무대가 풀리는 자리에 닿으면 역량과 태도 제목 자리까지 1.8초 동안 저절로 스크롤해 줬다)
 *   0 – APPEAR: 제자리에서 벡터 보기가 켜진다 · APPEAR – 1: 내려간다 · FILL – 1: 검정으로 채워진다
 * - 그동안 원래 낱말과 실제 제목은 숨긴다(겹쳐 두 개로 보이지 않게).
 * - 좁은 화면 · 움직임 줄이기에선 하지 않는다.
 */
const WORD = '역량과 태도';
/** 내려앉을 때 제목 맨 위가 서는 화면 높이(px) */
const END_TOP = 160;
const APPEAR = 0.12;
const FILL = 0.72;
const MEDIA = '(min-width: 901px) and (prefers-reduced-motion: no-preference)';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** 글줄 상자(글자가 놓인 범위) — 제목은 블록 폭 전체라 글자 범위로 잰다 */
function textRect(el: Element) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

type Frame = { left: number; top: number; size: number; fill: number; guides: number };

export function VectorHandoff({ targetSelector }: { targetSelector: string }) {
  const [frame, setFrame] = useState<Frame | null>(null);
  const cloneRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<DOMRect | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MEDIA);
    let raf = 0;
    let source: HTMLElement | null = null;
    let target: HTMLElement | null = null;
    const show = (el: HTMLElement | null, on: boolean) => { if (el) el.style.visibility = on ? '' : 'hidden'; };

    const find = () => {
      // 마지막 단락의 마지막 [역량과 태도] — 사용자 이미지의 '자신만의 역량과 태도로'
      const words = [...document.querySelectorAll<HTMLElement>('.philosophy .vw--box')].filter((w) => w.textContent?.trim() === WORD);
      source = words[words.length - 1] ?? null;
      target = document.querySelector<HTMLElement>(targetSelector);
    };

    const update = () => {
      raf = 0;
      if (!mq.matches) { setFrame(null); return; }
      if (!source || !target || !source.isConnected) find();
      if (!source || !target) return;
      const section = target.closest('section');
      const vh = window.innerHeight;
      const tr = textRect(target);
      // 무대가 풀리는 순간 제목은 화면 아래로 섹션 윗여백만큼 — 그때를 0으로
      const pad = section ? parseFloat(getComputedStyle(section).paddingTop) || 0 : 0;
      const start = vh + pad;
      const raw = (start - tr.top) / (start - END_TOP);
      const t = clamp01(raw);
      const sr = textRect(source); // 낱말은 글자마다 나뉘어 있어(ScrollReveal) 상자 대신 글자 범위로 잰다
      // 낱말이 아직 근처에 있을 때만. 끝(1)은 조금 앞에서 — 저절로 내려간 스크롤이 소수점만큼 모자라도 실제 제목으로 바뀐다
      const active = t > 0 && t < 0.995 && sr.bottom > -vh;
      show(source, !active);
      show(target, !active);
      if (!active) { setFrame(null); return; }
      const m = easeInOut(clamp01((t - APPEAR) / (1 - APPEAR)));
      const srcSize = parseFloat(getComputedStyle(source).fontSize);
      const dstSize = parseFloat(getComputedStyle(target).fontSize);
      setFrame({
        left: lerp(sr.left, tr.left, m),
        top: lerp(sr.top, tr.top, m),
        size: lerp(srcSize, dstSize, m),
        fill: clamp01((t - FILL) / (1 - FILL)),
        guides: clamp01(t / APPEAR) * (1 - clamp01((t - FILL) / (1 - FILL))),
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    mq.addEventListener('change', onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener('change', onScroll);
      show(source, true);
      show(target, true);
    };
  }, [targetSelector]);

  // 상자 · 안내선은 복제 낱말의 실제 크기로 잰다(글꼴 크기가 바뀌는 중에도)
  useEffect(() => {
    if (!frame || !cloneRef.current) { setBox(null); return; }
    setBox(cloneRef.current.getBoundingClientRect());
  }, [frame]);

  if (!frame) return null;
  const r = box;
  return createPortal(
    <div className="vhand" aria-hidden="true">
      <span
        ref={cloneRef}
        className="vhand__word"
        style={{
          left: frame.left,
          top: frame.top,
          fontSize: frame.size,
          '--vh-fill': `${Math.round(frame.fill * 100)}%`,
          '--vh-ol': 1 - frame.fill,
        } as React.CSSProperties}
      >
        {WORD}
      </span>
      {r && (
        <div className="vguides__group" data-on="true" style={{ opacity: frame.guides, animation: 'none' }}>
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
