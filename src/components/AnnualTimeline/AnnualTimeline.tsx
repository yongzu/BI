import { Text } from '../Text/Text';
import { PillarList } from '../PillarList/PillarList';
import './AnnualTimeline.css';

/**
 * 연간 구조 — 채용 연계와 같은 줄 형식(사용자 지시 2026-10-27): 가는 선, 번호 | 이름(시기 / 짧은 기간) | 설명 줄(PillarList flat),
 * 줄 왼쪽에 세로 진행 막대(progress) — 읽어 내려가는 만큼 차오르고 지금 시기가 진해진다.
 * 설명 아래엔 그 시기의 내용(캠프 · 졸업 카드, 1학기 주간 시간표)을 그대로 둔다.
 * 예전(2026-10-24)엔 왼쪽에 붙는 시기 목록 + 오른쪽 시기 카드였고, 그 전(v10)엔 가로로 넘기는 탭이었다.
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
  const items = stages.map((s) => ({
    en: s.name,
    ko: s.tab,
    body: s.body,
    extra: (s.items || s.rhythm) && (
      <>
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
      </>
    ),
  }));
  return <PillarList groups={[{ label: '연간 구조', items }]} flat progress />;
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
