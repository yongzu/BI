import { useEffect } from 'react';

/**
 * Apple-style text reveal: matched elements start transparent and slightly lower,
 * then rise into place and fade in as they enter the viewport (once).
 * Siblings revealed together are staggered via --reveal-delay.
 *
 * State lives in data-reveal ("pending" → "in"), which React never overwrites.
 */
export function useScrollReveal(selector: string, deps: unknown[] = []) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Skip only finished elements: pending ones must be re-observed after an effect re-run
    const elements = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => el.dataset.reveal !== 'in');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.reveal = 'in';
          observer.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    );

    elements.forEach((el) => {
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.matches(selector)) : [el];
      el.style.setProperty('--reveal-delay', `${Math.max(0, siblings.indexOf(el)) * 90}ms`);
      el.dataset.reveal = 'pending';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [selector, ...deps]);
}
