import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { scrollToTarget } from '../../smoothScroll';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * 연간 구조 — 두 칸(사용자 지시 2026-10-27): 왼쪽은 글과 표, 오른쪽은 시간표나 상자.
 * - 왼쪽(위에 붙어 있다, sticky): 시기 탭(이름 + 개강 · 수료 · 졸업 표시). 고른 탭 아래에 그 시기의 질문 · 설명 · 기간과 핵심 사실 표가 펼쳐진다.
 *   막대 하나가 고른 탭(펼친 글까지)으로 미끄러진다.
 * - 오른쪽: 시기마다 시간표(1 · 2학기) 또는 상자(캠프 · 수료 & 졸업)가 위에서 아래로 이어진다.
 * - 스크롤하면 화면 위쪽(탭 높이 + 화면 30%)을 지난 마지막 시기가 고른 탭이 되어 다음 내용으로 넘어간다. 탭을 누르면 그 시기로 스크롤한다.
 * - 좁은 화면은 탭 없이 시기마다 이름 · 글 · 표 · 시간표(상자)를 위에서 아래로 — 같은 글을 오른쪽 칸에도 두고 좁은 화면에서만 보인다.
 * 같은 날 앞서는 왼쪽 탭(기간만) · 오른쪽에 글과 시간표를 함께 두었다.
 * 그 전(같은 날)엔 v11 시기 면을 세로로 쌓고 왼쪽에 진행 막대, 10-24엔 왼쪽 붙는 시기 목록이었다.
 */
export type StageItem = { name: string; label: string; body: string };
/** 시간표 블록 — from · to는 시(정수). kind 'free' = 세션이 아닌 블록(월 · 금 개인 작업 등) */
export type WeekBlock = { from: number; to: number; label: string; kind?: 'free' };
/** 1학기 주간 시간표 — 시간축(hours) 위에 요일마다 블록, 점심시간은 블록 없는 요일들을 가로지른다 */
export type StageRhythm = {
  hours: { from: number; to: number };
  lunch: { from: number; to: number; label: string };
  days: { day: string; blocks: WeekBlock[] }[];
  link?: { href: string; label: string };
};
export type Stage = {
  name: string;
  /** 왼쪽 목록에 쓰는 짧은 기간 — '2026.08 – 12' */
  tab: string;
  period: string;
  marker?: string;
  start: number;
  end: number;
  question: string;
  facts: string[][];
  body: string;
  items?: StageItem[];
  rhythm?: StageRhythm;
};

type Props = { stages: Stage[] };

/** 탭이 붙는 높이(px) — 커리큘럼 탭(CourseExplorer TABS_TOP)과 같다. 시기 맨 위도 여기에 맞춘다(CSS scroll-margin-top) */
const TABS_TOP = 56;

