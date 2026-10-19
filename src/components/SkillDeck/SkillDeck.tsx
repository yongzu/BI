import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Text } from '../Text/Text';
import type { CourseType, Pillar } from '../../data/programs';
import { openCourse } from '../CourseExplorer/openCourse';
import { PhiRings } from '../HeroPortal/HeroPortal';
import './SkillDeck.css';

/**
 * 배우는 역량(v9, 2026-10-19) — 스킬 카드 덱. 초입에서 시선을 끌고 "이 1년에서 무엇을 얻나"에 답한다(사용자 지시 2026-10-19).
 *
 * C1 딜링: 무대가 화면에 붙은 채 스크롤하면, 한 묶음으로 쌓여 있던 카드 다섯 장이 차례로 한 줄로 펼쳐진다
 *   (토스플레이스 08 — 가운데 카드 뒤에서 좌우 카드가 펼쳐지는 전환). 다 펼쳐지면 무대가 풀려 그대로 읽는다.
 * 이음 A: 무대 뒤에 히어로와 같은 Φ 고리 — 히어로에서 들어간 고리 안이 이 무대다. 카드가 펼쳐지는 동안 고리가 돈다.
 * C2 기울기 · 빛: 마우스를 따라 카드가 기울고 표면에 빛이 지나간다(스킬 카드의 은유). 정보는 바뀌지 않는다 — 반응만.
 * C4 카드 → 상세: 카드를 누르면 그 카드가 커지며 상세(전문 · 기르는 수업)가 되고, 나머지 카드는 아래 작은 카드로 물러난다.
 *   View Transitions로 같은 카드가 자리와 크기를 바꾸는 것으로 보인다(지원하지 않는 브라우저는 바로 바뀜). 닫기 · Esc로 돌아간다.
 * 카드 앞면엔 번호 · 이름 · 요약 · 기르는 수업 수(12칸 점)가 늘 보인다 — 연출이 정보를 가리지 않는다.
 * 휴대폰 · 움직임 줄이기: 붙는 무대 · 딜링 · 기울기 없이 펼친 카드(휴대폰은 옆으로 넘기는 줄).
 */
type Course = { slug: string; en: string; tags: string[]; type: string };

