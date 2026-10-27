import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import type { ApproachGroup, Course, CourseType, Device } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import { keepInPlace, scrollToTarget } from '../../smoothScroll';
import { COURSE_OPEN_EVENT } from './openCourse';
import './CourseExplorer.css';

/**
 * 커리큘럼 — 왼쪽 세로 탭(타입 + 수업 수) · 오른쪽 v5 형식 수업 줄(2026-10-19).
 *
 * 탭(v6부터): 타입 이름 + 수업 수 — 고르기 전에 규모가 보인다. ↑/↓로도 옮긴다. v15의 이름 아래 한글 한 줄(short)은 2026-10-24에 뺐다.
 *   고른 칸을 가리키는 막대는 하나이고, 연간 구조 탭처럼 고른 칸 자리로 미끄러져 간다(사용자 지시 2026-10-19).
 *   고른 탭만 이름 아래로 진행 방식(brief, 작은 글씨)과 압축 설명(summary)이 펼쳐진다(사용자 지시 2026-10-25) — 예전 위 타입 머리글
 *   (이름 · 진행 방식 · 수업 수 · 설명)은 뺐고, 그 자리엔 섹션 제목 '커리큘럼' · 리드가 선다(ProgramsPage).
 *   과목 분류 탭 아래엔 여백을 두고 '수업을 관통하는 접근' 분류 탭(Live Session · Reflection)이 같은 모양으로 이어진다(사용자 지시
 *   2026-10-27 — 따로 있던 섹션을 옮겼다). 탭 번호는 과목 분류 다음부터 이어 센다 — ↑/↓도 두 묶음을 이어서 오간다.
 *   이 분류를 고르면 오른쪽엔 그 분류의 수업 장치(번호 · 이름 · 결과 한 줄 · 설명)가 나온다. 예전 섹션의 왼쪽 지도는 가져오지 않았다.
 * 오른쪽(사용자 지시 2026-10-19: v6 카드 · 옆 패널 → v5로 되돌림):
 * - 수업 한 줄: 영문 이름 + 기르는 역량 태그(이름 오른쪽, 사용자 지시 2026-10-27) / 한글 이름 · 전문가. 누르면 아래로 상세가 펼쳐진다.
 * - 펼치는 수업은 하나 — 다른 수업을 누르면 펼쳐 있던 수업이 접히고, 누른 줄은 화면의 같은 자리에 머문다(keepInPlace).
 */
type Props = { types: CourseType[]; profiles: Record<string, CourseProfile>; approaches: ApproachGroup[]; devices: Device[] };

/** 넓은 화면에서 왼쪽 탭이 붙는 높이(px) — CSS .course-tabs top과 같다 */
const TABS_TOP = 56;
/** 펼친 줄의 위 여백이 늘어나는 만큼(px) — CSS .course-row[data-open] .course-row__hit padding-top 28 − 닫힌 16 */
const OPEN_PAD_EXTRA = 12;
/** 수업을 연 채 다른 수업을 누를 때 목록 맨 위로 가는 스크롤 시간(초) */
const SWITCH_SCROLL = 0.45;
/** 요소가 화면에 조금이라도 보이는지 */
const inView = (el: HTMLElement | null) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

