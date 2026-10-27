import { useEffect, useRef, useState } from 'react';
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
 * 열리는 공간(사용자 지시 2026-10-27 — granola.ai 푸터 참고): 페이지 맨 아래에 닿아 있으면 잠시 뒤 'Fundamental Over Tools'가
 * 페이지와 함께 위로 올라가며 그 아래에서 새 공간(PANEL)이 나온다. 공간엔 히어로의 숫자(0 · 1) 인터랙션(GradientASCII, HERO_ASCII).
 * STAY 동안 머문 뒤 다시 내려가 닫히고, 맨 아래에 계속 있으면 REST 뒤 되풀이한다.
 * 올라가는 건 공간의 높이를 늘리면서 프레임마다 스크롤을 페이지 끝에 맞춰(페이지가 늘어난 만큼 따라 내려가) 위 내용이 함께 올라가 보이게 한다.
 * 도중에 휠 · 터치 · 키로 스크롤하면 따라가기를 멈춘다. 맨 아래를 떠나면 닫는다. 움직임 줄이기면 열지 않는다.
 * (그 전엔 글자 뒤에서 그래픽 카드 → 파란 직사각형 구역이 떠올랐다 내려갔다)
 */
const OPEN_MS = 1000; // 열리는 시간
const CLOSE_MS = 900; // 닫히는 시간
const WAIT = 700; // 맨 아래에 닿은 뒤 열리기까지
const STAY = 3600; // 열린 채 머무는 시간
const REST = 4200; // 닫힌 뒤 다시 열리기까지(맨 아래에 계속 있을 때)
/** 열리는 공간 높이(px) — 화면 높이의 42%, 최대 420 */
const panelHeight = () => Math.round(Math.min(window.innerHeight * 0.42, 420));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

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
    let height = 0; // 지금 공간 높이
    let raf = 0;
    let timer = 0;
    let state: 'closed' | 'opening' | 'open' | 'closing' = 'closed';
    let follow = false;
    const stopFollow = () => { follow = false; };
    // 공간 높이를 to로 바꾼다 — 따라가는 중이면 프레임마다 스크롤을 페이지 끝에 맞춘다
    const animate = (to: number, ms: number, done: () => void) => {
      cancelAnimationFrame(raf);
      const from = height;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        height = from + (to - from) * easeInOut(t);
        panel.style.height = `${height.toFixed(1)}px`;
        if (follow) {
          lenis?.resize();
          const end = document.documentElement.scrollHeight - window.innerHeight;
          if (lenis) lenis.scrollTo(end, { immediate: true, force: true });
          else window.scrollTo(0, end);
        }
        if (t < 1) raf = requestAnimationFrame(step);
        else { lenis?.resize(); done(); }
      };
      raf = requestAnimationFrame(step);
    };
    const open = () => {
      if (state !== 'closed' || !atBottom()) return;
      state = 'opening';
      follow = true;
      animate(panelHeight(), OPEN_MS, () => {
        state = 'open';
        timer = window.setTimeout(close, STAY);
      });
    };
    const close = () => {
      if (state === 'closed' || state === 'closing') return;
      window.clearTimeout(timer);
      state = 'closing';
      follow = atBottom();
      animate(0, CLOSE_MS, () => {
        state = 'closed';
        if (atBottom()) timer = window.setTimeout(open, REST);
      });
    };
    // 맨 아래에 닿으면 잠시 뒤 열고, 떠나면 닫는다
    const onScroll = () => {
      if (state === 'closed') {
        window.clearTimeout(timer);
        if (atBottom()) timer = window.setTimeout(open, WAIT);
      } else if (state === 'open' && !atBottom()) {
        close();
      }
    };
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAscii(true); near.disconnect(); }
    }, { rootMargin: '1200px 0px' });
    near.observe(panel);
    window.addEventListener('scroll', onScroll, { passive: true });
    for (const type of ['wheel', 'touchstart', 'keydown'] as const) window.addEventListener(type, stopFollow, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      near.disconnect();
      window.removeEventListener('scroll', onScroll);
      for (const type of ['wheel', 'touchstart', 'keydown'] as const) window.removeEventListener(type, stopFollow);
      panel.style.height = '';
    };
  }, []);

  return (
    <>
      <div className="footer-mark-wrap">
        <svg className="footer-mark" viewBox={layout.box.join(' ')} role="img" aria-label={TEXT.join(' ')}>
          {layout.parts.map((p) => <path key={p.name} d={p.d} transform={`translate(${p.x} 0)`} />)}
        </svg>
      </div>
      {/* 글자 아래에서 열리는 공간 — 히어로의 숫자 인터랙션 */}
      <div ref={panelRef} className="footer-reveal" aria-hidden="true">
        <div className="footer-reveal__field">{ascii && <GradientASCII {...HERO_ASCII} />}</div>
      </div>
    </>
  );
}
