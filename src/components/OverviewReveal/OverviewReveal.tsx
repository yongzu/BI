import { useEffect, useRef, type CSSProperties } from 'react';
import './OverviewReveal.css';

/**
 * 과정 개요(2026-10-19) — vectrfl.com "Designed for today's operations" 구간의 연출(사용자 지시 2026-10-19).
 *
 * 화면 폭 전체를 네 칸으로 나눈다: 왼쪽 두 칸은 소개 글 두 문단, 오른쪽 두 칸은 과정 개요(다섯 줄 + 구분선, v5 형식).
 * 칸 왼쪽 세로선과 큰 제목은 처음부터 보이고, 무대가 화면에 붙은 채 스크롤하는 동안 칸의 내용이
 * 80px 아래에서 차례로 떠오른다 — 첫 문단 → 둘째 문단 → 과정 개요 제목 → 다섯 줄. 스크롤에 묶여 사용자가 속도를 쥔다.
 * 다 나오면 무대가 풀려 페이지가 이어진다.
 * 좁은 화면 · 움직임 줄이기: 붙는 무대 없이 모두 보인 채 칸이 위아래로 쌓인다.
 */
type Fact = { label: string; value: string };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - (1 - x) ** 3;
/** 한 단계가 떠오르는 데 쓰는 스크롤 몫(무대 진행 0 → 1 중) */
const STEP = 0.2;

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
    let raf = 0;
    const tick = () => {
      raf = 0;
      const on = pinOn.matches && !reduced;
      wrap.toggleAttribute('data-pin', on);
      let p = 1;
      if (on) {
        const r = wrap.getBoundingClientRect();
        p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
      }
      steps.forEach((el) => {
        const at = parseFloat(el.style.getPropertyValue('--at')) || 0;
        el.style.setProperty('--in', ease(clamp01((p - at) / STEP)).toFixed(4));
      });
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
            <div key={p.slice(0, 12)} className="ov-col">
              <p className="ov-step ov-para" style={at(paraAt(i))}>{p}</p>
            </div>
          ))}
          {/* 과정 개요 — 두 칸을 함께 쓰고, 다섯 줄을 가는 선으로 나눈다(v5) */}
          <div className="ov-col ov-col--facts">
            <p className="ov-step ov-facts__head" style={at(headAt)}>{factsTitle}</p>
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
