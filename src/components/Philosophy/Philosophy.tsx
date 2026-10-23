import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import './Philosophy.css';

/**
 * 교육 철학(v16, 2026-10-23) — 히어로 다음의 큰 글. sui.io 'The economy, rebuilt for autonomous participants' 자리를 따른다:
 * 위에 작은 회색 라벨, 아래 큰 글. 글 속 [낱말]은 테두리 캡슐로 강조한다(시안의 '사고방식').
 *
 * v17(사용자 지시 2026-10-23): 한 화면에 한 단락만. 화면 높이의 무대가 붙어 있는 동안 스크롤하면
 * 지금 단락이 낱말마다 옅은 회색 → 잉크로 채워지고, 다 채워진 뒤 위로 비키며 다음 단락이 아래에서 올라온다.
 * 단락마다 스크롤 STEP(화면 높이의 배수)을 쓰고, 그중 앞 FILL만큼에서 낱말이 채워진다. 나머지는 다 채운 채 머문다.
 * 움직임 줄이기면 붙는 무대 없이 단락을 차례로 쌓고 처음부터 다 채운다(CSS).
 */
type Props = { label: string; paragraphs: string[][] };

/** 한 단락이 쓰는 스크롤 길이(화면 높이 배수) */
const STEP = 1.2;
/** 그중 낱말이 채워지는 몫 */
const FILL = 0.7;

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
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const track = root.querySelector<HTMLElement>('.philosophy__track')!;
    const blocks = [...root.querySelectorAll<HTMLElement>('.philosophy__para')].map((el) => ({
      el,
      words: [...el.querySelectorAll<HTMLElement>('.philosophy__word')],
      lit: -1,
    }));
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight; // 무대가 붙어 있는 동안의 스크롤 길이
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      const at = Math.min(blocks.length - 1, Math.floor(p * blocks.length)); // 지금 단락
      const local = p * blocks.length - at; // 지금 단락 안의 진행 0 → 1
      blocks.forEach((b, i) => {
        b.el.dataset.state = i < at ? 'past' : i > at ? 'next' : 'now';
        const fill = i < at ? 1 : i > at ? 0 : Math.min(1, local / FILL);
        const lit = Math.round(fill * b.words.length) - 1;
        if (lit === b.lit) return;
        b.words.forEach((w, k) => w.toggleAttribute('data-lit', k <= lit));
        b.lit = lit;
      });
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
    <section ref={ref} id="philosophy" className="philosophy" aria-labelledby="philosophy-label" style={{ '--ph-n': paragraphs.length, '--ph-step': STEP } as CSSProperties}>
      <div className="philosophy__track">
        <div className="philosophy__stage">
          <h2 id="philosophy-label" className="philosophy__label">{label}</h2>
          <div className="philosophy__paras">
            {paragraphs.map((sentences, i) => (
              <div key={i} className="philosophy__para" data-state={i === 0 ? 'now' : 'next'}>
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
          </div>
        </div>
      </div>
    </section>
  );
}
