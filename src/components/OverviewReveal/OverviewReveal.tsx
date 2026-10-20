import { useEffect, useRef, type CSSProperties } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { SCROLL_REVEAL_FAST } from '../ScrollReveal/preset';
import './OverviewReveal.css';

/**
 * 과정 개요(2026-10-19) — vectrfl.com "Designed for today's operations" 구간의 연출(사용자 지시 2026-10-19).
 *
 * 화면 폭 전체를 네 칸으로 나눈다: 왼쪽 두 칸은 소개 글 두 문단, 오른쪽 두 칸은 과정 개요(다섯 줄 + 구분선, v5 형식).
 * 칸 왼쪽 세로선과 큰 제목은 처음부터 보이고, 칸의 내용이 80px 아래에서 차례로 떠오른다 — 첫 문단 → 둘째 문단 →
 * 과정 개요 제목 → 다섯 줄.
 * (2026-10-20 사용자 지시) 붙는 무대(스크롤 180svh 동안 스크롤에 묶여 떠오름)를 없앴다 — 스크롤이 너무 많이 들고, 다 나온 뒤
 * 무대가 풀리며 페이지가 다시 내려갈 때 뚝 끊겼다. 이제 칸이 화면 아래쪽(94% 선)에 들어오면 한 번에 시간으로 차례차례 떠오르고,
 * 페이지는 멈추지 않고 그대로 내려간다.
 * 좁은 화면도 같은 방식으로 칸이 위아래로 쌓인다. 움직임 줄이기 · 이미 지나 있는 때(스크롤 복원)는 처음부터 보인다.
 * (2026-10-20 사용자 지시) 큰 제목 · 소개 두 문단은 react-bits ScrollReveal(enter · 단어마다 흐림 10px → 또렷 · 기울기 0)로 —
 * 화면에 들어오면 단어가 차례로 또렷해진다. 과정 개요 제목 · 다섯 줄은 위의 차례로 떠오르기 그대로.
 */
type Fact = { label: string; value: string };


/** 단계 순서값(--at, 0 → 약 0.8)을 지연 시간으로 바꾸는 배율(초) — 다섯 줄까지 1초 남짓 */
const DELAY_S = 1.4;

export function OverviewReveal({ id, title, paragraphs, factsTitle, facts }: { id: string; title: string; paragraphs: string[]; factsTitle: string; facts: Fact[] }) {
  const wrapRef = useRef<HTMLElement>(null);
  // 떠오르는 순서: (문단들은 ScrollReveal) → 과정 개요 제목 → 줄들(줄 사이는 촘촘히)
  const headAt = paragraphs.length * 0.2;
  const rowAt = (i: number) => headAt + 0.06 + i * 0.08;

  useEffect(() => {
    const wrap = wrapRef.current;
    const grid = wrap?.querySelector<HTMLElement>('.overview-reveal__grid');
    if (!wrap || !grid) return;
    // 움직임 줄이기 · 이미 위로 지나 있으면(스크롤 복원) 처음부터 보인다
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || grid.getBoundingClientRect().top < window.innerHeight * 0.5) return;
    wrap.setAttribute('data-anim', ''); // 숨긴 채 기다린다
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        wrap.setAttribute('data-shown', '');
        io.disconnect();
      },
      { rootMargin: '0px 0px -6% 0px' }, // 칸 위 끝이 화면 아래쪽(94% 선)에 들어오자마자
    );
    io.observe(grid);
    return () => io.disconnect();
  }, []);

  const at = (v: number) => ({ '--at': v, '--delay': `${(v * DELAY_S).toFixed(2)}s` } as CSSProperties);

  return (
    <section ref={wrapRef} id={id} className="overview-reveal" aria-labelledby={`${id}-title`}>
      <div className="overview-reveal__stage">
        <ScrollReveal as="h2" id={`${id}-title`} containerClassName="overview-reveal__title sr-plain" {...SCROLL_REVEAL_FAST}>{title}</ScrollReveal>
        <div className="overview-reveal__grid">
          {paragraphs.map((p) => (
            <div key={p.slice(0, 12)} className="ov-col">
              <ScrollReveal as="p" containerClassName="ov-para sr-plain" {...SCROLL_REVEAL_FAST}>{p}</ScrollReveal>
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
