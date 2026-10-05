import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Text } from '../Text/Text';
import { scrollToTarget } from '../../smoothScroll';
import './AnnualTimeline.css';

/**
 * Annual structure as a zoomable timeline.
 * - Overview: all stages sit side by side on one row, placed on a month axis
 *   (상단 필터 칩을 없애고 4줄 → 1줄, 사용자 지시 2026-09-29).
 * - Filter on top (전체 + each stage): the same controls as the bars.
 * - Click a stage (bar or filter): the axis zooms a little toward that stage's months and the bar
 *   grows into a detail card. Click it again, click another stage, choose "전체", or click anywhere
 *   outside the timeline to return to the overview. 호버만으로 미리 펼치던 동작은 없앴다 — 막대 위를
 *   훑기만 해도 축 전체가 확대되며 시각을 자극했다(사용자 지시 2026-10-05). 호버는 막대 테두리만.
 * - 움직임을 줄였다(2026-10-05): 확대는 최대 1.2배, 짧은 단계는 축 대신 카드만 읽을 수 있는 폭까지 넓어진다.
 * - Pinning a stage scrolls the page so the filter sits just under the top bar (88px) and the
 *   open card shows below it (사용자 지시 2026-10-04). Returning to the overview doesn't scroll.
 * - Stages with `items` (방학 + 캠프 · 수료 & 졸업) stack those as boxes inside the open card
 *   — the two stages replace their old sections (사용자 지시 2026-09-30).
 * Everything is positioned in % of the current view window, so a single state
 * change animates bars, month labels and grid lines together via CSS transitions.
 */
export type StageItem = { name: string; label: string; body: string };
/** 한 주의 수업 리듬 — 요일마다 오전 · 오후 수업 이름(null = 없음)과 각 시간대 */
export type StageRhythm = {
  name: string;
  label: string;
  body: string;
  times: { am: string; lunch: string; pm: string };
  days: { day: string; am: string | null; pm: string | null }[];
  link: { href: string; label: string };
};
export type Stage = { name: string; period: string; marker?: string; start: number; end: number; body: string; items?: StageItem[]; rhythm?: StageRhythm };

type Props = { stages: Stage[]; months: number[] };

/*
 * Zoom (줌을 줄임, 사용자 지시 2026-09-30 · 2026-10-05): the view stays at least ZOOM_FLOOR of the year
 * (max 1.2×) and leaves the stage breathing room. The axis no longer zooms further to make a short stage's
 * card readable — instead the open card alone widens to CARD_MIN px (sliding left if it would overflow),
 * overlapping its muted neighbours. On a phone the card takes 90% of the chart.
 */
const ZOOM_FLOOR = 1 / 1.2; // the view never shows less than 83% of the year (max 1.2×)
const ZOOM_ROOM = 1.4; // view ≥ (stage + 1 month on each side) × 1.4
const CARD_MIN = 320; // px — the open card is never narrower than this (if the chart is wide enough)
// Stages with boxes (방학 + 캠프 · 수료 & 졸업) open wider so the boxes read comfortably
// (사용자 지시 2026-09-30); on a narrow chart the card takes 90% of it
const CARD_MIN_WITH_ITEMS = 600;
const PIN_TOP = 88; // px — where the filter lands after pinning a stage (below the pinned top bar)

