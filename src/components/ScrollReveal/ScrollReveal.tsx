/* ScrollReveal — react-bits(David Haz) 원본을 TypeScript로 옮겼다. https://reactbits.dev/text-animations/scroll-reveal (MIT + Commons Clause)
   BI 추가(2026-10-20): 바깥 태그를 고를 수 있게 `as`(기본 h2 — 원본과 같다), enter에서 재생을 늦추는 `delay`(초). 나머지 동작은 원본 그대로
   BI 추가(2026-10-23, v18 교육 철학): ① 글과 요소가 섞인 children — 글은 원본처럼 나누고 요소(벡터 낱말 등)는 한 조각으로 드러낸다.
   ② `progress`(0 → 1)를 주면 스크롤 트리거 대신 바깥이 진행을 정한다(붙는 무대 위처럼 글이 화면에서 움직이지 않는 곳) —
   scrub처럼 그 값을 따라가고, smoothing(초)만큼 늦게 따라붙는다 */
import { Children, useEffect, useLayoutEffect, useMemo, useRef, useState, type ElementType, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const SCRUB_SPAN = 0.5;
const RISE_MASK = 'inset(-1em -1em -0.15em -1em)';

type Effect = 'fade' | 'rise' | 'flip' | 'scale';
type Look = { effect: Effect; masked: boolean; baseOpacity: number; blur: number; offset: number; highlightColor: string };

const clampToScroll = (position: string) =>
  typeof position === 'string' && !position.startsWith('clamp(') ? `clamp(${position})` : position;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smooth = (value: number) => value * value * (3 - 2 * value);
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
const easeBack = (value: number, overshoot: number) => {
  const shifted = value - 1;
  return 1 + (overshoot + 1) * shifted * shifted * shifted + overshoot * shifted * shifted;
};
const glowAt = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.35 ? smooth(t / 0.35) : 1 - smooth((t - 0.35) / 0.65));

const paintPiece = (piece: HTMLElement, t: number, look: Look) => {
  let reveal = t;
  let fadeIn = t;
  let motion = '';
  if (look.effect === 'rise') {
    reveal = easeOut(t);
    fadeIn = clamp01(reveal * 1.25);
    if (reveal < 1) {
      motion = look.masked
        ? `translateY(${((1 - reveal) * 100).toFixed(2)}%) translateY(${((1 - reveal) * 0.2).toFixed(3)}em)`
        : `translateY(${((1 - reveal) * 0.8).toFixed(3)}em)`;
    }
  } else if (look.effect === 'flip') {
    reveal = easeBack(t, 1.2);
    fadeIn = clamp01(t * 2);
    if (t < 1) motion = `perspective(6em) rotateX(${((1 - reveal) * 90).toFixed(2)}deg)`;
  } else if (look.effect === 'scale') {
    reveal = easeBack(t, 1.6);
    fadeIn = clamp01(t * 1.6);
    if (t < 1) motion = `scale(${(0.35 + 0.65 * reveal).toFixed(4)})`;
  }
  if (look.highlightColor) fadeIn = Math.max(fadeIn, clamp01(t / 0.35));
  const settle = clamp01(reveal);
  const lift = look.offset * (1 - settle);
  piece.style.opacity = t >= 1 ? '' : (look.baseOpacity + (1 - look.baseOpacity) * fadeIn).toFixed(3);
  piece.style.transform = [lift ? `translateY(${lift.toFixed(2)}px)` : '', motion].filter(Boolean).join(' ');
  piece.style.filter = look.blur && settle < 1 ? `blur(${(look.blur * (1 - settle)).toFixed(2)}px)` : '';
  if (look.highlightColor) {
    const glow = glowAt(t);
    piece.style.color =
      glow > 0.002 ? `color-mix(in srgb, ${look.highlightColor} ${(glow * 100).toFixed(1)}%, currentColor)` : '';
  }
};