/** header: 섹션 머리글 — 무대 안에 두어 카드가 펼쳐지는 동안 제목이 함께 머문다 */
export function SkillDeck({ items, courseTypes, header }: { items: Pillar[]; courseTypes: CourseType[]; header?: ReactNode }) {
  const courses: Course[] = courseTypes.flatMap((t) => t.courses.map((c) => ({ slug: c.slug, en: c.en, tags: c.tags, type: t.name })));
  const [open, setOpen] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const motion = useRef(true);

  // C1: 무대가 붙어 있는 동안의 진행(0 → 1)을 --deal로, 카드마다 늦게 출발하는 진행을 --di로
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    motion.current = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const on = window.matchMedia('(min-width: 901px)');
    const cards = [...wrap.querySelectorAll<HTMLElement>('.skill-slot')];
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const range = Math.max(1, r.height - window.innerHeight);
      const d = on.matches && motion.current ? Math.min(1, Math.max(0, -r.top / range)) : 1;
      wrap.style.setProperty('--deal', d.toFixed(4));
      // 무대가 화면에 붙어 있는 동안은 몰입 구간 — 목차를 잠시 걷는다(오른쪽 위 목차가 다섯째 카드를 가렸다)
      document.documentElement.toggleAttribute('data-immersive', on.matches && motion.current && r.top <= 0 && r.bottom >= window.innerHeight);
      cards.forEach((c, i) => {
        const di = Math.min(1, Math.max(0, (d * 1.25 - i * 0.07) / 0.8));
        c.style.setProperty('--di', (1 - (1 - di) ** 3).toFixed(4)); // 빠르게 출발해 감속
      });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    on.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      on.removeEventListener('change', schedule);
      document.documentElement.removeAttribute('data-immersive');
    };
  }, []);

  // C4: 카드 ↔ 상세 — 같은 카드가 자리와 크기를 바꾸는 장면으로
  const change = (next: number | null) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && motion.current) doc.startViewTransition(() => flushSync(() => setOpen(next)));
    else setOpen(next);
  };
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') change(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={wrapRef} className="skill-deck" data-open={open !== null}>
      <div className="skill-stage">
        <PhiRings className="skill-stage__rings" />
        {header}
        <ol className="skill-row">
          {items.map((p, i) => {
            const related = courses.filter((c) => c.tags.includes(p.ko));
            const isOpen = open === i;
            return (
              <li
                key={p.en}
                className="skill-slot"
                data-state={open === null ? 'card' : isOpen ? 'open' : 'mini'}
                style={{ '--i': i, '--n': items.length, viewTransitionName: `skill-${i}` } as CSSProperties}
              >
                {isOpen ? (
                  <SkillDetail p={p} index={i} related={related} total={courses.length} onClose={() => change(null)} />
                ) : (
                  <SkillCard p={p} index={i} related={related.length} total={courses.length} mini={open !== null} onOpen={() => change(i)} />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** 12칸 점 — 1학기 수업 12개 중 이 역량을 기르는 수업 수만큼 켠다 */
function Dots({ lit, total }: { lit: number; total: number }) {
  return (
    <span className="skill-dots" aria-hidden="true">
      {Array.from({ length: total }, (_, k) => <span key={k} data-on={k < lit} />)}
    </span>
  );
}

function SkillCard({ p, index, related, total, mini, onOpen }: { p: Pillar; index: number; related: number; total: number; mini: boolean; onOpen: () => void }) {
  // C2: 마우스를 따라 기울고(최대 10°) 빛이 커서 자리에 맺힌다 — 값은 CSS 변수로만(리렌더 없음)
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse' || mini) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty('--rx', `${(x - 0.5) * 20}deg`);
    e.currentTarget.style.setProperty('--ry', `${(0.5 - y) * 20}deg`);
    e.currentTarget.style.setProperty('--gx', `${x * 100}%`);
    e.currentTarget.style.setProperty('--gy', `${y * 100}%`);
    e.currentTarget.dataset.hover = '';
  };
  const onLeave = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
    delete e.currentTarget.dataset.hover;
  };
  return (
    <button type="button" className="skill-card" aria-expanded={false} onClick={onOpen} onPointerMove={onMove} onPointerLeave={onLeave}>
      <span className="skill-card__num">{String(index + 1).padStart(2, '0')}</span>
      <span className="skill-card__names">
        <span className="skill-card__ko">{p.ko}</span>
        <span className="skill-card__en">{p.en}</span>
      </span>
      {!mini && (
        <>
          <span className="skill-card__summary">{p.summary}</span>
          <span className="skill-card__foot">
            <Dots lit={related} total={total} />
            <span className="skill-card__count">기르는 수업 {related}</span>
          </span>
        </>
      )}
    </button>
  );
}

function SkillDetail({ p, index, related, total, onClose }: { p: Pillar; index: number; related: Course[]; total: number; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <article className="skill-detail" aria-labelledby={`skill-detail-${index}`}>
      <button ref={closeRef} type="button" className="skill-detail__close" onClick={onClose} aria-label="닫기 — 카드 다섯 장으로">×</button>
      <div className="skill-detail__lead">
        <span className="skill-card__num">{String(index + 1).padStart(2, '0')}</span>
        <Text as="h3" id={`skill-detail-${index}`} typography="Heading" color="inherit">{p.ko}</Text>
        <span className="skill-card__en">{p.en}</span>
        <span className="skill-detail__summary">{p.summary}</span>
      </div>
      <div className="skill-detail__body">
        <Text typography="Body" color="inherit" className="skill-detail__text">{p.body}</Text>
        <div className="skill-detail__courses">
          <span className="skill-detail__label">
            <Dots lit={related.length} total={total} />
            이 역량을 기르는 수업 {related.length}
          </span>
          <ul>
            {related.map((c) => (
              <li key={c.slug}>
                <button type="button" className="skill-course" onClick={() => openCourse(c.slug)}>
                  <span>{c.en}</span>
                  <span className="skill-course__type">{c.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
