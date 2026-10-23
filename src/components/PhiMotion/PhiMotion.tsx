import { useEffect, useRef } from 'react';
import type { LogoScene } from './scene';
import { vectorHover } from '../VectorWord/VectorWord';
import './PhiMotion.css';

/**
 * Φ 모션그래픽(v18, 2026-10-23) — 교육 철학 오른쪽. phi.design 히어로의 Φ 고리(원본 데이터, v13 HeroLogo3D와 같은 장면)가 쉬지 않고 돈다.
 * 마우스를 올리면 벡터 보기: 고리가 흰 몸통 + 윤곽선이 되고(scene.setOutline), 바운딩 박스 · 안내선 · 좌표가 뜬다(VectorGuides).
 * 박스는 캔버스가 아니라 지금 그려진 고리에 딱 맞고, 고리가 도는 동안 프레임마다 크기 · 좌표가 바뀐다(scene.bounds).
 * 고리는 포인터 쪽으로 살짝 기운다(scene 그대로).
 * - Three.js는 따로 나눠 불러온다. 화면 밖이면 멈추고, 움직임 줄이기면 Φ 한 장면으로 멈춰 둔다. WebGL을 못 쓰면 자리째 감춘다.
 */

/** Φ 장면(프레임 78)의 바퀴 안 시각 — 등속 구간: 0.6초 + (78/150 × 5초 − 0.24초) */
const PHI_MS = 2960;

export function PhiMotion() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let scene: LogoScene | null = null;
    let raf = 0;
    let io: IntersectionObserver | null = null;
    let hovering = false;
    // 벡터 보기 박스 = 지금 그려진 고리의 화면 상자 — 프레임마다 다시 재 고리를 따라 크기 · 좌표가 바뀐다(사용자 지시 2026-10-23)
    const report = () => {
      const canvas = host.querySelector('canvas');
      if (!scene || !canvas) return;
      const c = canvas.getBoundingClientRect();
      const b = scene.bounds();
      vectorHover(new DOMRect(c.left + b.x, c.top + b.y, b.width, b.height));
    };

    import('./scene')
      .then(({ createLogoScene, CYCLE_MS }) => {
        if (disposed) return;
        scene = createLogoScene(host);
        const s = scene;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          s.render(PHI_MS, 0);
          return;
        }
        let visible = true;
        let start = -1;
        const frame = (now: number) => {
          raf = 0;
          if (start < 0) start = now;
          const elapsed = now - start;
          const cycle = Math.floor(elapsed / CYCLE_MS);
          s.step();
          s.render(elapsed - cycle * CYCLE_MS, cycle);
          if (hovering) report();
          if (visible) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && !raf && !disposed) raf = requestAnimationFrame(frame);
        });
        io.observe(host);

        // 개발용: window.__phiMotion(ms)로 한 장면을 그려 본다(검증 · 스크린샷)
        if (import.meta.env.DEV) {
          (window as unknown as Record<string, unknown>).__phiMotion = (ms: number) => {
            s.render(ms, 0);
            if (hovering) report();
          };
        }
      })
      .catch((e) => {
        console.warn('[PhiMotion]', e);
        host.dataset.failed = '';
      });

    // 벡터 보기 — 마우스를 쓰는 화면에서만
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const move = () => {
      if (!fine.matches || hovering) return;
      hovering = true;
      scene?.setOutline(true);
      report(); // 멈춰 있는 장면(움직임 줄이기)에서도 한 번은 잰다
    };
    const leave = () => {
      hovering = false;
      scene?.setOutline(false);
      vectorHover(null);
    };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io?.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      scene?.dispose();
    };
  }, []);

  return <div ref={hostRef} className="phi-motion" aria-hidden="true" />;
}
