import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { RippleControl } from '../HeroRipple/HeroRipple';
import './HeroPortal.css';

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Φ 고리 — 히어로 뒤의 큰 궤도(H1 · H3)와 역량 무대 뒤(이음 A)에 같은 모양으로 쓴다.
 * 3D 로고의 X자 장면처럼 두 타원이 ±엇갈린다. 선 굵기는 크기와 상관없이 1.5px(non-scaling-stroke).
 * 타원 바깥선은 가운데를 지나지 않으므로(가장 가까운 거리 = 짧은 반지름) 가운데 글자 위를 긋지 않는다.
 */
export function PhiRings({ className }: { className?: string }) {
  return (
    <svg className={['phi-rings', className].filter(Boolean).join(' ')} viewBox="-100 -100 200 200" aria-hidden="true">
      {/* 돌릴 땐 svg가 아니라 안쪽 g를 돌린다 — svg 상자를 돌리면 대각선 폭만큼 문서 폭이 늘어난다 */}
      <g className="phi-rings__g">
        <ellipse cx="0" cy="0" rx="92" ry="66" transform="rotate(-28)" />
        <ellipse cx="0" cy="0" rx="92" ry="66" transform="rotate(28)" />
      </g>
    </svg>
  );
}

/**
 * 히어로 포털(v9, 2026-10-19) — H1 포인터 깊이 + H3 스크롤 포털.
 *
 * H1: 마우스가 히어로 위를 움직이면 앞(3D 로고)은 커서 쪽으로, 뒤(Φ 고리)는 반대쪽으로 조금 움직여 깊이가 생긴다.
 *   제목 · 문장은 파동 캔버스가 같은 자리에 다시 그리므로 움직이지 않는 기준면으로 둔다.
 * H3: 히어로가 화면에 붙은 채(sticky) 한 화면 스크롤하는 동안 글은 흐려지며 물러나고, 로고는 커지며
 *   같은 모양의 선 고리(포털 고리)에 자리를 넘긴다. 포털 고리는 로고 크기에서 출발해 화면 밖까지 기하급수로 커져
 *   "고리 안으로 들어가는" 장면이 된다. 뒤의 큰 궤도 고리는 그동안 물러난다 — 토스 홈 01→02(영상 카드가 화면 가득 커지는 전환).
 *   포털이 도는 동안은 파동을 멈춘다(캔버스가 옮겨 그린 자리와 움직이는 글자가 어긋나지 않게).
 * 값은 CSS 변수 하나씩(--portal 0→1, --px · --py −1→1)으로만 넘기고, 움직임은 CSS가 그린다.
 * 휴대폰 · 움직임 줄이기에선 포털 없이 원래 히어로(붙지 않음), 포인터 깊이는 마우스에서만.
 */
export function HeroPortal({ children, rippleCtl }: { children: ReactNode; rippleCtl: RefObject<RippleControl | null> }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const portalOn = window.matchMedia('(min-width: 721px)');

    let raf = 0;
    let paused = false;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    const tick = () => {
      raf = 0;
      // 스크롤 진행: 감싼 상자가 화면을 지나는 동안(히어로가 붙어 있는 동안) 0 → 1
      const r = el.getBoundingClientRect();
      const range = Math.max(1, r.height - window.innerHeight);
      const p = portalOn.matches ? Math.min(1, Math.max(0, -r.top / range)) : 0;
      el.style.setProperty('--portal', p.toFixed(4));
      // 포털 고리: 로고 크기에서 출발해 로고와 엇갈려 나타나고(0.06–0.2), 화면 밖까지 기하급수로 커진 뒤(×26) 사라진다(0.75–0.9)
      const grow = Math.min(1, Math.max(0, (p - 0.08) / 0.8));
      el.style.setProperty('--ps', Math.pow(26, grow).toFixed(4));
      el.style.setProperty('--pg', smooth(0, 0.6, grow).toFixed(4)); // 로고 자리 → 화면 가운데로 옮겨 가는 정도
      el.style.setProperty('--po', (smooth(0.06, 0.2, p) * (1 - smooth(0.75, 0.9, p))).toFixed(4));
      el.toggleAttribute('data-active', p > 0.01);
      el.toggleAttribute('data-out', p > 0.5);
      const shouldPause = p > 0.01;
      if (shouldPause !== paused) {
        paused = shouldPause;
        rippleCtl.current?.setPaused(paused);
      }
      // 포인터는 매 프레임 12%씩 따라간다 — 손을 떼도 부드럽게 제자리로
      cur.x += (target.x - cur.x) * 0.12;
      cur.y += (target.y - cur.y) * 0.12;
      el.style.setProperty('--px', cur.x.toFixed(4));
      el.style.setProperty('--py', cur.y.toFixed(4));
      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) schedule();
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // 포털 고리가 로고 자리 · 크기에서 출발하도록 로고의 배치(변형 전)를 잰다
    const measure = () => {
      const logo = el.querySelector<HTMLElement>('.hero-logo');
      if (!logo) return;
      el.style.setProperty('--lx', `${logo.offsetLeft + logo.offsetWidth / 2}px`);
      el.style.setProperty('--ly', `${logo.offsetTop + logo.offsetHeight / 2}px`);
      el.style.setProperty('--lw', `${logo.offsetWidth * 0.86}px`);
    };
    measure();
    const ro = new ResizeObserver(() => { measure(); schedule(); });
    ro.observe(el);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((e.clientY - Math.max(r.top, 0)) / Math.min(r.height, window.innerHeight)) * 2 - 1;
      schedule();
    };
    const onLeave = () => { target.x = 0; target.y = 0; schedule(); };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    portalOn.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      portalOn.removeEventListener('change', schedule);
      ro.disconnect();
    };
  }, [rippleCtl]);

  return <div ref={ref} className="hero-portal">{children}</div>;
}
