import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import type { Course, CourseType } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import { keepInPlace, scrollToTarget } from '../../smoothScroll';
import { COURSE_OPEN_EVENT } from './openCourse';
import './CourseExplorer.css';

/**
 * 커리큘럼 — 왼쪽 세로 탭(타입 + 수업 수) · 오른쪽 v5 형식(타입 머리글 + 펼쳐지는 수업 줄).
 *
 * 탭(v6부터): 타입 이름 + 수업 수 — 고르기 전에 규모가 보인다. ↑/↓로도 옮긴다.
 *   고른 칸을 가리키는 막대는 하나이고, 연간 구조 탭처럼 고른 칸 자리로 미끄러져 간다(사용자 지시 2026-10-19).
 * 오른쪽(사용자 지시 2026-10-19: v6 카드 · 옆 패널 → v5로 되돌림):
 * - 타입 머리글: 이름 · 진행 방식 · 수업 수, 아래 타입 설명.
 * - 수업 한 줄: 영문 이름 + 전문가 캡슐 / 한글 이름 / 기르는 역량 태그. 누르면 아래로 상세가 펼쳐진다.
 * - 펼치는 수업은 하나 — 다른 수업을 누르면 펼쳐 있던 수업이 접히고, 누른 줄은 화면의 같은 자리에 머문다(keepInPlace).
 */
type Props = { types: CourseType[]; profiles: Record<string, CourseProfile> };