export function AnnualTimeline({ stages, months }: Props) {
  const [pinned, setPinned] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  const selected = pinned;
  const total = months.length; // axis spans [0, total]

  // Track the chart's width so the zoom can keep the open card readable: measured on every
  // click (always fresh) and kept current while a stage is open and the window resizes
  const measure = () => { if (root.current) setChartWidth(root.current.clientWidth); };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const barEnd = (i: number) => stages[i + 1]?.start ?? stages[i].end;
  const view = (() => {
    if (selected === null) return { from: 0, to: total };
    const start = stages[selected].start;
    const length = barEnd(selected) - start;
    const size = Math.min(total, Math.max(total * ZOOM_FLOOR, (length + 2) * ZOOM_ROOM));
    // Centre the stage, but stay inside the year so no empty axis shows at either end
    const from = Math.min(Math.max(start + length / 2 - size / 2, 0), total - size);
    return { from, to: from + size };
  })();
  const span = view.to - view.from;
  const pct = (x: number) => `${((x - view.from) / span) * 100}%`;
  const len = (d: number) => `${(d / span) * 100}%`;
  const inFocus = (m: number) => selected !== null && m >= Math.floor(stages[selected].start) && m < Math.ceil(stages[selected].end);

  const pin = (i: number | null) => {
    const next = i === null || pinned === i ? null : i;
    measure();
    setPinned(next);
    if (next !== null && root.current) {
      const y = window.scrollY + root.current.getBoundingClientRect().top - PIN_TOP;
      scrollToTarget(Math.max(0, y));
    }
  };

  // Clicking anywhere outside the timeline returns a pinned view to the overview
  useEffect(() => {
    if (pinned === null) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setPinned(null);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [pinned]);

  return (
    <div ref={root} className="annual" data-zoomed={selected !== null}>
      {/* 상단 필터(다시 추가, 사용자 지시 2026-09-30): 누르면 펼치고, '전체'는 개요로 */}
      <div className="segmented annual__filter" role="group" aria-label="연간 구조 보기">
        <button type="button" className="segmented__tab" aria-pressed={selected === null} onClick={() => pin(null)}>
          전체
        </button>
        {stages.map((s, i) => (
          <button
            key={s.name}
            type="button"
            className="segmented__tab"
            aria-pressed={selected === i}
            onClick={() => pin(i)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="annual__chart">
        {/* Month axis + grid lines share the same scale as the bars */}
        <div className="annual__axis" aria-hidden="true">
          {months.map((m, i) => (
            // 맨 왼쪽 눈금(차트 왼쪽 끝)의 월 글자는 가운데 정렬이면 반이 잘린다 — 오른쪽으로 붙인다(사용자 제보 2026-10-05)
            <span key={i} className="annual__tick" data-focus={inFocus(i)} data-edge={i - view.from <= 0.001 && i - view.from >= -0.001} style={{ left: pct(i) }}>
              <span className="annual__month">{m}</span>
            </span>
          ))}
        </div>

        <ol className="annual__rows">
          {stages.map((s, i) => {
            const isSelected = selected === i;
            // 캡슐 모양은 그대로, 캡슐 사이 간격만 없앤다(사용자 지시 2026-09-29): 각 막대가 다음 단계 시작점까지 이어진다
            let style: CSSProperties = { marginLeft: pct(s.start), width: len(barEnd(i) - s.start) };
            // 펼친 카드는 축을 더 확대하는 대신 저만 읽을 수 있는 폭까지 넓어지고, 넘치면 왼쪽으로 비켜 선다
            if (isSelected && chartWidth > 0) {
              const cardMin = Math.min(s.items ? CARD_MIN_WITH_ITEMS : CARD_MIN, chartWidth * 0.9);
              const left = ((s.start - view.from) / span) * chartWidth;
              const width = Math.max(((barEnd(i) - s.start) / span) * chartWidth, cardMin);
              const x = Math.max(0, Math.min(left, chartWidth - width));
              style = { marginLeft: `${(x / chartWidth) * 100}%`, width: `${(width / chartWidth) * 100}%` };
            }
            return (
              <li key={s.name} className="annual__row">
                {/* 막대 전체가 누르는 영역이고, 키보드 · 보조기기용 버튼은 이름 줄이다 — 펼친 카드 안에
                    링크(1학기 일정)를 둘 수 있도록 막대를 버튼에서 영역으로 바꿨다(2026-09-30) */}
                <div
                  className="annual__bar"
                  data-state={isSelected ? 'selected' : selected === null ? 'idle' : 'muted'}
                  data-pinned={pinned === i}
                  style={style}
                  onClick={() => pin(i)}
                >
                  <button type="button" className="annual__bar-head" aria-expanded={isSelected} aria-pressed={pinned === i} aria-controls={`annual-detail-${i}`}>
                    <span className="annual__bar-name">{s.name}</span>
                  </button>
                  <div id={`annual-detail-${i}`} className="annual__detail" inert={!isSelected}>
                    <div className="annual__detail-inner">
                      <span className="annual__meta">
                        <Text as="span" typography="Label" color="inherit">{s.period}</Text>
                        {s.marker && <span className="annual__badge">{s.marker}</span>}
                      </span>
                      <Text as="span" typography="Body" color="inherit" className="annual__body">{s.body}</Text>
                      {/* 캠프 · 수료와 졸업: 박스를 세로로 쌓는다 */}
                      {s.items && (
                        <span className="annual__items">
                          {s.items.map((item) => (
                            <span key={item.name} className="annual__item">
                              <span className="annual__item-name">{item.name}</span>
                              <span className="annual__item-label">{item.label}</span>
                              <span className="annual__item-body">{item.body}</span>
                            </span>
                          ))}
                        </span>
                      )}
                      {/* 주간 리듬: 예전 '주간 시간표' 섹션을 이 단계 안으로(사용자 지시 2026-09-30) */}
                      {s.rhythm && <WeekRhythm rhythm={s.rhythm} />}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/**
 * 주간 리듬 박스: 요일 다섯 칸 × 오전 · 점심 · 오후. 세션 칸은 세로로 크게, 칸마다 시간과 세션 이름을
 * 적고 점심시간은 한 줄로 가로지른다(예전 주간 시간표처럼, 사용자 지시 2026-09-30). 카드 폭은 그대로.
 * 칸이 좁아지면(휴대폰) 시간은 칸에서 빠져 각 줄 위의 머리글로 올라간다.
 */
function WeekRhythm({ rhythm }: { rhythm: StageRhythm }) {
  const sessionRow = (slot: 'am' | 'pm') => (
    <>
      <span className="annual__week-caption" aria-hidden="true">{slot === 'am' ? '오전' : '오후'} · {rhythm.times[slot]}</span>
      <span className="annual__week-row" role="row">
        {rhythm.days.map((d) => {
          const session = d[slot];
          return (
            <span key={d.day} className="annual__week-cell" role="cell" data-on={session !== null}>
              {session === null ? (
                <span className="visually-hidden">수업 없음</span>
              ) : (
                <>
                  <span className="annual__week-time">{rhythm.times[slot]}</span>
                  <span className="annual__week-name">{session}</span>
                </>
              )}
            </span>
          );
        })}
      </span>
    </>
  );

  return (
    <span className="annual__item annual__rhythm">
      <span className="annual__item-name">{rhythm.name}</span>
      <span className="annual__item-label">{rhythm.label}</span>
      <span className="annual__week" role="table" aria-label="요일별 수업 시간">
        <span className="annual__week-row" role="row">
          {rhythm.days.map((d) => <span key={d.day} className="annual__week-day" role="columnheader">{d.day}</span>)}
        </span>
        {sessionRow('am')}
        <span className="annual__week-row" role="row">
          <span className="annual__week-lunch" role="cell" aria-colspan={rhythm.days.length}>
            점심시간 <span className="annual__week-lunch-time">{rhythm.times.lunch}</span>
          </span>
        </span>
        {sessionRow('pm')}
      </span>
      <span className="annual__item-body">{rhythm.body}</span>
      {/* 막대를 누르면 카드가 닫히므로, 링크를 누를 때는 그 클릭이 막대로 올라가지 않게 한다 */}
      <a className="annual__link" href={rhythm.link.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
        {rhythm.link.label}
      </a>
    </span>
  );
}
