/**
 * 페이지 전체의 ScrollReveal 설정(사용자 지시 2026-10-20) — https://reactbits.dev/text-animations/scroll-reveal?blurStrength=10&baseRotation=0&mode=enter
 * 주소의 세 값(blurStrength 10 · baseRotation 0 · mode enter) + 나머지는 react-bits 예시 값.
 * containerClassName에 'sr-plain'을 함께 주면 원본 CSS의 여백 · 글자 크기 대신 그 자리의 글자를 그대로 쓴다(ScrollReveal.css).
 */
export const SCROLL_REVEAL = {
  mode: 'enter',
  splitBy: 'words',
  effect: 'fade',
  stagger: 0.05 / 1.3, // 예시 값의 1.3배 빠르기(사용자 지시 2026-10-20)
  duration: 0.8 / 1.3,
  smoothing: 0,
  baseOpacity: 0.1,
  baseRotation: 0,
  baseOffset: 0,
  enableBlur: true,
  blurStrength: 10,
} as const;

/** 과정 개요(1 Year Programs) 글만 예시 값의 2배 빠르기(사용자 지시 2026-10-20) */
export const SCROLL_REVEAL_FAST = { ...SCROLL_REVEAL, stagger: 0.05 / 2, duration: 0.8 / 2 } as const;
