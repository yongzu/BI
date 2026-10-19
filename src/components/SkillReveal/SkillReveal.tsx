import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { CourseType, Pillar } from '../../data/programs';
import { openCourse } from '../CourseExplorer/openCourse';
import TiltedCard, { TiltedCardLayer } from '../TiltedCard/TiltedCard';
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
 * 카드(2026-10-19 수정): 닫힌 카드엔 이름 · 영문 · 전문 앞부분만, 열면(마우스 올림 · 누름) 좌우로 넓어지고 아래로 길어지며
 * 전문 + 이 역량을 기르는 수업. TiltedCard로 기울고 글 층마다 깊이가 다르다(아래 SkillCard).
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
  const [openIdx, setOpenIdx] = useState<number | null>(null); // 누른 카드(고정)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null); // 마우스를 올린 카드
  const expanded = hoverIdx ?? openIdx;

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

        {/* 카드 줄 — 마우스를 올린(또는 누른) 카드가 좌우로 넓어지고 아래로 길어지며 나머지는 그만큼 좁아진다(v3 역량과 태도 상자).
            펼치는 카드는 하나: 마우스를 올린 카드가 우선, 마우스가 떠나면 누른 카드로 */}
        <ol className="skill-reveal__cards" data-open={expanded !== null} onPointerLeave={() => setHoverIdx(null)}>
          {items.map((p, i) => (
            <li key={p.en} className="sr-card-slot" data-open={expanded === i} style={{ '--i': i } as CSSProperties}>
              <SkillCard
                p={p}
                related={courses.filter((c) => c.tags.includes(p.ko))}
                open={expanded === i}
                onHover={() => setHoverIdx(i)}
                onToggle={() => setOpenIdx((v) => (v === i ? null : i))}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/**
 * 카드(v11 수정, 2026-10-19 사용자 지시):
 * - 닫힌 카드엔 이름(한글) · 영문 · 전문의 앞부분 두 줄만. 번호와 기르는 수업 정보는 없다(수 · 점 모두).
 * - 열면(마우스 올림 · 누름) 좌우로 넓어지고 아래로 길어지며 전문 전체 + 아래에 이 역량을 기르는 수업 목록.
 * - react-bits TiltedCard로 커서를 따라 기울고, 바탕 · 이름 · 본문이 서로 다른 깊이(TiltedCardLayer depth)라 글이 카드에서 떠 보인다.
 * - 키보드 · 터치: 카드 오른쪽 위 + 버튼(누름과 같다). 마우스는 카드 아무 데나 눌러도 고정된다.
 */
function SkillCard({ p, related, open, onHover, onToggle }: { p: Pillar; related: Course[]; open: boolean; onHover: () => void; onToggle: () => void }) {
  return (
    <div
      className="sr-card"
      data-open={open}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover(); }}
      onClick={onToggle}
    >
      <TiltedCard
        containerWidth="100%"
        containerHeight="100%"
        imageWidth="100%"
        imageHeight="100%"
        radius={22}
        perspective={1000}
        rotateAmplitude={open ? 7 : 11}
        scaleOnHover={1.02}
        glare={0.35}
        glareColor="#ffffff"
        shadow={0.32}
        parallax={1}
        intro={false}
        gyroscope={false}
        showTooltip={false}
        flipOnClick={false}
        className="sr-tilt"
      >
        <TiltedCardLayer depth={-10} className="sr-face__bg" />
        <TiltedCardLayer depth={30} className="sr-face__head">
          <h3 className="sr-card__ko">{p.ko}</h3>
          <span className="sr-card__en">{p.en}</span>
        </TiltedCardLayer>
        <TiltedCardLayer depth={16} className="sr-face__copy">
          {/* 닫힌 카드: 앞부분 두 줄 · 연 카드: 전문 + 수업(열린 폭에 맞춘 고정 폭이라 넓어지는 동안 줄바꿈이 흔들리지 않는다) */}
          <p className="sr-card__excerpt" aria-hidden={open}>{p.body}</p>
          <div className="sr-card__more" inert={!open} data-lenis-prevent onClick={(e) => e.stopPropagation()}>
            <p className="sr-card__body">{p.body}</p>
            <span className="sr-courses__label">이 역량을 기르는 수업</span>
            <ul className="sr-courses">
              {related.map((c) => (
                <li key={c.slug}>
                  <button type="button" className="sr-course" onClick={() => openCourse(c.slug)}>
                    {c.en}<span className="sr-course__type">{c.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </TiltedCardLayer>
      </TiltedCard>
      <button
        type="button"
        className="sr-card__toggle"
        aria-expanded={open}
        aria-label={open ? `${p.ko} 접기` : `${p.ko} 펼치기`}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
