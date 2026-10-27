import type { ComponentProps } from 'react';
import type GradientASCII from './GradientASCII';

/**
 * 히어로 배경의 숫자(0 · 1) 인터랙션 설정 — 히어로(ProgramsPage)와 푸터 아래에서 열리는 공간(FooterMark)이 함께 쓴다(2026-10-27).
 * 값은 사용자 지시 2026-10-20(react-bits 주소의 값 그대로) · 글자는 0과 1만.
 */
export const HERO_ASCII: ComponentProps<typeof GradientASCII> = {
  colors: ['#919191', '#ffffff', '#dfdfdf', '#bfbfbf'],
  shape: 'horizon',
  characters: ' 01', // 글자는 0과 1만(사용자 지시 2026-10-20, 이전 P · H · I)
  randomGlyphs: true, // 밝기 순서로 고르면 거의 1만 나와서, 0과 1을 고르게 섞는다
  cellSize: 15,
  density: 0.5,
  glyphOpacity: 0.5,
  depthOfField: 0.08,
  flicker: 0.13,
  softness: 0.8,
  scale: 1.35,
  flow: 0.3,
  speed: 0.9,
  gradientOpacity: 0,
  grain: 0.05,
  scrambleRadius: 0.02,
  clickEffect: 'none',
  lightMode: true,
};
