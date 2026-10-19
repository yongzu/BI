import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import type { Course, CourseType } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import { scrollToTarget } from '../../smoothScroll';
import { COURSE_OPEN_EVENT } from './openCourse';
import './CourseExplorer.css';

/**
 * 커리큘럼(화면 폭 전체, 2026-10-19) — 윗줄: 왼쪽 세로 탭(타입 + 수업 수) · 오른쪽 고른 타입의 머리글.
 * 아랫줄: 한 줄 전체에 v5 형식 수업 목록.
 *
 * 탭(v6부터): 타입 이름 + 수업 수 — 고르기 전에 규모가 보인다. ↑/↓로도 옮긴다.
 *   고른 칸을 가리키는 막대는 하나이고, 연간 구조 탭처럼 고른 칸 자리로 미끄러져 간다(사용자 지시 2026-10-19).
 * - 타입 머리글: 이름 · 진행 방식 · 수업 수, 아래 타입 설명.
 * - 아랫줄은 두 단(사용자 지시 2026-10-19 — 한 줄 전체로 펼치던 상세가 너무 넓어 읽기 어려웠다):
 *   왼쪽 수업 목록(탭과 같은 폭, 영문 · 한글 이름) | 오른쪽 상세 상자(고른 수업의 전문가 · 역량 · 목표 · 개요 · 학습 목표).
 *   상자엔 늘 한 수업 — 누른 수업, 아직 누르지 않았으면 지금 타입의 첫 수업.
 *
 * 넓은 화면(사용자 지시 2026-10-19): 커리큘럼이 한 화면 높이의 뷰포트로 붙고, 그 안에서 스크롤하면 수업 목록이
 * Fundamental → Domain → Ritual → Study 순으로 이어서 내려간다. 지금 보이는 타입이 탭 · 머리글에 잡히고,
 * 탭을 누르면 그 타입이 보이는 자리로 페이지가 스크롤한다. 좁은 화면 · 움직임 줄이기는 탭을 눌러 바꾸는 방식 그대로.
 */
type Props = { types: CourseType[]; profiles: Record<string, CourseProfile> };

/** 트랙 안에서 항목의 위 끝(px) — 항목과 트랙이 함께 움직이므로 트랙의 transform과 상관없다 */
const relTop = (el: HTMLElement, track: HTMLElement) => el.getBoundingClientRect().top - track.getBoundingClientRect().top;

/** 상자 끝에서 다음 · 이전 수업으로 넘어가기까지 더 굴려야 하는 휠 양(px)과, 넘어간 뒤 휠을 흘려보내는 시간 */
const WHEEL_PX = 120;
const COOL_MS = 700;

