import { useEffect, useRef, type CSSProperties } from 'react';
import './OverviewReveal.css';

/**
 * 과정 개요(2026-10-19) — vectrfl.com "Designed for today's operations" 구간의 연출(사용자 지시 2026-10-19).
 *
 * 화면 폭 전체를 네 칸으로 나눈다: 왼쪽 두 칸은 소개 글 두 문단, 오른쪽 두 칸은 과정 개요(다섯 줄 + 구분선, v5 형식).
 * 무대가 화면에 붙은 채 스크롤하는 동안 칸이 세로선과 함께 80px 아래에서 투명하게 차례로 떠오른다
 * — 첫 문단 칸 → 둘째 문단 칸 → 과정 개요 칸 → 다섯 줄(사용자 지시 2026-10-19: 빈 칸의 선이 먼저 보이지 않게).
 * 큰 제목은 섹션이 화면 아래에서 올라와 붙는 동안 흐림에서 또렷해진다. 모두 스크롤에 묶여 사용자가 속도를 쥔다.
 * 다 나오면 무대가 풀려 페이지가 이어진다.
 * 좁은 화면 · 움직임 줄이기: 붙는 무대 없이 모두 보인 채 칸이 위아래로 쌓인다.
 */
type Fact = { label: string; value: string };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - (1 - x) ** 3;
/** 한 단계가 떠오르는 데 쓰는 스크롤 몫(무대 진행 0 → 1 중) */
const STEP = 0.2;
/** 프레임마다 목표값을 따라가는 비율 — 작을수록 더 미끄러진다 */
const FOLLOW = 0.14;

export function OverviewReveal({ id, title, paragraphs, factsTitle, facts }: { id: string; title: string; paragraphs: string[]; factsTitle: string; facts: Fact[] }) {
  const wrapRef = useRef<HTMLElement>(null);
  // 떠오르는 순서: 문단들 → 과정 개요 제목 → 줄들(줄 사이는 촘촘히)
  const paraAt = (i: number) => i * 0.2;
  const headAt = paragraphs.length * 0.2;
  const rowAt = (i: number) => headAt + 0.06 + i * 0.08;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pinOn = window.matchMedia('(min-width: 1101px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const steps = [...wrap.querySelectorAll<HTMLElement>('.ov-step')];
    // 스크롤 위치를 곧바로 쓰지 않고 매 프레임 조금씩 따라가게(GSAP scrub처럼) — 휠 한 칸마다 값이 뛰어
    // 뚝뚝 끊겨 보이던 것을 부드럽게 잇는다(사용자 지시 2026-10-19). 처음 그릴 땐 바로 맞춘다
    let cur = { p: -1, enter: -1 };
    let raf = 0;
    const tick = () => {
      raf = 0;
      const on = pinOn.matches && !reduced;
      wrap.toggleAttribute('data-pin', on);
      const r = wrap.getBoundingClientRect();
      const p = on ? clamp01(-r.top / Math.max(1, r.height - window.innerHeight)) : 1;
      // 제목: 섹션 위 끝이 화면 아래(0) → 화면 맨 위(1)로 올라오는 동안 흐림 → 또렷
      const enter = reduced ? 1 : clamp01(1 - r.top / window.innerHeight);
      const first = cur.p < 0;
      cur = first || !on
        ? { p, enter }
        : { p: cur.p + (p - cur.p) * FOLLOW, enter: cur.enter + (enter - cur.enter) * FOLLOW };
      wrap.style.setProperty('--ov-title', ease(clamp01((cur.enter - 0.15) / 0.75)).toFixed(4));
      steps.forEach((el) => {
        const at = parseFloat(el.style.getPropertyValue('--at')) || 0;
        el.style.setProperty('--in', ease(clamp01((cur.p - at) / STEP)).toFixed(4));
      });
      // 아직 따라가는 중이면 다음 프레임에 이어서
      if (Math.abs(p - cur.p) > 0.0005 || Math.abs(enter - cur.enter) > 0.0005) schedule();
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    pinOn.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      pinOn.removeEventListener('change', schedule);
    };
  }, []);

  const at = (v: number) => ({ '--at': v } as CSSProperties);

  return (
    <section ref={wrapRef} id={id} className="overview-reveal" aria-labelledby={`${id}-title`}>
      <div className="overview-reveal__stage">
        <h2 id={`${id}-title`} className="overview-reveal__title">{title}</h2>
        <div className="overview-reveal__grid">
          {paragraphs.map((p, i) => (
            <div key={p.slice(0, 12)} className="ov-col ov-step" style={at(paraAt(i))}>
              <p className="ov-para">{p}</p>
            </div>
          ))}
          {/* 과정 개요 — 두 칸을 함께 쓰고, 다섯 줄을 가는 선으로 나눈다(v5) */}
          <div className="ov-col ov-col--facts ov-step" style={at(headAt)}>
            <p className="ov-facts__head">{factsTitle}</p>
            <dl className="ov-facts">
              {facts.map((f, i) => (
                <div key={f.label} className="ov-step ov-row" style={at(rowAt(i))}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
