import { Fragment, useEffect, useRef } from 'react';
import './Philosophy.css';

/**
 * 교육 철학(v16, 2026-10-23) — 히어로 다음의 큰 글. sui.io 'The economy, rebuilt for autonomous participants' 자리를 따른다:
 * 위에 작은 회색 라벨, 아래 화면 폭을 채우는 큰 글. 글은 화면을 지나가는 만큼 낱말마다 옅은 회색 → 잉크로 채워진다
 * (사용자 시안 '뷰포트로 스크롤되게'). 단락의 위 끝이 화면 아래 85% 선에 닿으면 시작해 아래 끝이 45% 선을 지나면 다 채워진다.
 * 글 속 [낱말]은 테두리 캡슐로 강조한다(시안의 '사고방식'). 움직임 줄이기면 처음부터 다 채워져 있다.
 */
type Props = { label: string; paragraphs: string[][] };

/** 문장을 낱말로 — [ ]로 감싼 낱말은 강조 표시를 붙인다 */
function words(sentence: string) {
  return sentence.split(/(\[[^\]]+\])|\s+/).filter(Boolean).map((w) =>
    w.startsWith('[') ? { text: w.slice(1, -1), mark: true } : { text: w, mark: false },
  );
}

export function Philosophy({ label, paragraphs }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const blocks = [...root.querySelectorAll<HTMLElement>('.philosophy__para')].map((el) => ({
      el,
      words: [...el.querySelectorAll<HTMLElement>('.philosophy__word')],
      lit: -1,
    }));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      blocks.forEach((b) => b.words.forEach((w) => w.setAttribute('data-lit', '')));
      return;
    }
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const b of blocks) {
        const r = b.el.getBoundingClientRect();
        const start = vh * 0.85;
        const end = vh * 0.45;
        // 0 = 위 끝이 85% 선, 1 = 아래 끝이 45% 선
        const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height)));
        const lit = Math.round(p * b.words.length) - 1;
        if (lit === b.lit) continue;
        b.words.forEach((w, i) => w.toggleAttribute('data-lit', i <= lit));
        b.lit = lit;
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section ref={ref} id="philosophy" className="philosophy" aria-labelledby="philosophy-label">
      <span id="philosophy-label" className="philosophy__label">{label}</span>
      {paragraphs.map((sentences, i) => (
        <div key={i} className="philosophy__para">
          {sentences.map((s, j) => (
            <p key={j} className="philosophy__sentence">
              {words(s).map((w, k) => (
                <Fragment key={k}>
                  {k > 0 && ' '}
                  <span className={`philosophy__word${w.mark ? ' philosophy__word--mark' : ''}`}>{w.text}</span>
                </Fragment>
              ))}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