type Props = {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  baseOffset?: number;
  stagger?: number;
  smoothing?: number;
  splitBy?: 'words' | 'chars' | 'lines';
  effect?: Effect;
  mode?: 'scrub' | 'enter';
  duration?: number;
  highlightColor?: string;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  /** BI 추가: 바깥 태그(기본 h2) */
  as?: ElementType;
  /** BI 추가: enter에서 화면에 들어온 뒤 재생을 늦추는 시간(초) */
  delay?: number;
  /** BI 추가: 바깥이 정하는 진행(0 → 1). 주면 스크롤 트리거를 만들지 않는다 */
  progress?: number;
  id?: string;
};

const ScrollReveal = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  baseOffset = 0,
  stagger = 0.05,
  smoothing = 0,
  splitBy = 'words',
  effect = 'fade',
  mode = 'scrub',
  duration = 0.8,
  highlightColor = '',
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  as: Tag = 'h2',
  delay = 0,
  progress,
  id
}: Props) => {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const controlled = progress !== undefined;
  const stateRef = useRef<{ p: number } | null>(null);
  const renderRef = useRef<(() => void) | null>(null);

  const text = useMemo(() => {
    const parts = Children.toArray(children);
    return parts.every(part => typeof part === 'string' || typeof part === 'number') ? parts.join('') : null;
  }, [children]);

  const splitText = useMemo(() => {
    const split = (str: string, prefix: string) =>
      str.split(/(\s+)/).map((word, index) =>
        word.trim() === '' ? (
          word
        ) : (
          <span className="scroll-reveal-word" key={`${prefix}${index}`}>
            {splitBy === 'chars' ? (
              Array.from(word).map((char, charIndex) => (
                <span className="scroll-reveal-piece" key={charIndex}>
                  {char}
                </span>
              ))
            ) : (
              <span className="scroll-reveal-piece">{word}</span>
            )}
          </span>
        )
      );
    if (text !== null) return split(text, '');
    // BI 추가: 글과 요소가 섞이면 글만 나누고 요소는 한 조각으로
    const parts = Children.toArray(children);
    if (!parts.some(part => typeof part === 'string')) return null;
    return parts.map((part, i) =>
      typeof part === 'string' || typeof part === 'number' ? (
        split(String(part), `${i}-`)
      ) : (
        <span className="scroll-reveal-word" key={`el${i}`}>
          <span className="scroll-reveal-piece">{part}</span>
        </span>
      )
    );
  }, [text, splitBy, children]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    const textEl = textRef.current;
    if (!el || !textEl) return;
    if (scrollContainerRef && !scrollContainerRef.current) return;

    const scroller: HTMLElement | Window = scrollContainerRef?.current || window;
    const wrappers = Array.from(el.querySelectorAll<HTMLElement>('.scroll-reveal-word'));
    const pieces: HTMLElement[] = wrappers.length ? Array.from(el.querySelectorAll<HTMLElement>('.scroll-reveal-piece')) : [textEl];
    const viewportHeight = () => (scroller instanceof HTMLElement ? scroller.clientHeight : window.innerHeight);
    const scrub = smoothing > 0 ? smoothing : true;
    const span = mode === 'enter' ? Math.max(0.05, duration) : SCRUB_SPAN;
    const gap = Math.max(0, stagger);
    const look: Look = {
      effect,
      masked: effect === 'rise' && wrappers.length > 0,
      baseOpacity,
      blur: enableBlur ? blurStrength : 0,
      offset: baseOffset,
      highlightColor
    };
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const order = pieces.map((_, index) => index);
      const last = pieces.map(() => -1);
      const state = { p: 0 };
      let count = pieces.length;

      const measure = () => {
        if (splitBy !== 'lines' || !wrappers.length) return;
        let line = -1;
        let top = -Infinity;
        wrappers.forEach((wrapper, index) => {
          const next = wrapper.offsetTop;
          if (Math.abs(next - top) > 2) {
            line += 1;
            top = next;
          }
          order[index] = line;
        });
        count = line + 1;
      };

      const total = () => span + Math.max(0, count - 1) * gap;

      const render = () => {
        const at = state.p * total();
        pieces.forEach((piece, index) => {
          const t = clamp01((at - order[index] * gap) / span);
          if (t === last[index]) return;
          last[index] = t;
          paintPiece(piece, t, look);
        });
      };

      measure();
      pieces.forEach(piece => {
        piece.style.willChange =
          pieces.length > 80 ? '' : effect === 'fade' && !baseOffset ? 'opacity' : 'opacity, transform';
        piece.style.transformOrigin = effect === 'flip' ? '50% 100%' : '';
      });
      if (look.masked) {
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = RISE_MASK;
        });
      }
      render();

      if (controlled) {
        // BI 추가: 바깥이 진행을 정한다 — 아래 effect가 state를 progress 쪽으로 옮긴다
        stateRef.current = state;
        renderRef.current = render;
      } else if (mode === 'enter') {
        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          gsap.to(state, { p: 1, duration: total(), delay, ease: 'none', onUpdate: render });
          if (baseRotation) gsap.to(el, { rotate: 0, duration: Math.min(total(), 1.4), ease: 'power3.out' });
        };
        const startAt = () => {
          const view = viewportHeight();
          const top =
            el.getBoundingClientRect().top -
            (scroller instanceof HTMLElement
              ? scroller.getBoundingClientRect().top + scroller.clientTop - scroller.scrollTop
              : -window.scrollY);
          const raw = top - view + 0.2 * Math.min(el.offsetHeight, view);
          return Math.min(raw, ScrollTrigger.maxScroll(scroller) - 1);
        };
        if (baseRotation) gsap.set(el, { transformOrigin: '0% 50%', rotate: baseRotation });
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: startAt,
          onEnter: play,
          onLeave: play,
          onRefresh: self => {
            if (self.progress > 0) play();
          }
        });
      } else {
        if (baseRotation) {
          gsap.fromTo(
            el,
            { transformOrigin: '0% 50%', rotate: baseRotation },
            {
              ease: 'none',
              rotate: 0,
              scrollTrigger: {
                trigger: el,
                scroller,
                start: 'top bottom',
                end: clampToScroll(rotationEnd),
                scrub
              }
            }
          );
        }
        gsap.to(state, {
          p: 1,
          ease: 'none',
          onUpdate: render,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: () => `top bottom-=${0.2 * Math.min(el.offsetHeight, viewportHeight())}`,
            end: clampToScroll(wordAnimationEnd),
            scrub
          }
        });
      }

      const resizeObserver =
        splitBy === 'lines' && typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => {
              measure();
              last.fill(-1);
              render();
            })
          : null;
      resizeObserver?.observe(textEl);

      return () => {
        stateRef.current = null;
        renderRef.current = null;
        resizeObserver?.disconnect();
        pieces.forEach(piece => {
          piece.style.opacity = '';
          piece.style.transform = '';
          piece.style.transformOrigin = '';
          piece.style.filter = '';
          piece.style.color = '';
          piece.style.willChange = '';
        });
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = '';
        });
      };
    });

    return () => mm.revert();
  }, [
    mounted,
    scrollContainerRef,
    text,
    splitBy,
    effect,
    mode,
    duration,
    highlightColor,
    enableBlur,
    baseOpacity,
    baseRotation,
    blurStrength,
    baseOffset,
    stagger,
    smoothing,
    rotationEnd,
    wordAnimationEnd,
    delay,
    controlled
  ]);

  // BI 추가: 바깥 진행을 따라간다(smoothing초 만큼 늦게 따라붙는다)
  useEffect(() => {
    const state = stateRef.current;
    const render = renderRef.current;
    if (progress === undefined || !state || !render) return;
    // 앞으로 드러날 땐 delay초 뒤에(문장을 차례로), 되돌릴 땐 바로
    gsap.to(state, {
      p: progress,
      duration: smoothing > 0 ? smoothing : 0.001,
      delay: progress > state.p ? delay : 0,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: render,
    });
  }, [progress, smoothing, delay, mounted]);

  return (
    <Tag ref={containerRef} id={id} className={`scroll-reveal ${containerClassName}`} aria-label={text ?? undefined}>
      <span
        ref={textRef}
        className={`scroll-reveal-text ${textClassName}`}
        aria-hidden={text === null ? undefined : true}
      >
        {splitText ?? children}
      </span>
    </Tag>
  );
};

export default ScrollReveal;
