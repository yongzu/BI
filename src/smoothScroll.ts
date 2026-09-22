import Lenis from 'lenis';

/**
 * Smooth wheel scrolling — the same settings as the Phi Brain IPS page.
 * - lerp 0.07: one wheel notch eases out over about a second instead of jumping
 * - wheelMultiplier 0.9: each notch travels 10% less
 * - touch stays native; nothing is created when the user asks for reduced motion
 * While Lenis is gliding, html gets `lenis-scrolling`, which index.css uses to
 * pause hover effects (cards passing under a still mouse would repaint and stutter).
 */
export const lenis: Lenis | null = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? null
  : new Lenis({ lerp: 0.07, wheelMultiplier: 0.9, autoRaf: true });

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
