import { useEffect, useRef } from 'react';
import type { LogoScene } from './scene';
import './HeroLogo3D.css';

/**
 * 히어로 3D Φ 로고 — 'Programs' 위(사용자 지시 2026-10-05). 장면 · 움직임은 phi.design 그대로(scene.ts).
 *
 * - Three.js는 따로 나눠 불러와 첫 화면 글자를 늦추지 않는다.
 * - 첫 화면에선 제목과 함께 40px 아래에서 떠오른다(HeroLogo3D.css, 신호는 HeroRipple의 data-intro-go).
 * - 두 고리가 X자(±45°로 엇갈림)인 장면이 한 바퀴의 처음 · 끝(구운 프레임 0 · 150)이고, Φ는 한가운데(프레임 ~78)다.
 *   한 바퀴(5.61초)마다 X자에 내려앉기 POSE_LEAD_MS 전에 onPose를 부른다 — 글자 파동이 차오르는 동안(처음 15%) 로고가
 *   X자에 멈춰 선다(사용자 지시 2026-10-05: Φ 모양이 아니라 X자일 때 일렁이게).
 * - 화면 밖이면 멈춘다. 움직임 줄이기면 Φ 한 장면으로 멈춰 둔다. WebGL을 못 쓰면 자리째 감춘다.
 */

const POSE_LEAD_MS = 300;
/** Φ 장면(프레임 78)의 바퀴 안 시각 — 등속 구간: 0.6초 + (78/150 × 5초 − 0.24초) */
const PHI_MS = 2960;

type Props = { onPose?: () => void };

export function HeroLogo3D({ onPose }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onPoseRef = useRef(onPose);
  useEffect(() => { onPoseRef.current = onPose; }, [onPose]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let scene: LogoScene | null = null;
    let raf = 0;
    let io: IntersectionObserver | null = null;

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
        let lastPoseCycle = -1;
        const frame = (now: number) => {
          raf = 0;
          if (start < 0) start = now;
          const elapsed = now - start;
          const cycle = Math.floor(elapsed / CYCLE_MS);
          const ms = elapsed - cycle * CYCLE_MS;
          if (ms >= CYCLE_MS - POSE_LEAD_MS && cycle !== lastPoseCycle) {
            lastPoseCycle = cycle;
            onPoseRef.current?.();
          }
          s.step();
          s.render(ms, cycle);
          if (visible) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && !raf && !disposed) raf = requestAnimationFrame(frame);
        });
        io.observe(host);

        // 개발용: window.__heroLogo(ms, cycle)로 한 장면을 멈춰 볼 수 있다(검증 · 스크린샷). null이면 다시 재생
        if (import.meta.env.DEV) {
          (window as unknown as Record<string, unknown>).__heroLogo = (ms: number | null, cycle = 0) => {
            cancelAnimationFrame(raf);
            raf = 0;
            if (ms == null) { start = -1; raf = requestAnimationFrame(frame); return; }
            s.render(ms, cycle);
          };
        }
      })
      .catch((e) => {
        console.warn('[HeroLogo3D]', e);
        host.dataset.failed = '';
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io?.disconnect();
      scene?.dispose();
    };
  }, []);

  return <div ref={hostRef} className="hero-logo" aria-hidden="true" />;
}