export function CourseExplorer({ types, profiles }: Props) {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const scrollTo = useRef<string | null>(null); // 역량 카드에서 연 수업 — 렌더 뒤 그 줄로 스크롤
  const type = types[tab];
  const total = types.reduce((n, t) => n + t.courses.length, 0);

  // 고른 탭 자리로 막대를 옮긴다 — 넓은 화면은 왼쪽 세로 막대, 좁은 화면(탭이 가로 줄)은 아래 가로 막대
  useLayoutEffect(() => {
    const list = tabsRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;
    const place = () => {
      const el = tabRefs.current[tab];
      if (!el) return;
      const row = getComputedStyle(list).flexDirection === 'row';
      const inset = row ? 16 : 8;
      bar.style.setProperty('--x', `${row ? el.offsetLeft + inset : -1}px`);
      bar.style.setProperty('--y', `${row ? el.offsetTop + el.offsetHeight - 1 : el.offsetTop + inset}px`);
      bar.style.setProperty('--w', `${row ? el.offsetWidth - inset * 2 : 2}px`);
      bar.style.setProperty('--h', `${row ? 2 : el.offsetHeight - inset * 2}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [tab]);

  // 다른 섹션(역량 카드)에서 수업을 열면: 그 타입 탭을 고르고 그 수업을 펼쳐 그 줄로 간다
  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      const t = types.findIndex((x) => x.courses.some((c) => c.slug === slug));
      if (t < 0) return;
      scrollTo.current = slug;
      setTab(t);
      setOpen(slug);
    };
    window.addEventListener(COURSE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COURSE_OPEN_EVENT, onOpen);
  }, [types]);
  useEffect(() => {
    const slug = scrollTo.current;
    if (!slug) return;
    scrollTo.current = null;
    const row = document.getElementById(`course-row-${slug}`);
    if (row) scrollToTarget(row);
  }, [open, tab]);

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (tab + step + types.length) % types.length;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const toggle = (slug: string, row: HTMLElement | null) => {
    if (row) keepInPlace(row, 700); // 접힘(520ms + 늦춤)이 끝날 때까지
    setOpen((prev) => (prev === slug ? null : slug));
  };

  return (
    <div className="course-explorer">
      <div className="course-layout">
        <div ref={tabsRef} className="course-tabs" role="tablist" aria-orientation="vertical" aria-label="수업 유형" onKeyDown={onTabKey}>
          <span ref={barRef} className="course-tabs__indicator" aria-hidden="true" />
          {types.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`course-tab-${t.id}`}
              aria-selected={tab === i}
              aria-controls={`course-panel-${t.id}`}
              tabIndex={tab === i ? 0 : -1}
              className="course-tab"
              onClick={() => setTab(i)}
            >
              <span className="course-tab__name">{t.name}</span>
              <span className="course-tab__count">{t.courses.length}</span>
            </button>
          ))}
          <Text as="p" typography="Caption" color="tertiary" className="course-tabs__total">1학기 수업 {total}개</Text>
        </div>

        <section key={type.id} id={`course-panel-${type.id}`} role="tabpanel" aria-labelledby={`course-tab-${type.id}`} className="course-tabpanel">
          <header className="course-group__head">
            <div className="course-group__title">
              <h4 className="course-group__name">{type.name}</h4>
              <span className="course-group__meta">{type.cadence} · {type.courses.length}개 수업</span>
            </div>
            <Text typography="Body" color="secondary" className="course-group__body">{type.body}</Text>
          </header>

          <ul className="course-rows">
            {type.courses.map((course) => (
              <CourseRow
                key={course.slug}
                course={course}
                type={type}
                profile={profiles[course.slug]}
                open={open === course.slug}
                onToggle={(row) => toggle(course.slug, row)}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

type RowProps = { course: Course; type: CourseType; profile: CourseProfile; open: boolean; onToggle: (row: HTMLElement | null) => void };

function CourseRow({ course, type, profile, open, onToggle }: RowProps) {
  const panelId = `course-detail-${course.slug}`;
  return (
    <li id={`course-row-${course.slug}`} className="course-row" data-open={open}>
      <button type="button" className="course-row__hit" aria-expanded={open} aria-controls={panelId} onClick={(e) => onToggle(e.currentTarget.closest<HTMLElement>('.course-row'))}>
        <span className="course-row__text">
          <span className="course-row__title">
            <span className="course-row__name">{course.en}</span>
            {profile.experts.map((ex) => (
              <span key={ex.name} className="course-row__tag">{ex.name}</span>
            ))}
          </span>
          <span className="course-row__meta">{course.ko}</span>
        </span>
        <span className="course-row__tags">
          {course.tags.map((tag) => (
            <span key={tag} className="course-row__tag">{tag}</span>
          ))}
        </span>
        <span className="course-row__chevron" aria-hidden="true" />
      </button>

      <div id={panelId} className="course-row__panel" role="region" aria-label={course.en} aria-hidden={!open} inert={!open}>
        <div className="course-row__inner">
          <CourseDetail course={course} type={type} profile={profile} />
        </div>
      </div>
    </li>
  );
}

function CourseDetail({ course, type, profile }: { course: Course; type: CourseType; profile: CourseProfile }) {
  // 코스 프로필 개요의 첫 문단이 수업 목표와 같은 글인 수업이 많다 — 겹치는 문단은 개요에서 뺀다
  const overview = profile.overview.filter((p) => !p.startsWith(course.lead) && !p.includes(course.body.slice(0, 30)));

  return (
    <article className="course-detail">
      <div className="course-detail__main">
        <section className="course-detail__section">
          <h5 className="course-detail__heading">수업 목표</h5>
          <Text typography="Body" color="secondary">{course.lead} {course.body}</Text>
        </section>

        {overview.length > 0 && (
          <section className="course-detail__section">
            <h5 className="course-detail__heading">수업 개요</h5>
            {overview.map((p, i) => (
              <Text key={i} typography="Body" color="secondary">{p}</Text>
            ))}
          </section>
        )}

        <section className="course-detail__section">
          <h5 className="course-detail__heading">학습 목표</h5>
          <div className="course-goals" role="table" aria-label="학습 전후 비교">
            <div className="course-goals__row course-goals__row--head" role="row">
              <span role="columnheader">Before</span>
              <span role="columnheader">After</span>
            </div>
            {profile.after.map((after, i) => (
              <div key={i} className="course-goals__row" role="row">
                <span role="cell" className="course-goals__before">{profile.before[i]}</span>
                <span role="cell" className="course-goals__after">{after}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="course-detail__side">
        {profile.experts.map((ex) => (
          <section key={ex.name} className="course-detail__expert">
            <h5 className="course-detail__heading">{ex.name}</h5>
            <p className="course-detail__bio">{ex.bio}</p>
          </section>
        ))}
        <dl className="course-detail__facts">
          <div>
            <dt>코스 타입</dt>
            <dd>{type.name} · {type.cadence}</dd>
          </div>
          <div>
            <dt>역량</dt>
            <dd>{course.tags.join(' · ')}</dd>
          </div>
        </dl>
      </aside>
    </article>
  );
}
