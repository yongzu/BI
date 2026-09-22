import Lenis from 'lenis';

/**
 * Smooth wheel scrolling — started from the Phi Brain IPS page settings, then quickened
 * a little (사용자 지시 2026-09-22 — "너무 느리다"):
 * - lerp 0.07 → 0.09: a notch settles in about 0.7s instead of ~1s
 * - wheelMultiplier 0.9 → 1: each notch travels the browser's normal distance again
 * - touch stays native; nothing is created when the user asks for reduced motion
 */
export const lenis: Lenis | null = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? null
  : new Lenis({ lerp: 0.09, wheelMultiplier: 1, autoRaf: true });

// No hover pause while scrolling: turning pointer events off during the glide (as the IPS page
// does) swallowed any click made mid-scroll — the press lands on <html> before anything can turn
// them back on (사용자 제보 2026-09-22). Clicks always work now.

/**
 * Where the browser's own scrollIntoView({block:'start'}) would put an element: its layout top
 * (offsetTop chain — ignores the rise-in transform a not-yet-revealed section still carries,
 * which getBoundingClientRect would count) minus scroll-margin-top and the root's scroll-padding-top.
 */
function layoutTop(el: HTMLElement) {
  let top = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  return Math.max(0, top - margin - padding);
}

/** Scroll to a page Y or an element (scroll-margin / scroll-padding respected), smooth when Lenis runs. */
export function scrollToTarget(target: number | HTMLElement, { immediate = false } = {}) {
  if (lenis) {
    lenis.scrollTo(typeof target === 'number' ? target : layoutTop(target), { immediate, force: true });
    return;
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' });
}
