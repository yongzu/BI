import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import type { Course, CourseType } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import { keepInPlace, scrollToTarget } from '../../smoothScroll';
import { COURSE_OPEN_EVENT } from './openCourse';
import './CourseExplorer.css';

/**
 * 커리큘럼 — 위 타입 머리글(한 줄 전체), 아래 왼쪽 세로 탭(타입 + 수업 수) · 오른쪽 v5 형식 수업 줄(2026-10-19).
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
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  // 탭을 바꾼 방향 — 아래 탭이면 내용이 위로 밀려 올라가고(+1), 위 탭이면 아래로 내려간다(−1)
  const [dir, setDir] = useState(1);
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

  // 수업 줄: 네 타입의 패널을 세로 트랙에 쌓아 두고, 탭을 바꾸면 트랙이 위아래로 미끄러져 고른 타입으로 간다
  // (연간 구조의 가로 트랙과 같은 방식, 사용자 지시 2026-10-19). 보이는 창의 높이는 고른 패널 높이에 맞춘다 —
  // 탭을 바꾸는 동안만 높이도 함께 움직이고(data-moving), 수업을 여닫을 땐 창이 줄을 바로 따라간다
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return;
    const place = () => {
      const panel = panelRefs.current[tab];
      if (!panel) return;
      stage.style.height = `${panel.offsetHeight}px`;
      track.style.transform = `translateY(${-panel.offsetTop}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    panelRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [tab]);
  const switchTab = (next: number) => {
    if (next === tab) return;
    const stage = stageRef.current;
    if (stage) {
      stage.dataset.moving = 'true';
      window.clearTimeout(Number(stage.dataset.timer));
      stage.dataset.timer = String(window.setTimeout(() => { delete stage.dataset.moving; }, 800));
    }
    setDir(next > tab ? 1 : -1);
    setTab(next);
  };

  // 다른 섹션(역량 카드)에서 수업을 열면: 그 타입 탭을 고르고 그 수업을 펼쳐 그 줄로 간다
  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      const t = types.findIndex((x) => x.courses.some((c) => c.slug === slug));
      if (t < 0) return;
      scrollTo.current = slug;
      switchTab(t);
      setOpen(slug);
    };
    window.addEventListener(COURSE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COURSE_OPEN_EVENT, onOpen);
  });
  // 트랙이 다 미끄러진 뒤 그 줄로 — 트랙의 transform은 offsetTop에 잡히지 않아 화면 위치(getBoundingClientRect)로 잰다.
  // 152 = 줄이 화면 위 112px(.course-row scroll-margin-top)에 서도록 실측으로 맞춘 값
  useEffect(() => {
    const slug = scrollTo.current;
    if (!slug) return;
    scrollTo.current = null;
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`course-row-${slug}`);
      if (row) scrollToTarget(Math.max(0, window.scrollY + row.getBoundingClientRect().top - 152));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [open, tab]);

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (tab + step + types.length) % types.length;
    switchTab(next);
    tabRefs.current[next]?.focus();
  };

  const toggle = (slug: string, row: HTMLElement | null) => {
    if (row) keepInPlace(row, 900); // 접힘(820ms)이 끝날 때까지
    setOpen((prev) => (prev === slug ? null : slug));
  };

  return (
    <div className="course-explorer">
      {/* 고른 타입의 머리글은 탭 · 수업 줄 위에 한 줄 전체로(사용자 시안 이미지 2026-10-19) */}
      <header key={type.id} className="course-group__head" data-dir={dir}>
        <div className="course-group__title">
          <h4 className="course-group__name">{type.name}</h4>
          <span className="course-group__meta">{type.cadence} · {type.courses.length}개 수업</span>
        </div>
        <Text typography="Body" color="secondary" className="course-group__body">{type.body}</Text>
      </header>
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
              onClick={() => switchTab(i)}
            >
              <span className="course-tab__name">{t.name}</span>
              <span className="course-tab__count">{t.courses.length}</span>
            </button>
          ))}
          <Text as="p" typography="Caption" color="tertiary" className="course-tabs__total">1학기 수업 {total}개</Text>
        </div>

        <div ref={stageRef} className="course-stage">
          <div ref={trackRef} className="course-track">
            {types.map((t, i) => (
              <section
                key={t.id}
                ref={(el) => { panelRefs.current[i] = el; }}
                id={`course-panel-${t.id}`}
                role="tabpanel"
                aria-labelledby={`course-tab-${t.id}`}
                className="course-tabpanel"
                data-active={tab === i}
                inert={tab !== i}
              >
                <ul className="course-rows">
                  {t.courses.map((course) => (
                    <CourseRow
                      key={course.slug}
                      course={course}
                      type={t}
                      profile={profiles[course.slug]}
                      open={open === course.slug}
                      onToggle={(row) => toggle(course.slug, row)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
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