export function CourseExplorer({ types, profiles, approaches, devices }: Props) {
  const [tab, setTab] = useState(0);
  // 탭 번호: 과목 분류 0 … n − 1, 이어서 수업을 관통하는 접근 n …
  const tabCount = types.length + approaches.length;
  const current = tab < types.length ? types[tab] : approaches[tab - types.length];
  const [open, setOpen] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const scrollTo = useRef<string | null>(null); // 역량 카드에서 연 수업 — 렌더 뒤 그 줄로 스크롤
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const layoutRef = useRef<HTMLDivElement>(null);

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

  // 좁은 화면(탭이 가로 줄): 고른 탭이 줄 밖이면 안으로 끌어오고, 오른쪽에 탭이 더 있으면 끝을 흐린다(data-more) —
  // 넘길 수 있다는 단서가 없어 Workshop · Event가 안 보였다(v15 휴리스틱 평가 2026-10-23)
  useEffect(() => {
    const list = tabsRef.current;
    const el = tabRefs.current[tab];
    if (!list || !el || getComputedStyle(list).flexDirection !== 'row') return;
    if (el.offsetLeft < list.scrollLeft || el.offsetLeft + el.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: el.offsetLeft - list.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
    }
  }, [tab]);
  useEffect(() => {
    const list = tabsRef.current;
    if (!list) return;
    const mark = () => { list.dataset.more = String(list.scrollLeft + list.clientWidth < list.scrollWidth - 1); };
    mark();
    list.addEventListener('scroll', mark, { passive: true });
    const ro = new ResizeObserver(mark);
    ro.observe(list);
    return () => { list.removeEventListener('scroll', mark); ro.disconnect(); };
  }, []);

  // 수업 줄: 타입들을 한 칸에 겹쳐 두고, 탭을 바꾸면 고른 타입이 바로 아래에서 투명하게 떠올라 진해진다(CSS,
  // 사용자 지시 2026-10-20 — 예전 세로 트랙이 화면 밖에서 미끄러져 들어오던 움직임은 너무 컸다). 보이는 창의 높이는 고른 타입에
  // 맞춘다 — 탭을 바꾸는 동안만 높이도 함께 움직이고(data-moving), 수업을 여닫을 땐 창이 줄을 바로 따라간다
  useLayoutEffect(() => {
    const place = () => {
      // 수업 패널의 높이는 가장 긴 수업을 펼친 높이로 고정한다(사용자 지시 2026-10-20 — 여닫을 때마다 아래 여백이 바뀌어
      // 화면이 움직였다). 닫힌 줄 높이의 합 + 가장 긴 상세 + 펼친 줄의 넓어진 위 여백. 폭이 바뀌면(글이 다시 감기면) 다시 잰다.
      // v15(2026-10-23): 수업이 하나라도 열려 있을 때만 고정한다 — 늘 고정하면 다 접었을 때 목록 아래 1,000px 넘게 비었다.
      // 열린 수업을 바꾸는 동안은 그대로 고정이라 화면이 움직이지 않는다.
      // 2026-10-24(사용자 지시): 마지막 수업을 접어도 목록이 화면에 보이는 동안은 높이를 그대로 둔다 — 맨 아래 수업을 여닫을 때
      // 아래 섹션이 올라갔다 내려갔다 했다. 목록이 화면 밖으로 나가면 그때 원래 높이로 돌아온다(아래 스크롤 감시)
      panelRefs.current.forEach((panel) => {
        if (!panel) return;
        if (!panel.querySelector('.course-row[data-open="true"]')) {
          if (!inView(layoutRef.current)) panel.style.minHeight = '';
          return;
        }
        const rows = [...panel.querySelectorAll<HTMLElement>('.course-row')];
        let closed = 0;
        let detail = 0;
        rows.forEach((row, i) => {
          const hit = row.querySelector<HTMLElement>('.course-row__hit')!;
          const cs = getComputedStyle(hit);
          // 닫힌 줄의 위 여백은 아래 여백과 같다 — 여닫히는 중(위 여백이 움직이는 중)에도 닫힌 높이를 얻는다
          closed += hit.offsetHeight - parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
          if (i > 0) closed += parseFloat(getComputedStyle(row).marginTop) || 0;
          detail = Math.max(detail, row.querySelector<HTMLElement>('.course-row__inner')?.scrollHeight ?? 0);
        });
        panel.style.minHeight = `${Math.ceil(closed + detail + OPEN_PAD_EXTRA)}px`;
      });
      const stage = stageRef.current;
      const item = panelRefs.current[tab];
      if (stage && item) stage.style.height = `${item.offsetHeight}px`; // 타입들이 한 칸에 겹쳐 있어 트랙은 옮기지 않는다(CSS)
    };
    place();
    document.fonts?.ready.then(place); // 글꼴이 늦게 들어와 줄 높이가 바뀌어도 — 패널은 최소 높이에 묶여 크기 변화로는 못 잡는다
    const ro = new ResizeObserver(place);
    panelRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [tab, open]);
  // 목록이 화면 밖으로 나가면 접힌 패널의 붙잡아 둔 높이를 놓는다 — 보이지 않을 때 줄어 아무것도 움직여 보이지 않는다
  // (목록이 화면 위로 지나갔으면 브라우저 스크롤 고정이 보던 자리를 지켜 준다). 패널 크기가 바뀌면 위 ResizeObserver가 창 높이를 다시 맞춘다
  useEffect(() => {
    const release = () => {
      if (inView(layoutRef.current)) return;
      panelRefs.current.forEach((panel) => {
        if (panel?.style.minHeight && !panel.querySelector('.course-row[data-open="true"]')) panel.style.minHeight = '';
      });
    };
    window.addEventListener('scroll', release, { passive: true });
    return () => window.removeEventListener('scroll', release);
  }, []);
  const switchTab = (next: number) => {
    if (next === tab) return;
    const stage = stageRef.current;
    if (stage) {
      stage.dataset.moving = 'true';
      window.clearTimeout(Number(stage.dataset.timer));
      stage.dataset.timer = String(window.setTimeout(() => { delete stage.dataset.moving; }, 600)); // 떠오름(120 + 480ms)이 끝날 때까지
    }
    setTab(next);
  };

  // 왼쪽 과목 분류를 누르면 그 타입의 첫 수업이 보이게 — 목록을 내려 읽던 중이면(목록 맨 위가 붙은 탭보다 위) 목록 맨 위를
  // 탭이 붙는 높이(TABS_TOP)로. 예전엔 위 타입 머리글로 올라갔다(2026-10-20) — 머리글을 뺀 뒤(2026-10-25)엔 목록이 이미 보이면 그대로 둔다
  const pickTab = (next: number) => {
    switchTab(next);
    const top = layoutRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top < TABS_TOP) scrollToTarget(Math.max(0, window.scrollY + top - TABS_TOP));
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
  // 고른 타입이 다 떠오른 뒤 그 줄로 — 떠오르는 transform은 offsetTop에 잡히지 않아 화면 위치(getBoundingClientRect)로 잰다.
  // 152 = 줄이 화면 위 112px(.course-row scroll-margin-top)에 서도록 실측으로 맞춘 값
  useEffect(() => {
    const slug = scrollTo.current;
    if (!slug) return;
    scrollTo.current = null;
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`course-row-${slug}`);
      if (row) scrollToTarget(Math.max(0, window.scrollY + row.getBoundingClientRect().top - 152));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [open, tab]);

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (tab + step + tabCount) % tabCount;
    switchTab(next);
    tabRefs.current[next]?.focus();
  };

  const toggle = (slug: string, row: HTMLElement | null) => {
    // 수업을 연 채 다른 수업을 누르면: 수업 목록 맨 위(첫 줄)를 탭이 붙는 높이(TABS_TOP)에 맞춘다 — 머리글은 화면 위로 빠지고,
    // 왼쪽 탭과 첫 수업이 같은 높이에 선다(사용자 지시 2026-10-20). 예전엔 누른 줄을 제자리에 붙잡아(keepInPlace) 위 수업이
    // 접히는 만큼 페이지가 끌려 올라가 머리글까지 보였다. 목록 위쪽은 여닫힘과 상관없어 접히는 동안에도 목표가 그대로다
    const layout = layoutRef.current;
    // 위 수업을 바로 닫고 누른 줄을 제자리에 두던 방식(A안)은 뚝 끊기고 머리글까지 보여 되돌렸다(사용자 지시 2026-10-20).
    // 그 대신 목록 맨 위로 가는 스크롤을 빠르게(SWITCH_SCROLL초, 끝이 부드러운 곡선) — 바로 건너뛰지도, 느리게 흐르지도 않게
    if (open && open !== slug && layout) {
      scrollToTarget(Math.max(0, window.scrollY + layout.getBoundingClientRect().top - TABS_TOP), { duration: SWITCH_SCROLL });
    } else if (row) keepInPlace(row, 900); // 접힘(820ms)이 끝날 때까지
    setOpen((prev) => (prev === slug ? null : slug));
  };

  return (
    <div className="course-explorer">
      <div ref={layoutRef} className="course-layout">
        <div ref={tabsRef} className="course-tabs" role="tablist" aria-orientation="vertical" aria-label="프로그램 구조" onKeyDown={onTabKey}>
          <span ref={barRef} className="course-tabs__indicator" aria-hidden="true" />
          {/* 탭 위 설명(사용자 지시 2026-10-24) — 화면 읽기 프로그램엔 tablist 이름으로 전한다 */}
          <span className="course-tabs__label" aria-hidden="true">프로그램 구조</span>
          {types.map((t, i) => [
            // 코스 밖 분류(Workshop · Event)는 Study 밑에 선을 긋고 구분한다(사용자 지시 2026-10-23)
            t.extra && !types[i - 1]?.extra && <span key={`${t.id}-divider`} className="course-tabs__divider" role="presentation" />,
            // 코스 밖 분류(Workshop · Event) 탭엔 수를 붙이지 않는다(사용자 지시 2026-10-23)
            <TabButton key={t.id} id={t.id} name={t.name} count={t.extra ? undefined : t.courses.length} brief={t.brief} summary={t.summary}
              selected={tab === i} onPick={() => pickTab(i)} buttonRef={(el) => { tabRefs.current[i] = el; }} />,
          ])}
          {/* 수업을 관통하는 접근(사용자 지시 2026-10-27) — 과목 분류 아래 여백을 두고 같은 모양의 둘째 묶음. 좁은 화면(가로 줄)에선 이름 대신 세로선 */}
          <span className="course-tabs__divider course-tabs__divider--group" role="presentation" />
          <span className="course-tabs__label course-tabs__label--group" aria-hidden="true">수업을 관통하는 접근</span>
          {approaches.map((g, j) => {
            const i = types.length + j;
            return (
              // 수 알약 · 작은 글씨는 붙이지 않는다(사용자 지시 2026-10-27) — 이름과 압축 설명만
              <TabButton key={g.id} id={g.id} name={g.name} summary={g.summary}
                selected={tab === i} onPick={() => pickTab(i)} buttonRef={(el) => { tabRefs.current[i] = el; }} />
            );
          })}
        </div>
        {/* 좁은 화면(탭이 가로 줄): 탭 안에 펼칠 자리가 없어 고른 분류의 글을 탭 줄 아래에 한 번 싣는다 */}
        <p className="course-tabs__brief" aria-hidden="true">
          {'brief' in current && <span className="course-tab__cadence">{current.brief}</span>}
          <span className="course-tab__summary">{current.summary}</span>
        </p>

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
                {t.note && <Text typography="Body" color="secondary" className="course-empty">{t.note}</Text>}
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
            {approaches.map((g, j) => {
              const i = types.length + j;
              return (
                <section
                  key={g.id}
                  ref={(el) => { panelRefs.current[i] = el; }}
                  id={`course-panel-${g.id}`}
                  role="tabpanel"
                  aria-labelledby={`course-tab-${g.id}`}
                  className="course-tabpanel"
                  data-active={tab === i}
                  inert={tab !== i}
                >
                  {/* 장치 번호는 두 분류를 이어 센다 — Live Session 01 · 02, Reflection 03 · 04 · 05(예전 섹션과 같다) */}
                  <ol className="device-rows">
                    {devices.map((d, n) => d.tag === g.tag && (
                      <li key={d.name} className="device-row">
                        <span className="device-row__num" aria-hidden="true">{String(n + 1).padStart(2, '0')}</span>
                        <h4 className="device-row__name">{d.name}</h4>
                        <p className="device-row__outcome">{d.outcome}</p>
                        <Text typography="Body" color="secondary" className="device-row__body">{d.body}</Text>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

type TabProps = {
  id: string;
  name: string;
  count?: number;
  brief?: string;
  summary: string;
  selected: boolean;
  onPick: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
};

/** 왼쪽 세로 탭 한 칸 — 이름 + 수 알약, 고른 칸만 아래로 진행 방식 · 압축 설명이 펼쳐진다(사용자 지시 2026-10-25) */
function TabButton({ id, name, count, brief, summary, selected, onPick, buttonRef }: TabProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      id={`course-tab-${id}`}
      aria-selected={selected}
      aria-controls={`course-panel-${id}`}
      aria-describedby={`course-brief-${id}`}
      tabIndex={selected ? 0 : -1}
      className="course-tab"
      onClick={onPick}
    >
      <span className="course-tab__name">{name}</span>
      {count !== undefined && <span className="course-tab__count">{count}</span>}
      {/* 이름은 이름 · 수만, 이 글은 설명으로 읽힌다 */}
      <span id={`course-brief-${id}`} className="course-tab__brief" aria-hidden="true">
        <span className="course-tab__brief-inner">
          {brief && <span className="course-tab__cadence">{brief}</span>}
          <span className="course-tab__summary">{summary}</span>
        </span>
      </span>
    </button>
  );
}

type RowProps = { course: Course; type: CourseType; profile: CourseProfile; open: boolean; onToggle: (row: HTMLElement | null) => void };

function CourseRow({ course, type, profile, open, onToggle }: RowProps) {
  const panelId = `course-detail-${course.slug}`;
  return (
    <li id={`course-row-${course.slug}`} className="course-row" data-open={open}>
      <button type="button" className="course-row__hit" aria-expanded={open} aria-controls={panelId} onClick={(e) => onToggle(e.currentTarget.closest<HTMLElement>('.course-row'))}>
        <span className="course-row__text">
          {/* 역량 태그는 이름 오른쪽에 조금 띄워 붙인다(사용자 지시 2026-10-27) — 예전엔 줄 맨 오른쪽 끝이라 이름과 떨어져 읽혔다 */}
          <span className="course-row__title">
            <span className="course-row__name">{course.en}</span>
            <span className="course-row__tags">
              {course.tags.map((tag) => (
                <span key={tag} className="course-row__tag">{tag}</span>
              ))}
            </span>
          </span>
          {/* 전문가는 캡슐 대신 한글 이름 옆 글자로 — 캡슐은 역량에만(v15: 같은 캡슐에 사람과 역량이 섞여 구분되지 않았다) */}
          <span className="course-row__meta">
            {course.ko}
            <span className="course-row__experts"> · {[type.people ?? '전문가', profile.experts.map((ex) => ex.name).join(', ')].filter(Boolean).join(' ')}</span>
          </span>
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

        {/* 학습 목표가 없는 수업(Workshop)은 이 칸을 뺀다(2026-10-23) */}
        {profile.after.length > 0 && <section className="course-detail__section">
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
        </section>}
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
