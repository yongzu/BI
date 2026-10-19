import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CourseType, Pillar } from '../../data/programs';
import { openCourse } from '../CourseExplorer/openCourse';
import './SkillScroll.css';

/**
 * 배우는 역량(v12, 2026-10-19) — toss.im 홈 "상품마다 판매 전략이 다르듯 광고 노출 전략도 다르게" 구간의 연출(사용자 지시 2026-10-19).
 *
 * - 왼쪽 정렬 두 줄 제목 + 작은 배지가 아래에서 들어온다.
 * - 무대가 화면에 붙은 채 세로로 스크롤하는 동안 카드 줄이 화면 오른쪽에서 들어와 왼쪽으로 가로 이동한다 —
 *   세로 스크롤이 가로 진행이 된다. 마지막 카드가 오른쪽 끝에 다 보이면 무대가 풀려 페이지가 이어진다.
 * - 카드 = 흰 면 위쪽의 둥근 회색 그림 틀(번호 · 영문) + 작은 회색 한 줄(요약) + 굵은 이름(토스 광고 카드의 조건 · 상품명 자리).
 *   전문 · 기르는 수업 수는 그 아래 그대로(v10 · v11과 같은 내용). "이 역량을 기르는 수업"은 마우스를 올리거나 누를 때만.
 * 휴대폰 · 움직임 줄이기: 붙는 무대 없이 옆으로 넘기는 줄.
 */
type Course = { slug: string; en: string; tags: string[]; type: string };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function SkillScroll({ lines, badge, lead, chip, items, courseTypes }: { lines: string[]; badge: string; lead: string; chip?: ReactNode; items: Pillar[]; courseTypes: CourseType[] }) {
  const courses: Course[] = courseTypes.flatMap((t) => t.courses.map((c) => ({ slug: c.slug, en: c.en, tags: c.tags, type: t.name })));
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const pinOn = window.matchMedia('(min-width: 1101px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const on = pinOn.matches && !reduced;
      wrap.toggleAttribute('data-pin', on);
      if (!on) {
        track.style.transform = '';
        document.documentElement.removeAttribute('data-immersive');
        return;
      }
      const r = wrap.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = clamp01(-r.top / span);
      document.documentElement.toggleAttribute('data-immersive', r.top <= 0 && r.bottom >= window.innerHeight);
      // 출발: 화면 오른쪽 40% 지점에서 첫 카드 / 도착: 마지막 카드의 오른쪽 끝이 화면 오른쪽 여백에
      const vw = document.documentElement.clientWidth;
      const side = Math.max(24, vw * 0.03);
      const startX = vw * 0.58 - track.offsetLeft;
      const endX = vw - side - track.offsetLeft - track.scrollWidth;
      const x = startX + (Math.min(endX, startX) - startX) * p;
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
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
  }, []);

  return (
    <div ref={wrapRef} className="skill-scroll">
      <div className="skill-scroll__stage">
        <header className="skill-scroll__head">
          <h2 className="skill-scroll__title">
            {lines.map((line, k) => (
              <span key={line} className="skill-scroll__line">
                {line}
                {k === lines.length - 1 && <span className="skill-scroll__badge">{badge}</span>}
              </span>
            ))}
          </h2>
          <p className="skill-scroll__lead">{lead}</p>
          {chip}
        </header>

        <ol ref={trackRef} className="skill-scroll__track">
          {items.map((p, i) => {
            const related = courses.filter((c) => c.tags.includes(p.ko));
            return (
              <li key={p.en} className="ss-slot">
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
      className="ss-card"
      data-open={shown}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true); }}
      onPointerLeave={() => setHover(false)}
      onClick={onToggle}
    >
      {/* 토스 광고 카드의 화면 그림 자리 — 둥근 회색 틀 안에 번호 · 영문 */}
      <div className="ss-card__frame">
        <div className="ss-card__screen">
          <span className="ss-card__en">{p.en}</span>
          <span className="ss-card__num">{String(index + 1).padStart(2, '0')}</span>
          <span className="ss-dots" aria-hidden="true">
            {Array.from({ length: courseTotal }, (_, k) => <span key={k} data-on={k < related.length} />)}
          </span>
        </div>
      </div>
      <div className="ss-card__text">
        <p className="ss-card__summary">{p.summary}</p>
        <h3 className="ss-card__ko">{p.ko}</h3>
        <p className="ss-card__body">{p.body}</p>
      </div>
      <button type="button" className="ss-card__toggle" aria-expanded={shown} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        {shown ? '닫기' : `기르는 수업 ${related.length} 보기`}
      </button>

      {/* 이 역량을 기르는 수업 — 마우스 올림 · 누름 전엔 숨김, 아래에서 올라온다 */}
      <div className="ss-courses" data-shown={shown} inert={!shown} data-lenis-prevent onClick={(e) => e.stopPropagation()}>
        <span className="ss-courses__label">이 역량을 기르는 수업 {related.length}</span>
        <ul>
          {related.map((c) => (
            <li key={c.slug}>
              <button type="button" className="ss-course" onClick={() => openCourse(c.slug)}>
                {c.en}<span className="ss-course__type">{c.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
