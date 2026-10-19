import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { HeroLogo3D } from '../HeroLogo3D/HeroLogo3D';
import { HeroRipple, type RippleControl } from '../HeroRipple/HeroRipple';
import { lenis } from '../../smoothScroll';
import './HeroReveal.css';

/**
 * 히어로(2026-10-19) — 배우는 역량의 연출을 응용해 다시 만든 첫 화면. 스크롤하지 않아도 저절로 흐른다(사용자 지시 2026-10-19).
 *
 *  1) 흰 화면(0.4초).
 *  2) 'PROGRAMS'가 화면 폭을 꽉 채운 크기로, 흐린 채 아래에서 떠오른다.
 *  3) 또렷해진다.
 *  4) 작아지며 제자리(화면 가운데보다 살짝 아래)로 가고, 위에 3D Φ 로고 · 아래에 소개 · 지원 기간 · 지원하기가 떠오른다.
 *  5) 그 뒤로는 예전 히어로처럼 로고가 돌고, 로고가 X자가 될 때마다 글자에 물방울 파동(HeroRipple)이 퍼진다.
 * 연출이 끝날 때까지 스크롤을 잠가 끝까지 보고 넘어가게 한다(사용자 지시 2026-10-19). 한 글자씩 채워지는 연출은 쓰지 않는다.
 *
 * 큰 글씨는 따로 띄운 겹(.hero-reveal__fly)이 그린다: 제자리의 진짜 제목(.hero__title, 파동이 옮겨 그리는 글자)은 처음부터
 * 최종 크기로 자리를 잡고 숨어 있고, 겹은 그 자리 · 크기로 줄어든 뒤 진짜 제목과 바뀐다 — 크기 · 위치가 같아 이음매가 없다.
 * 움직임 줄이기 · 이미 아래로 스크롤해 둔 채 다시 불러온 때는 연출 없이 끝 장면.
 */
type Phase = 'play' | 'content' | 'done';

/** 시각(ms, 흰 화면 뒤부터) — 떠오름 · 또렷 · 줄어듦 · 내용 · 스크롤 풂 */
const WHITE = 400;
const T = { rise: 1300, sharpenAt: 1100, sharpen: 1000, shrinkAt: 2300, shrink: 1100, contentAt: 2900, unlockAt: 3800 };
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_INOUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** 연출 동안 스크롤을 막는다 — Lenis는 멈추고, 휠 · 터치 · 키 스크롤은 기본 동작을 막는다 */
function lockScroll() {
  lenis?.stop();
  const block = (e: Event) => e.preventDefault();
  const keys = (e: KeyboardEvent) => {
    if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault();
  };
  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('touchmove', block, { passive: false });
  window.addEventListener('keydown', keys);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    lenis?.start();
    window.removeEventListener('wheel', block);
    window.removeEventListener('touchmove', block);
    window.removeEventListener('keydown', keys);
  };
}

export function HeroReveal({ title, children }: { title: string; children: ReactNode }) {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const flyRef = useRef<HTMLSpanElement>(null);
  const riseRef = useRef<HTMLSpanElement>(null);
  const bigRef = useRef<HTMLSpanElement>(null);
  const rippleCtl = useRef<RippleControl | null>(null);
  const [phase, setPhase] = useState<Phase>(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.scrollY > window.innerHeight * 0.5 ? 'done' : 'play',
  );

  // 연출은 처음 한 번 — 단계가 바뀌어도 다시 걸지 않는다
  const startPhase = useRef(phase);
  useLayoutEffect(() => {
    if (startPhase.current !== 'play') return;
    const real = titleRef.current;
    const fly = flyRef.current;
    const rise = riseRef.current;
    const big = bigRef.current;
    if (!real || !fly || !rise || !big) return;
    const unlock = lockScroll();
    const timers: number[] = [];
    const anims: Animation[] = [];
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      // 큰 글씨: 양옆 여백(--side-wide)만 남기고 화면 폭을 꽉 채우는 크기
      big.style.fontSize = '100px';
      const side = Math.max(24, Math.min(200, (window.innerWidth - 1040) / 2)); // CSS --side-wide와 같다
      big.style.fontSize = `${Math.max(40, ((window.innerWidth - 2 * side) / Math.max(1, big.offsetWidth)) * 100)}px`;
      // 줄어든 끝 = 진짜 제목의 자리 · 크기
      const a = big.getBoundingClientRect();
      const b = real.getBoundingClientRect();
      const s = b.width / a.width;
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);

      anims.push(rise.animate(
        [{ opacity: 0, transform: 'translateY(10vh)' }, { opacity: 1, transform: 'none' }],
        { duration: T.rise, delay: WHITE, easing: EASE_OUT, fill: 'both' },
      ));
      anims.push(big.animate(
        [{ filter: 'blur(28px)' }, { filter: 'blur(0px)' }],
        { duration: T.sharpen, delay: WHITE + T.sharpenAt, easing: 'ease-in-out', fill: 'both' },
      ));
      anims.push(fly.animate(
        [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
        { duration: T.shrink, delay: WHITE + T.shrinkAt, easing: EASE_INOUT, fill: 'both' },
      ));
      timers.push(window.setTimeout(() => setPhase('content'), WHITE + T.contentAt));
      // 줄어듦이 끝나면 진짜 제목으로 바꾸고, 내용이 다 오른 뒤 스크롤을 푼다
      timers.push(window.setTimeout(() => setPhase('done'), WHITE + T.shrinkAt + T.shrink));
      timers.push(window.setTimeout(unlock, WHITE + T.unlockAt));
    });

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      anims.forEach((x) => x.cancel());
      unlock();
    };
  }, []);

  return (
    <section ref={heroRef} className="hero hero-reveal" aria-labelledby="hero-title" data-intro={phase}>
      {/* 예전 히어로처럼 'PROGRAMS' 위 3D Φ 로고 — X자가 될 때마다 글자에 파동 */}
      <HeroLogo3D onPose={() => rippleCtl.current?.ripple()} />
      <h1 ref={titleRef} id="hero-title" className="hero__title hero-reveal__title">{title}</h1>
      {children}
      {/* 연출용 큰 글씨 겹: 바깥 = 줄어듦, 가운데 = 떠오름, 안 = 흐림 */}
      <span className="hero-reveal__fly-wrap" aria-hidden="true">
        <span ref={flyRef} className="hero-reveal__fly">
          <span ref={riseRef} className="hero-reveal__rise">
            <span ref={bigRef} className="hero-reveal__big">{title}</span>
          </span>
        </span>
      </span>
      {/* 물방울 파동 — 연출이 끝난 뒤(data-intro='done')에 붙여, 첫 화면 연출은 건너뛰고 로고 박자로만 돈다 */}
      {phase === 'done' && <HeroRipple controlRef={rippleCtl} />}
    </section>
  );
}
