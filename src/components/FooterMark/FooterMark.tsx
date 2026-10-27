import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import glyphs from '../../data/vectorGlyphs.json';
import GradientASCII from '../GradientASCII/GradientASCII';
import { HERO_ASCII } from '../GradientASCII/heroPreset';
import './FooterMark.css';

/**
 * 푸터 맨 아래 'Fundamental Over Tools' — 푸터 폭에 꽉 차게(사용자 지시 2026-10-24).
 * 교육 철학 제목과 같은 글자 윤곽(Pretendard Bold, 자간 -0.035em — data/vectorGlyphs.json)을 한 줄로 이어 SVG로 그린다.
 * viewBox를 글자 잉크에 딱 맞춰 두어 폭 100%면 왼쪽 · 오른쪽 끝이 푸터 글줄 끝에 닿는다(글꼴 크기를 재서 맞출 필요가 없다).
 * 2026-10-27(사용자 지시): 푸터 맨 아래에 여백 없이 화면 폭에 꽉 차게(양옆 · 아래 0).
 *
 * 열리는 공간(사용자 지시 2026-10-27 — granola.ai 푸터 참고): 페이지 맨 아래에서 한 번 더 아래로 스크롤하면 바로
 * 'Fundamental Over Tools'가 (채용 연계 · 푸터와 함께) 위로 올라가며 화면 아래에서 새 공간(PANEL)이 올라온다.
 * 공간엔 히어로의 숫자(0 · 1) 인터랙션(GradientASCII, HERO_ASCII). STAY 동안 머문 뒤 다시 내려간다. 위로 스크롤하면 바로 닫는다.
 * 움직임은 transform만(html[data-footer-open] — CSS) — 처음엔 공간 높이를 늘리며 프레임마다 스크롤을 맞췄는데, 매 프레임 레이아웃을
 * 다시 계산해 뚝뚝 끊겼다(사용자 제보 2026-10-27). 공간은 body에 붙인 화면 고정 칸이라 올라가는 푸터에 묶이지 않는다.
 * 움직임 줄이기면 열지 않는다. (그 전엔 글자 뒤에서 그래픽 카드 → 파란 직사각형 구역이 떠올랐다 내려갔다)
 */
const MOVE = 560; // 열리고 닫히는 시간(ms) — CSS --fr-move와 같다
const STAY = 1600; // 열린 채 머무는 시간
const COOLDOWN = 500; // 닫힌 뒤 다시 열 수 있기까지 — 휠 관성으로 바로 다시 열리지 않게
const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
/** 아래로 가는 키 */
const DOWN_KEYS = new Set(['ArrowDown', 'PageDown', 'End', ' ']);

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
  // 숫자 인터랙션은 푸터가 가까워지면 미리 띄운다 — 처음 띄울 때 셰이더를 만드느라 잠깐 멈추는데, 열리는 순간과 겹치면 끊겨 보인다.
  // 그 전엔 WebGL을 돌리지 않는다
  const [ascii, setAscii] = useState(false);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    let state: 'closed' | 'open' | 'closing' = 'closed';
    let timer = 0;
    let readyAt = 0;
    let touchY = 0;
    const open = () => {
      if (state !== 'closed' || performance.now() < readyAt || !atBottom()) return;
      state = 'open';
      root.style.setProperty('--fr-h', `${panel.offsetHeight}px`);
      root.dataset.footerOpen = 'true';
      window.clearTimeout(timer);
      timer = window.setTimeout(close, MOVE + STAY);
    };
    const close = () => {
      if (state !== 'open') return;
      state = 'closing';
      delete root.dataset.footerOpen;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { state = 'closed'; readyAt = performance.now() + COOLDOWN; }, MOVE);
    };
    // 맨 아래에서 더 내리면 열고, 위로 올리면 닫는다
    const onWheel = (e: WheelEvent) => { if (e.deltaY > 0) open(); else if (e.deltaY < 0) close(); };
    const onKey = (e: KeyboardEvent) => { if (DOWN_KEYS.has(e.key)) open(); else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home') close(); };
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - touchY;
      if (dy < -12) open(); // 위로 쓸어 올림 = 아래로 스크롤
      else if (dy > 12) close();
    };
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAscii(true); near.disconnect(); }
    }, { rootMargin: '1200px 0px' });
    const mark = document.querySelector('.footer-mark-wrap');
    if (mark) near.observe(mark);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      near.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      delete root.dataset.footerOpen;
    };
  }, []);

  return (
    <>
      <div className="footer-mark-wrap">
        <svg className="footer-mark" viewBox={layout.box.join(' ')} role="img" aria-label={TEXT.join(' ')}>
          {layout.parts.map((p) => <path key={p.name} d={p.d} transform={`translate(${p.x} 0)`} />)}
        </svg>
      </div>
      {/* 화면 아래에서 올라오는 공간 — 히어로의 숫자 인터랙션. body에 붙여 올라가는 푸터의 transform에 묶이지 않게 */}
      {createPortal(
        <div ref={panelRef} className="footer-reveal" aria-hidden="true">
          {/* 모양은 위아래로 뒤집는다 — 히어로는 위쪽에 글자가 몰리고 아래가 비는데, 여기선 위(올라간 글자와 맞닿는 쪽)가 비어
              페이지 바탕과 이어지고 아래로 갈수록 숫자가 짙어진다(사용자 지시 2026-10-27) */}
          {ascii && <GradientASCII {...HERO_ASCII} flipY />}
        </div>,
        document.body,
      )}
    </>
  );
}
