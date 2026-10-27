import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import glyphs from '../../data/vectorGlyphs.json';
import { lenis } from '../../smoothScroll';
import GradientASCII from '../GradientASCII/GradientASCII';
import { HERO_ASCII } from '../GradientASCII/heroPreset';
import './FooterMark.css';

/**
 * 푸터 맨 아래 'Fundamental Over Tools' — 푸터 폭에 꽉 차게(사용자 지시 2026-10-24).
 * 교육 철학 제목과 같은 글자 윤곽(Pretendard Bold, 자간 -0.035em — data/vectorGlyphs.json)을 한 줄로 이어 SVG로 그린다.
 * viewBox를 글자 잉크에 딱 맞춰 두어 폭 100%면 왼쪽 · 오른쪽 끝이 푸터 글줄 끝에 닿는다(글꼴 크기를 재서 맞출 필요가 없다).
 * 2026-10-27(사용자 지시): 푸터 맨 아래에 여백 없이 화면 폭에 꽉 차게(양옆 · 아래 0).
 *
 * 뒤에 숨은 그래픽(사용자 지시 2026-10-27 — morphin.dev 'granola-ai-footer'): 페이지 맨 아래에서 더 스크롤하면 그만큼
 * 페이지(채용 연계 · 푸터)가 위로 들려 올라가고, 그 아래 화면 바닥에 고정된 그래픽이 드러난다 — 그래픽은 움직이지 않고 페이지만 움직인다.
 * 손을 떼면(입력이 RELEASE ms — 1.2초 — 없으면) 페이지가 다시 내려와 덮는다. 위로 스크롤하면 바로 내려온다.
 * 들리는 양은 더 스크롤한 양에 저항(RESIST)을 곱한 값, 최대 그래픽 높이. 시간으로 목표를 따라간다(TAU — 프레임 수와 상관없이 같은 빠르기).
 * 맨 아래를 떠나면(스크롤이 위로 움직이면) 바로 내려놓는다.
 * 그래픽은 히어로의 숫자(0 · 1) 인터랙션(GradientASCII, HERO_ASCII) — 위아래를 뒤집어 아래쪽에 숫자가 짙다.
 * 움직임은 transform만(--fr-lift). 움직임 줄이기면 하지 않는다.
 * (그 전엔 글자 뒤 카드 → 파란 직사각형 → 시간으로 열고 닫히며 아래에서 올라오는 공간이었다)
 */
const RESIST = 0.45; // 더 스크롤한 양 대비 들리는 양
const TAU = 90; // 목표로 따라가는 시간 상수(ms) — 프레임마다 비율로 다가가면 느린 화면에서 기어가듯 늦었다
const RELEASE = 1200; // 마지막 입력 뒤 내려오기까지(ms) — 650 → 1200(사용자 지시 2026-10-27)
/** 아래로 가는 키 */
const DOWN_KEYS = new Set(['ArrowDown', 'PageDown', 'End', ' ']);
/** 맨 아래(더 내릴 수 없는 자리)에 있나 — Lenis는 목표 스크롤이 끝에 닿았으면(부드럽게 따라가는 중이어도) 맨 아래로 본다 */
const atEnd = () =>
  lenis ? lenis.targetScroll >= lenis.limit - 1 : document.documentElement.scrollHeight - (window.innerHeight + window.scrollY) <= 1;

type Word = { width: number; d: string };
const words = (glyphs as { words: Record<string, Word> }).words;
const TEXT = ['Fundamental', 'Over', 'Tools'];
/** 낱말 사이 띄어쓰기(em) — Pretendard 공백 폭에 자간을 더한 값에 가깝게 */
const SPACE = 0.24;

const layout = (() => {
  let x = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const parts = TEXT.map((name) => {
    const w = words[name];
    // 경로는 절대 좌표(M · L · Q · C)라 숫자가 x, y 차례로 나온다 — 잉크 상자를 잰다
    const nums = w.d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      minX = Math.min(minX, nums[i] + x);
      maxX = Math.max(maxX, nums[i] + x);
      minY = Math.min(minY, nums[i + 1]);
      maxY = Math.max(maxY, nums[i + 1]);
    }
    const part = { name, x, d: w.d };
    x += w.width + SPACE;
    return part;
  });
  return { parts, box: [minX, minY, maxX - minX, maxY - minY] };
})();

