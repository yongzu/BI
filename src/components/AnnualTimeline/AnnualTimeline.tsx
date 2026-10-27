import { useEffect, useRef, useState } from 'react';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * 연간 구조 — v11(toss.im/company History 형식)의 내용을 세로로(사용자 지시 2026-10-27).
 * 시기마다 회색 면 하나: 왼쪽 순서(01 / 04) · 그 시기의 질문 · 기간과 핵심 사실, 오른쪽 이름 · 표시(개강 · 수료 · 졸업) · 설명 ·
 * 내용(1학기 주간 시간표, 캠프 · 수료 & 졸업 카드). v11은 위 탭으로 한 시기씩 옆으로 넘겼지만 여기선 네 시기가 위에서 아래로 이어진다.
 * 면들 왼쪽 바깥엔 세로 진행 막대 — 화면 가운데까지 읽은 만큼 차오르고, 지난 시기의 점이 진해진다.
 * 그 전(2026-10-27 잠깐)엔 채용 연계와 같은 줄 형식, 10-24엔 왼쪽 붙는 시기 목록이었다.
 */
export type StageItem = { name: string; label: string; body: string };
/** 시간표 블록 — from · to는 시(정수). kind 'free' = 세션이 아닌 블록(월 · 금 개인 작업 등) */
export type WeekBlock = { from: number; to: number; label: string; kind?: 'free' };
/** 1학기 주간 시간표 — 시간축(hours) 위에 요일마다 블록, 점심시간은 블록 없는 요일들을 가로지른다 */
export type StageRhythm = {
  hours: { from: number; to: number };
  lunch: { from: number; to: number; label: string };
  days: { day: string; blocks: WeekBlock[] }[];
  link: { href: string; label: string };
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

export function AnnualTimeline({ stages }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0); // 진행 막대가 찬 높이(px)
  const [passed, setPassed] = useState(0); // 맨 위가 화면 가운데를 지난 시기 수

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      const r = list.getBoundingClientRect();
      setFill(Math.max(0, Math.min(r.height, mid - r.top)));
      setPassed([...list.querySelectorAll<HTMLElement>('.history__panel')].filter((el) => el.getBoundingClientRect().top <= mid).length);
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

  return (
    <div ref={listRef} className="history">
      <div className="history__progress" aria-hidden="true">
        <span className="history__progress-fill" style={{ height: fill }} />
      </div>
      {stages.map((s, i) => (
        <section key={s.name} id={`annual-${i + 1}`} className="history__panel" data-passed={i < passed} aria-labelledby={`annual-${i + 1}-title`}>
          <div className="history__side">
            <Text as="span" typography="Caption" color="tertiary" className="history__index">
              {String(i + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}
            </Text>
            <Text as="p" typography="Title" className="history__question">“{s.question}”</Text>
            <dl className="history__facts">
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
          <div className="history__main">
            <div className="history__title">
              <Text as="h3" typography="Heading" id={`annual-${i + 1}-title`}>{s.name}</Text>
              {s.marker && <span className="history__badge">{s.marker}</span>}
            </div>
            <Text typography="Body" color="secondary" className="history__body">{s.body}</Text>
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
            {s.rhythm && <WeekRhythm rhythm={s.rhythm} />}
          </div>
        </section>
      ))}
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
            {b.kind !== 'free' && <span className="annual__week-time">{hh(b.from)} – {hh(b.to)}</span>}
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
      <a className="annual__link" href={rhythm.link.href} target="_blank" rel="noreferrer">{rhythm.link.label}</a>
    </div>
  );
}
