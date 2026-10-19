import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { CourseType, Pillar } from '../../data/programs';
import { openCourse } from '../CourseExplorer/openCourse';
import './SkillReveal.css';

/**
 * 배우는 역량(v11, 2026-10-19) — toss.im 홈 "상품 판매와 정산" 구간의 연출(사용자 지시 2026-10-19).
 *
 * 무대가 화면에 붙은 채 스크롤하는 동안:
 *  1) 화면 가운데의 큰 옅은 글씨가 한 글자씩 검정으로 채워진다. 채워지는 경계에 커서 막대가 따라간다.
 *  2) 다 채워지면 글씨가 작아지며 위로 올라가고, 아래에 리드 문장이 나타난다.
 *  3) 화면 폭을 다 쓰는 카드 줄이 높낮이가 엇갈린 채 아래에서 차례로 올라온다 — 토스는 6장, 우리는 5장이라
 *     다섯 장이 화면 폭을 나눠 쓰도록 카드 폭을 (화면 폭 − 여백) ÷ 5로 키웠다.
 * 다 올라오면 무대가 풀려 페이지가 이어진다. 스크롤에 묶여 사용자가 속도를 쥐고, 저절로 넘어가지 않는다.
 * 카드 내용은 v10과 같다(번호 · 영문 · 이름 · 요약 · 전문 · 기르는 수업 수). "이 역량을 기르는 수업"은
 * 카드에 마우스를 올리거나 누르기 전엔 숨긴다(v10 지시 유지) — 키보드는 카드 안 버튼으로.
 * 휴대폰 · 움직임 줄이기: 붙는 무대 없이 글씨는 처음부터 채워진 채, 카드는 옆으로 넘기는 줄.
 */
type Course = { slug: string; en: string; tags: string[]; type: string };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (x: number) => 1 - (1 - x) ** 3;

export function SkillReveal({ title, lead, chip, items, courseTypes }: { title: string; lead: string; chip?: ReactNode; items: Pillar[]; courseTypes: CourseType[] }) {
  const courses: Course[] = courseTypes.flatMap((t) => t.courses.map((c) => ({ slug: c.slug, en: c.en, tags: c.tags, type: t.name })));
  const wrapRef = useRef<HTMLDivElement>(null);
  const chars = [...title];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pinOn = window.matchMedia('(min-width: 1101px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spans = [...wrap.querySelectorAll<HTMLElement>('.sr-char')];
    const cards = [...wrap.querySelectorAll<HTMLElement>('.sr-card-slot')];
    let raf = 0;
    const tick = () => {
      raf = 0;
      const on = pinOn.matches && !reduced;
      wrap.toggleAttribute('data-pin', on);
      // 붙지 않으면 처음부터 끝 장면(다 채운 작은 글씨 + 카드)
      let p = 1;
      if (on) {
        const r = wrap.getBoundingClientRect();
        const span = Math.max(1, r.height - window.innerHeight);
        p = clamp01(-r.top / span);
        document.documentElement.toggleAttribute('data-immersive', r.top <= 0 && r.bottom >= window.innerHeight);
      } else {
        document.documentElement.removeAttribute('data-immersive');
      }
      // 1) 글자 채움 0 → 0.4
      const fill = range(p, 0.04, 0.4) * chars.length;
      spans.forEach((s, k) => {
        s.toggleAttribute('data-on', k < Math.floor(fill + 0.001));
        s.toggleAttribute('data-caret', fill > 0 && fill < chars.length && k === Math.min(chars.length - 1, Math.floor(fill)));
      });
      // 2) 작아지며 위로 0.42 → 0.6, 리드 0.52 → 0.66
      wrap.style.setProperty('--sr-shrink', ease(range(p, 0.42, 0.6)).toFixed(4));
      wrap.style.setProperty('--sr-lead', range(p, 0.52, 0.66).toFixed(4));
      // 3) 카드가 차례로 올라온다 0.55 → 0.92
      cards.forEach((c, i) => c.style.setProperty('--sr-in', ease(range(p, 0.55 + i * 0.05, 0.75 + i * 0.05)).toFixed(4)));
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
      document.documentElement.removeAttribute('data-immersive');
    };
  }, [chars.length]);

  return (
    <div ref={wrapRef} className="skill-reveal">
      <div className="skill-reveal__stage">
        <header className="skill-reveal__head">
          <h2 className="skill-reveal__title" aria-label={title}>
            {chars.map((ch, k) => (
              <span key={k} className="sr-char" aria-hidden="true">{ch === ' ' ? ' ' : ch}</span>
            ))}
          </h2>
          <p className="skill-reveal__lead">{lead}</p>
          {chip && <div className="skill-reveal__chip">{chip}</div>}
        </header>

        <ol className="skill-reveal__cards">
          {items.map((p, i) => {
            const related = courses.filter((c) => c.tags.includes(p.ko));
            return (
              <li key={p.en} className="sr-card-slot" style={{ '--i': i } as CSSProperties}>
                <SkillCard
                  p={p}
                  index={i}
                  related={related}
                  courseTotal={courses.length}
                  open={openIdx === i}
                  onToggle={() => setOpenIdx((v) => (v === i ? null : i))}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function SkillCard({ p, index, related, courseTotal, open, onToggle }: { p: Pillar; index: number; related: Course[]; courseTotal: number; open: boolean; onToggle: () => void }) {
  const [hover, setHover] = useState(false);
  const shown = hover || open;
  return (
    <article
      className="sr-card"
      data-open={shown}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true); }}
      onPointerLeave={() => setHover(false)}
      onClick={onToggle}
    >
      {/* 토스 카드의 상품 사진 자리 — 번호와 영문 이름 */}
      <div className="sr-card__visual">
        <span className="sr-card__num">{String(index + 1).padStart(2, '0')}</span>
        <span className="sr-card__badge">{p.en}</span>
      </div>
      <div className="sr-card__text">
        <h3 className="sr-card__ko">{p.ko}</h3>
        <p className="sr-card__summary">{p.summary}</p>
        <p className="sr-card__body">{p.body}</p>
        <span className="sr-card__count">
          <span className="sr-dots" aria-hidden="true">
            {Array.from({ length: courseTotal }, (_, k) => <span key={k} data-on={k < related.length} />)}
          </span>
          기르는 수업 {related.length}
        </span>
      </div>
      <button type="button" className="sr-card__toggle" aria-expanded={shown} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        {shown ? '닫기' : `기르는 수업 ${related.length} 보기`}
      </button>

      {/* 이 역량을 기르는 수업 — 마우스 올림 · 누름 전엔 숨김, 아래에서 올라온다 */}
      <div className="sr-courses" data-shown={shown} inert={!shown} data-lenis-prevent onClick={(e) => e.stopPropagation()}>
        <span className="sr-courses__label">이 역량을 기르는 수업 {related.length}</span>
        <ul>
          {related.map((c) => (
            <li key={c.slug}>
              <button type="button" className="sr-course" onClick={() => openCourse(c.slug)}>
                {c.en}<span className="sr-course__type">{c.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