export function AnnualTimeline({ stages }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  // 스크롤을 따라 고른 탭 — 맨 위가 탭 높이 + 화면 30%를 지난 마지막 시기
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const line = TABS_TOP + window.innerHeight * 0.3;
      const panels = [...root.querySelectorAll<HTMLElement>('.annual-x__panel')];
      const i = panels.reduce((last, el, idx) => (el.getBoundingClientRect().top <= line ? idx : last), 0);
      setActive(i);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // 막대: 고른 탭의 자리 · 높이로(탭 아래 기간이 펼쳐지며 높이가 바뀌므로 크기가 바뀔 때마다 다시 잰다)
  useLayoutEffect(() => {
    const tabs = tabsRef.current;
    const bar = barRef.current;
    if (!tabs || !bar) return;
    const place = () => {
      const tab = tabs.querySelectorAll<HTMLElement>('.annual-x__tab')[active];
      if (!tab) return;
      bar.style.setProperty('--y', `${tab.offsetTop}px`);
      bar.style.setProperty('--h', `${tab.offsetHeight}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    tabs.querySelectorAll('.annual-x__tab').forEach((t) => ro.observe(t));
    return () => ro.disconnect();
  }, [active]);

  const go = (i: number) => {
    const panel = rootRef.current?.querySelectorAll<HTMLElement>('.annual-x__panel')[i];
    if (!panel) return;
    setActive(i);
    scrollToTarget(panel);
  };

  return (
    <div ref={rootRef} className="annual-x">
      {/* 왼쪽: 탭 + 고른 탭 아래 글과 표(넓은 화면) */}
      <div ref={tabsRef} className="annual-x__tabs">
        <span ref={barRef} className="annual-x__bar" aria-hidden="true" />
        {stages.map((s, i) => (
          <div key={s.name} className="annual-x__tab" data-active={i === active}>
            <button type="button" className="annual-x__tab-head" aria-current={i === active ? 'step' : undefined} onClick={() => go(i)}>
              <span className="annual-x__tab-name">{s.name}</span>
              {s.marker && <span className="annual-x__tab-marker">{s.marker}</span>}
            </button>
            <div className="annual-x__tab-brief">
              <div className="annual-x__tab-brief-inner">
                <StageText stage={s} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 오른쪽: 시기마다 시간표 또는 상자 — 좁은 화면에선 이름 · 글 · 표도 여기 */}
      <div className="annual-x__panels">
        {stages.map((s, i) => (
          <section
            key={s.name}
            id={`annual-${i + 1}`}
            className="annual-x__panel"
            data-active={i === active}
            aria-label={s.name}
            style={{ scrollMarginTop: TABS_TOP }}
          >
            <div className="annual-x__mobile">
              <div className="annual-x__name">
                <Text as="span" typography="Title">{s.name}</Text>
                {s.marker && <span className="annual-x__tab-marker">{s.marker}</span>}
              </div>
              <StageText stage={s} />
            </div>
            {s.rhythm && <WeekRhythm rhythm={s.rhythm} />}
            {s.items && (
              <div className="history__cards">
                {s.items.map((item) => (
                  <article key={item.name} className="history__card">
                    <Text as="span" typography="Caption" color="tertiary">{item.label}</Text>
                    <Text as="h4" typography="Body" className="history__card-name">{item.name}</Text>
                    <Text typography="Meta" color="secondary">{item.body}</Text>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/** 시기의 글과 표 — 질문 · 설명 · 기간과 핵심 사실 */
function StageText({ stage: s }: { stage: Stage }) {
  return (
    <div className="annual-x__text">
      <Text as="p" typography="Body" className="annual-x__question">“{s.question}”</Text>
      <Text typography="Meta" color="secondary" className="annual-x__body">{s.body}</Text>
      <dl className="annual-x__facts">
        <div>
          <dt>기간</dt>
          <dd>{s.period}</dd>
        </div>
        {s.facts.map(([k, val]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}


const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

/**
 * 주간 시간표(사용자 시안 이미지 2026-10-24): 왼쪽 시간축(10–18시, 시마다 점선) × 요일 다섯 칸.
 * 블록은 실제 시간 범위만큼 세로로 선다 — 화 · 수 · 목 오전 · 오후 세션, 월 · 금은 하루 전체 개인 작업.
 * 점심시간은 그 시간에 블록이 없는 요일들을 가로질러 글자 하나로. 예전엔 오전 · 점심 · 오후 세 줄 칸이라 가로로 길었다 —
 * 이제 한 시간 높이(--wk-hour)와 최대 폭(640px)으로 시안 비율에 맞춘다.
 * 그림은 화면 읽기 프로그램에서 숨기고, 같은 내용을 요일별 목록으로 따로 준다.
 */
function WeekRhythm({ rhythm }: { rhythm: StageRhythm }) {
  const { from, to } = rhythm.hours;
  const row = (h: number) => h - from + 2; // 1줄은 요일 머리
  const hours = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  // 점심시간 글자가 가로지를 요일들 — 그 시간에 블록이 없는 첫 요일부터 마지막 요일까지
  const free = rhythm.days.map((d) => !d.blocks.some((b) => b.from < rhythm.lunch.to && b.to > rhythm.lunch.from));
  const lunchFirst = free.indexOf(true);
  const lunchLast = free.lastIndexOf(true);

  return (
    <div className="annual__rhythm">
      <div className="annual__week" style={{ '--wk-hours': to - from } as React.CSSProperties} aria-hidden="true">
        {rhythm.days.map((d, i) => (
          <span key={d.day} className="annual__week-day" style={{ gridColumn: i + 2 }}>{d.day}</span>
        ))}
        {hours.map((h) => {
          const last = h === to;
          const at = { gridRow: last ? row(h) - 1 : row(h) };
          return [
            <span key={`l${h}`} className="annual__week-hour" data-end={last} style={at}>{h}</span>,
            <span key={`r${h}`} className="annual__week-rule" data-end={last} style={at} />,
          ];
        })}
        {rhythm.days.slice(1).map((d, i) => (
          <span key={`v${d.day}`} className="annual__week-lane" style={{ gridColumn: i + 3 }} />
        ))}
        {rhythm.days.map((d, i) => d.blocks.map((b) => (
          <span
            key={`${d.day}${b.from}`}
            className="annual__week-block"
            data-kind={b.kind ?? 'session'}
            style={{ gridColumn: i + 2, gridRow: `${row(b.from)} / ${row(b.to)}` }}
          >
            {/* 시간은 한 줄로 — 두 칸 배치(2026-10-27)로 칸이 좁아져 띄어 쓴 대시 앞에서 줄이 바뀌었다 */}
            {b.kind !== 'free' && <span className="annual__week-time">{hh(b.from)}–{hh(b.to)}</span>}
            <span className="annual__week-name">{b.label}</span>
          </span>
        )))}
        {lunchFirst >= 0 && (
          <span
            className="annual__week-lunch"
            style={{ gridColumn: `${lunchFirst + 2} / ${lunchLast + 3}`, gridRow: `${row(rhythm.lunch.from)} / ${row(rhythm.lunch.to)}` }}
          >
            {rhythm.lunch.label}
          </span>
        )}
      </div>
      <ul className="visually-hidden">
        {rhythm.days.map((d) => (
          <li key={d.day}>
            {d.day}요일: {d.blocks.map((b) => `${hh(b.from)}–${hh(b.to)} ${b.label.replace(/\n/g, ', ')}`).join(' / ')}
          </li>
        ))}
        <li>{rhythm.lunch.label} {hh(rhythm.lunch.from)}–{hh(rhythm.lunch.to)}</li>
      </ul>
      {rhythm.link && <a className="annual__link" href={rhythm.link.href} target="_blank" rel="noreferrer">{rhythm.link.label}</a>}
    </div>
  );
}
