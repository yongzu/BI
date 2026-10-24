import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Text } from '../Text/Text';
import { scrollToTarget } from '../../smoothScroll';
import './AnnualTimeline.css';

/**
 * 연간 구조 — 세로로 내려가며 네 시기를 모두 본다(사용자 지시 2026-10-24, 수업을 관통하는 접근과 같은 문법).
 *
 * - 왼쪽: 화면에 붙은 시기 목록(한 줄에 하나) — 순서 · 이름 · 짧은 기간. 누르면 그 시기로 이동한다.
 * - 오른쪽: 네 시기가 위에서 아래로 이어진다 — 이름과 기간 한 줄 · 설명 · 내용(캠프 · 졸업 카드, 주간 시간표).
 *   예전(v10)엔 탭을 고르면 가로 트랙이 옆 시기로 미끄러졌다 — 한 번에 한 시기만 보여 전체 구조가 안 보였다.
 * - 읽어 내려가면 지금 시기가 왼쪽 목록에서 잉크로 표시되고, 설명 옆 선의 막대 하나가 그 시기 자리로 미끄러져 간다.
 *   글은 하나도 흐리게 하지 않는다(WCAG 1.4.3).
 * - 좁은 화면에선 목록 없이 시기 줄만.
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
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);

  // 화면 가운데 띠(위 40% · 아래 40%를 뺀 곳)에 들어온 시기를 지금 시기로
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(refs.current.indexOf(seen.target as HTMLElement));
      },
      { rootMargin: '-40% 0px -40% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // 막대 자리 · 길이 = 지금 시기의 글 높이(위아래 여백 뺌) — 높이가 바뀌어도(글꼴 · 폭) 다시 잰다
  useLayoutEffect(() => {
    const bar = barRef.current;
    const list = bar?.parentElement;
    if (!bar || !list) return;
    const place = () => {
      const step = refs.current[active];
      if (!step) return;
      const cs = getComputedStyle(step);
      const pt = parseFloat(cs.paddingTop);
      const pb = parseFloat(cs.paddingBottom);
      bar.style.height = `${step.offsetHeight - pt - pb}px`;
      bar.style.transform = `translate(${step.offsetLeft - 1}px, ${step.offsetTop + pt}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [active]);

  return (
    <div className="annual-map">
      <nav className="annual-map__nav" aria-label="연간 구조 시기">
        <ol className="annual-map__stages">
          {stages.map((s, i) => (
            <li key={s.name}>
              <button
                type="button"
                className="annual-map__node"
                aria-current={active === i ? 'step' : undefined}
                onClick={() => { const el = refs.current[i]; if (el) scrollToTarget(el); }}
              >
                <span className="annual-map__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="annual-map__label">
                  <span className="annual-map__name">{s.name}</span>
                  <span className="annual-map__period">{s.tab}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="annual-map__list">
        <span ref={barRef} className="annual-map__bar" aria-hidden="true" />
        {stages.map((s, i) => (
          <section
            key={s.name}
            id={`annual-${i + 1}`}
            ref={(el) => { refs.current[i] = el; }}
            className="annual-step"
            data-active={active === i}
            aria-labelledby={`annual-${i + 1}-title`}
          >
            {/* 머리: 이름 옆에 기간 · 표시를 한 줄로(사용자 지시 2026-10-24) — 번호 캡슐 · 표시 알약 · 사실 표는 뺐다.
                번호는 왼쪽 목록이, 사실은 설명 · 내용이 이미 말하고 있었다 */}
            <div className="annual-step__head">
              <Text as="h3" typography="Title" id={`annual-${i + 1}-title`}>{s.name}</Text>
              <Text as="span" typography="Label" color="tertiary">{[s.period, s.marker].filter(Boolean).join(' · ')}</Text>
            </div>
            <Text typography="Body" color="secondary" className="annual-step__body">{s.body}</Text>
            {s.items && (
              <div className="annual-step__cards">
                {s.items.map((item) => (
                  <article key={item.name} className="annual-step__card">
                    <Text as="span" typography="Caption" color="tertiary">{item.label}</Text>
                    <Text as="h4" typography="Body" className="annual-step__card-name">{item.name}</Text>
                    <Text typography="Meta" color="secondary">{item.body}</Text>
                  </article>
                ))}
              </div>
            )}
            {s.rhythm && <WeekRhythm rhythm={s.rhythm} />}
          </section>
        ))}
      </div>
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