export function FooterMark() {
  const panelRef = useRef<HTMLDivElement>(null);
  // 숫자 인터랙션은 푸터가 가까워지면 미리 띄운다 — 처음 띄울 때 셰이더를 만드느라 잠깐 멈추는데, 들리는 순간과 겹치면 끊겨 보인다
  const [ascii, setAscii] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    let target = 0; // 들릴 높이(px)
    let lift = 0; // 지금 들린 높이
    let raf = 0;
    let last = 0; // 지난 프레임 시각
    let release = 0;
    let touchY: number | null = null;
    let touchBase = 0;
    const max = () => panel.offsetHeight;
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(100, now - last) : 16;
      last = now;
      lift += (target - lift) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(target - lift) < 0.5) lift = target;
      if (lift > 0) {
        root.dataset.footerLift = '';
        root.style.setProperty('--fr-lift', `${lift.toFixed(1)}px`);
      } else {
        delete root.dataset.footerLift;
        root.style.removeProperty('--fr-lift');
      }
      if (lift !== target) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const setTarget = (v: number) => {
      target = Math.min(max(), Math.max(0, v));
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const holdThenDrop = () => {
      window.clearTimeout(release);
      release = window.setTimeout(() => setTarget(0), RELEASE);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && atEnd()) {
        setTarget(target + e.deltaY * RESIST);
        holdThenDrop();
      } else if (e.deltaY < 0 && target > 0) {
        window.clearTimeout(release);
        setTarget(0);
      }
    };
    // 맨 아래를 떠나면 바로 내려놓는다(위로 스크롤 · 목차 이동 등)
    const onScroll = () => {
      if (target > 0 && !atEnd()) { window.clearTimeout(release); setTarget(0); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (DOWN_KEYS.has(e.key) && atEnd()) { setTarget(max()); holdThenDrop(); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home') setTarget(0);
    };
    // 터치: 맨 아래에서 위로 쓸어 올리면 손가락을 따라 들리고, 떼면 내려온다
    const onTouchStart = (e: TouchEvent) => { touchY = atEnd() ? e.touches[0].clientY : null; touchBase = target; };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) { if (atEnd()) { touchY = e.touches[0].clientY; touchBase = target; } return; }
      window.clearTimeout(release);
      setTarget(touchBase + (touchY - e.touches[0].clientY) * RESIST);
    };
    const onTouchEnd = () => { if (touchY !== null) { touchY = null; holdThenDrop(); } };
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAscii(true); near.disconnect(); }
    }, { rootMargin: '1200px 0px' });
    const mark = document.querySelector('.footer-mark-wrap');
    if (mark) near.observe(mark);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(release);
      near.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      delete root.dataset.footerLift;
      root.style.removeProperty('--fr-lift');
    };
  }, []);

  return (
    <>
      <div className="footer-mark-wrap">
        <svg className="footer-mark" viewBox={layout.box.join(' ')} role="img" aria-label={TEXT.join(' ')}>
          {layout.parts.map((p) => <path key={p.name} d={p.d} transform={`translate(${p.x} 0)`} />)}
        </svg>
      </div>
      {/* 페이지 뒤 화면 바닥에 고정된 그래픽 — 페이지가 들리면 드러난다. body에 붙여 들리는 푸터의 transform에 묶이지 않게 */}
      {createPortal(
        <div ref={panelRef} className="footer-reveal" aria-hidden="true">
          {/* 모양은 위아래로 뒤집는다 — 위(페이지 끝과 맞닿는 쪽)는 비어 바탕과 이어지고 아래로 갈수록 숫자가 짙다(사용자 지시 2026-10-27) */}
          {ascii && <GradientASCII {...HERO_ASCII} flipY />}
        </div>,
        document.body,
      )}
    </>
  );
}