/** 탭 전환 시간 — CSS --duration-tab(foundation.css)과 같다 */
const MOVE_MS = 640;
/** 뷰포트 방식을 쓰는 화면(탭이 왼쪽 세로 줄인 폭) */
const SCROLL_MQ = '(min-width: 901px)';
const isScrollMode = () => window.matchMedia(SCROLL_MQ).matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CourseExplorer({ types, profiles }: Props) {
  const [tab, setTab] = useState(0);
  const [picked, setPicked] = useState<string | null>(null); // 누른 수업(상세 상자에 보인다)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const scrollTo = useRef<string | null>(null); // 역량 카드에서 연 수업 — 렌더 뒤 그 줄로 스크롤
  const rootRef = useRef<HTMLDivElement>(null);
  const headStageRef = useRef<HTMLDivElement>(null);
  const headTrackRef = useRef<HTMLDivElement>(null);
  const headRefs = useRef<(HTMLElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const tabNow = useRef(0); // 스크롤 계산(이펙트 안)에서 쓰는 지금 탭
  useEffect(() => { tabNow.current = tab; }, [tab]);
  const [scrollMode, setScrollMode] = useState(isScrollMode);
  useEffect(() => {
    const mq = window.matchMedia(SCROLL_MQ);
    const on = () => setScrollMode(isScrollMode());
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const total = types.reduce((n, t) => n + t.courses.length, 0);
  const boxRef = useRef<HTMLDivElement>(null);
  // 상자에 보이는 수업: 누른 수업이 지금 타입에 있으면 그 수업, 아니면 지금 타입의 첫 수업
  const shownCourse = types[tab].courses.find((c) => c.slug === picked) ?? types[tab].courses[0];
  // 수업이 바뀌면 상자를 맨 위부터(위로 넘겨 이전 수업으로 왔으면 맨 아래부터)
  const fromBelow = useRef(false);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.scrollTo({ top: fromBelow.current ? box.scrollHeight : 0 });
    fromBelow.current = false;
  }, [shownCourse.slug]);

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

  // 탭 옆 머리글(이름 · 진행 방식 · 설명)과 아래 수업 목록: 네 타입을 각각 세로 트랙에 쌓아 두고, 탭을 바꾸면 두 트랙이
  // 위아래로 미끄러져 고른 타입으로 간다(연간 구조의 가로 트랙과 같은 방식, 사용자 지시 2026-10-19).
  // 보이는 창의 높이는 고른 칸 높이에 맞춘다. 머리글 칸은 모두 가장 긴 것(Ritual · Study 세 줄) 높이라 창 높이가 바뀌지 않는다.
  // 탭을 바꾸는 동안만(data-moving) 막대와 같은 시간 · 곡선으로 움직이고, 수업을 여닫을 땐 창이 줄을 바로 따라간다
  // 뷰포트 방식(scrollMode)에선 수업 목록 · 머리글의 위치를 아래 스크롤 이펙트가 맡고, 여기선 머리글 창 높이만
  useLayoutEffect(() => {
    const pairs = [
      [headStageRef.current, headTrackRef.current, headRefs.current[tab]],
      ...(scrollMode ? [] : [[stageRef.current, trackRef.current, panelRefs.current[tab]]]),
    ] as const;
    const place = () => {
      for (const [stage, track, item] of pairs) {
        if (!stage || !track || !item) continue;
        stage.style.height = `${item.offsetHeight}px`;
        if (!scrollMode) track.style.transform = `translateY(${-relTop(item, track)}px)`;
      }
    };
    place();
    const ro = new ResizeObserver(place);
    [...headRefs.current, ...panelRefs.current].forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [tab, scrollMode]);
  // 탭 · 머리글(· 탭 방식의 수업 목록)을 막대와 같은 시간 · 곡선으로 옮긴다
  const moveTo = (next: number) => {
    const root = rootRef.current;
    if (root) {
      root.dataset.moving = 'true';
      window.clearTimeout(Number(root.dataset.timer));
      root.dataset.timer = String(window.setTimeout(() => { delete root.dataset.moving; }, MOVE_MS + 60));
    }
    setTab(next);
  };
  const switchTab = (next: number) => { if (next !== tab) moveTo(next); };

  // 뷰포트 방식: 커리큘럼 높이 = 한 화면 + (수업 목록 전체 + 끝 여유 − 보이는 창). 붙어 있는 동안 스크롤한 만큼 목록이 올라가고,
  // 창 위 35% 선을 넘은 마지막 타입이 지금 탭이 된다(끝까지 내리면 마지막 타입). 수업을 여닫아 목록 길이가 바뀌면 다시 잰다
  const metrics = useRef({ top: 0, extra: 0 });
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    const heads = headTrackRef.current;
    if (!scrollMode || !root || !stage || !track) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const win = stage.clientHeight;
      // 마지막 타입(Study)도 다른 타입처럼 창 맨 위까지 올라오게, 목록 끝에 (창 높이 − 마지막 타입 높이)만큼 빈자리를 둔다
      // (사용자 지시 2026-10-19 — 없으면 Ritual의 줄이 창 위에 남은 채 커리큘럼이 끝났다)
      const last = panelRefs.current[types.length - 1];
      const tail = `${Math.max(0, Math.round(win - (last?.offsetHeight ?? 0)))}px`;
      if (track.style.paddingBottom !== tail) track.style.paddingBottom = tail;
      const extra = Math.max(0, track.offsetHeight - win);
      const height = `${Math.round(window.innerHeight + extra)}px`;
      if (root.style.height !== height) root.style.height = height;
      const top = root.getBoundingClientRect().top;
      metrics.current = { top: top + window.scrollY, extra };
      const off = Math.min(extra, Math.max(0, -top));
      track.style.transform = `translateY(${-off}px)`;
      // 머리글도 목록처럼 스크롤에 묶여 이어서 넘어간다(사용자 지시 2026-10-19 — 탭을 넘는 순간 뚝 바뀌어 보였다).
      // 다음 타입의 첫 줄이 창 가운데(50%)에서 맨 위(0)로 올라오는 동안 머리글 트랙이 지금 머리글 → 다음 머리글로 미끄러진다.
      // 탭(막대 · 글씨)은 그 절반을 넘으면 바뀐다
      const pTops = panelRefs.current.map((p) => (p ? relTop(p, track) : 0));
      let i = 0;
      while (i < pTops.length - 1 && pTops[i + 1] <= off) i++;
      const zone = win * 0.5;
      const frac = i < pTops.length - 1 ? Math.min(1, Math.max(0, (off - (pTops[i + 1] - zone)) / zone)) : 0;
      const hA = headRefs.current[i];
      const hB = headRefs.current[Math.min(i + 1, types.length - 1)];
      if (heads && hA && hB) {
        const a = relTop(hA, heads);
        const b = relTop(hB, heads);
        heads.style.transform = `translateY(${-(a + (b - a) * frac)}px)`;
      }
      let at = frac >= 0.5 ? Math.min(i + 1, types.length - 1) : i;
      if (extra > 0 && off >= extra - 1) at = types.length - 1;
      if (at !== tabNow.current) { tabNow.current = at; moveTo(at); }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const ro = new ResizeObserver(schedule);
    ro.observe(track);
    ro.observe(stage);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.style.height = '';
      track.style.transform = '';
      track.style.paddingBottom = '';
      if (heads) heads.style.transform = '';
    };
    // moveTo · types는 렌더마다 새로 만들어지지만 하는 일이 같아 다시 걸지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollMode]);
  // 뷰포트 방식에서 목록 안 한 지점(트랙 위에서 y px)을 창 맨 위로 — 페이지를 그만큼 스크롤한다
  const scrollTrackTo = (y: number) => {
    const { top, extra } = metrics.current;
    scrollToTarget(top + Math.min(extra, Math.max(0, y)));
  };
  // 탭을 누르면: 뷰포트 방식은 그 타입이 창 맨 위에 오도록 스크롤(탭은 스크롤이 바꾼다), 탭 방식은 바로 바꾼다
  const selectTab = (i: number) => {
    const panel = panelRefs.current[i];
    if (scrollMode && panel) scrollTrackTo(relTop(panel, trackRef.current ?? panel));
    else switchTab(i);
  };

  // 수업을 고른다 — 다른 타입의 수업이면 그 타입으로도 옮긴다(뷰포트 방식은 그 줄이 창 맨 위에 오도록 스크롤)
  const pick = (slug: string, { reveal = false } = {}) => {
    const t = types.findIndex((x) => x.courses.some((c) => c.slug === slug));
    if (t < 0) return;
    setPicked(slug);
    if (t !== tab || reveal) {
      scrollTo.current = slug;
      if (!scrollMode) switchTab(t);
    }
    // 좁은 화면: 목록 아래 상자로 내려가 보여 준다
    if (!scrollMode && !reveal) requestAnimationFrame(() => boxRef.current && scrollToTarget(Math.max(0, window.scrollY + boxRef.current.getBoundingClientRect().top - 96)));
  };
  // 상자 안을 끝까지 내린 뒤 더 내리면 다음 수업으로, 맨 위에서 더 올리면 이전 수업으로(사용자 지시 2026-10-19).
  // 끝에 닿은 뒤 휠을 조금 더(WHEEL_PX) 굴려야 넘어가고, 넘어간 뒤 잠시(COOL_MS)는 관성 휠을 흘려보낸다.
  // 첫 수업 위 · 마지막 수업 아래에선 그대로 페이지가 움직인다. 뷰포트 방식에서만(상자가 창 높이에 묶여 안에서 스크롤할 때)
  const pickRef = useRef(pick);
  pickRef.current = pick;
  const shownRef = useRef(shownCourse.slug);
  shownRef.current = shownCourse.slug;
  useEffect(() => {
    const box = boxRef.current;
    if (!scrollMode || !box) return;
    const all = types.flatMap((t) => t.courses.map((c) => c.slug));
    let acc = 0;
    let coolUntil = 0;
    const onWheel = (e: WheelEvent) => {
      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      const next = all.indexOf(shownRef.current) + dir;
      const atEdge = dir > 0 ? box.scrollTop + box.clientHeight >= box.scrollHeight - 2 : box.scrollTop <= 1;
      if (!dir || !atEdge || next < 0 || next >= all.length) { acc = 0; return; }
      e.preventDefault();
      if (performance.now() < coolUntil) return;
      acc += Math.abs(e.deltaY);
      if (acc < WHEEL_PX) return;
      acc = 0;
      coolUntil = performance.now() + COOL_MS;
      fromBelow.current = dir < 0;
      pickRef.current(all[next]);
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    return () => box.removeEventListener('wheel', onWheel);
  }, [scrollMode, types]);

  // 다른 섹션(역량 카드)에서 수업을 열면: 그 수업을 고르고 그 줄로 간다
  useEffect(() => {
    const onOpen = (e: Event) => pick((e as CustomEvent<string>).detail, { reveal: true });
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
      const track = trackRef.current;
      if (!row) return;
      // 뷰포트 방식: 그 줄이 창 맨 위에 오도록(트랙 안 위치 = 줄 화면 위치 − 트랙 화면 위치)
      if (scrollMode && track) scrollTrackTo(row.getBoundingClientRect().top - track.getBoundingClientRect().top);
      else scrollToTarget(Math.max(0, window.scrollY + row.getBoundingClientRect().top - 152));
    }, scrollMode ? 0 : MOVE_MS + 60);
    return () => window.clearTimeout(timer);
  }, [picked, tab, scrollMode]);

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (tab + step + types.length) % types.length;
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div ref={rootRef} className="course-explorer" data-scroll={scrollMode || undefined}>
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
              onClick={() => selectTab(i)}
            >
              <span className="course-tab__name">{t.name}</span>
              <span className="course-tab__count">{t.courses.length}</span>
            </button>
          ))}
          <Text as="p" typography="Caption" color="tertiary" className="course-tabs__total">1학기 수업 {total}개</Text>
        </div>

        {/* 고른 타입의 머리글은 탭 오른쪽 같은 줄에(사용자 지시 2026-10-19) — 수업 줄처럼 위아래로 미끄러진다 */}
        <div ref={headStageRef} className="course-heads">
          <div ref={headTrackRef} className="course-heads__track">
            {types.map((t, i) => (
              <header key={t.id} ref={(el) => { headRefs.current[i] = el; }} className="course-group__head" data-active={tab === i} aria-hidden={tab !== i}>
                <div className="course-group__title">
                  <h4 className="course-group__name">{t.name}</h4>
                  <span className="course-group__meta">{t.cadence} · {t.courses.length}개 수업</span>
                </div>
                <Text typography="Body" color="secondary" className="course-group__body">{t.body}</Text>
              </header>
            ))}
          </div>
        </div>

        {/* 아랫줄 왼쪽: 수업 목록(탭과 같은 폭) */}
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
                inert={!scrollMode && tab !== i}
              >
                <ul className="course-rows">
                  {t.courses.map((course) => (
                    <li key={course.slug} id={`course-row-${course.slug}`} className="course-row">
                      <button
                        type="button"
                        className="course-row__hit"
                        aria-current={shownCourse.slug === course.slug ? 'true' : undefined}
                        aria-controls="course-box"
                        onClick={() => pick(course.slug)}
                      >
                        <span className="course-row__name">{course.en}</span>
                        <span className="course-row__meta">{course.ko}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        {/* 아랫줄 오른쪽: 고른 수업의 상세 상자 */}
        <div ref={boxRef} id="course-box" className="course-box" role="region" aria-label={`${shownCourse.en} 수업 정보`} data-lenis-prevent>
          <CourseBox key={shownCourse.slug} course={shownCourse} type={types[tab]} profile={profiles[shownCourse.slug]} />
        </div>
      </div>
    </div>
  );
}

/** 상세 상자: 영문 · 한글 이름, 그 아래 두 단(목표 · 개요 · 학습 목표 / 전문가 소개 · 코스 정보) */
function CourseBox({ course, type, profile }: { course: Course; type: CourseType; profile: CourseProfile }) {
  return (
    <article className="course-box__inner">
      <header className="course-box__head">
        <div className="course-box__names">
          <h5 className="course-box__name">{course.en}</h5>
          <span className="course-box__ko">{course.ko}</span>
        </div>
        {/* 오른쪽 위 캡슐은 뺐다 — 전문가는 전문가 소개의 이름 자리, 역량은 코스 정보의 역량 칸으로(사용자 지시 2026-10-20) */}
      </header>
      <CourseDetail course={course} type={type} profile={profile} />
    </article>
  );
}

function CourseDetail({ course, type, profile }: { course: Course; type: CourseType; profile: CourseProfile }) {
  // 코스 프로필 개요의 첫 문단이 수업 목표와 같은 글인 수업이 많다 — 겹치는 문단은 개요에서 뺀다
  const overview = profile.overview.filter((p) => !p.startsWith(course.lead) && !p.includes(course.body.slice(0, 30)));

  return (
    // 두 단(사용자 지시 2026-10-20): ① 넓게 — 수업 목표 · 개요 · 학습 목표 ② 좁게 — 전문가 소개 · 코스 타입 · 역량. 좁으면 한 단으로
    <article className="course-detail">
      <div className="course-detail__col course-detail__main">
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

        <section className="course-detail__section course-detail__goals">
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

      <aside className="course-detail__col course-detail__side">
        {profile.experts.map((ex) => (
          <section key={ex.name} className="course-detail__expert">
            <h5 className="course-row__tag course-detail__name">{ex.name}</h5>
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
            <dd className="course-detail__skills">
              {course.tags.map((tag) => <span key={tag} className="course-row__tag course-row__tag--skill">{tag}</span>)}
            </dd>
          </div>
        </dl>
      </aside>
    </article>
  );
}
