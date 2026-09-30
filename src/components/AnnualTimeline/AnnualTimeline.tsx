import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * Annual structure as a zoomable timeline.
 * - Overview: all stages sit side by side on one row, placed on a month axis
 *   (상단 필터 칩을 없애고 4줄 → 1줄, 사용자 지시 2026-09-29).
 * - Filter on top (전체 + each stage): the same controls as the bars.
 * - Hover a stage (bar or filter): preview — the axis zooms to that stage's months and the
 *   bar grows into a detail card. Leaving the timeline ends the preview.
 * - Click: pins the stage so it stays open — while pinned, hovering other stages changes
 *   nothing (사용자 지시 2026-09-22). Click it again, click another stage, choose "전체",
 *   or click anywhere outside the timeline to return to the overview.
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
 * Zoom (줌을 줄임, 사용자 지시 2026-09-30): the view used to shrink to the stage ± 1.15 months,
 * blowing a 2-month stage up about 3×. Now the view stays at least ZOOM_FLOOR of the year and
 * leaves the stage breathing room, but never lets the open card get narrower than CARD_MIN px —
 * so short stages still zoom a little on desktop and fill the width on a phone.
 */
const ZOOM_FLOOR = 0.6; // the view never shows less than 60% of the year (max ≈ 1.7×)
const ZOOM_ROOM = 1.4; // view ≥ (stage + 1 month on each side) × 1.4
const CARD_MIN = 320; // px — the open card is never narrower than this (if the chart is wide enough)
// Stages with boxes (방학 + 캠프 · 수료 & 졸업) open wider so the boxes read comfortably — they may
// zoom in further for it (사용자 지시 2026-09-30); on a narrow chart the card takes 90% of it
const CARD_MIN_WITH_ITEMS = 600;
const SETTLE_MS = 400; // ignore hover while bars are still sliding, so a bar moving under the pointer can't steal focus

export function AnnualTimeline({ stages, months }: Props) {
  const [pinned, setPinned] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const settleUntil = useRef(0);
  const suppressHover = useRef(false);

  const selected = preview ?? pinned;
  const total = months.length; // axis spans [0, total]

  // Track the chart's width so the zoom can keep the open card readable: measured on every
  // hover/click (always fresh) and kept current while a stage is open and the window resizes
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
    let size = Math.max(total * ZOOM_FLOOR, (length + 2) * ZOOM_ROOM);
    const cardMin = stages[selected].items ? Math.min(CARD_MIN_WITH_ITEMS, chartWidth * 0.9) : CARD_MIN;
    if (chartWidth > 0) size = Math.min(size, (length * chartWidth) / cardMin); // keep the card ≥ cardMin
    size = Math.min(total, Math.max(size, length + 0.3));
    // Centre the stage, but stay inside the year so no empty axis shows at either end
    const from = Math.min(Math.max(start + length / 2 - size / 2, 0), total - size);
    return { from, to: from + size };
  })();
  const span = view.to - view.from;
  const pct = (x: number) => `${((x - view.from) / span) * 100}%`;
  const len = (d: number) => `${(d / span) * 100}%`;
  const inFocus = (m: number) => selected !== null && m >= Math.floor(stages[selected].start) && m < Math.ceil(stages[selected].end);

  // Event timestamps (not performance.now) keep these handlers pure for the linter
  const markMoving = (at: number) => { settleUntil.current = at + SETTLE_MS; };

  const hover = (i: number, e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || suppressHover.current || pinned !== null) return;
    if (e.timeStamp < settleUntil.current) return;
    if (i !== selected) markMoving(e.timeStamp);
    measure();
    setPreview(i);
  };

  const leave = (e: PointerEvent) => {
    suppressHover.current = false;
    if (preview !== null && preview !== pinned) markMoving(e.timeStamp);
    setPreview(null);
  };

  const pin = (i: number | null, at: number) => {
    const next = i === null || pinned === i ? null : i;
    // Unpinning while the pointer is still over the bar: don't let hover reopen it
    if (next === null) suppressHover.current = true;
    measure();
    setPreview(null);
    setPinned(next);
    markMoving(at);
  };

  // Clicking anywhere outside the timeline returns a pinned view to the overview
  useEffect(() => {
    if (pinned === null) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setPinned(null);
        setPreview(null);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [pinned]);

  return (
    <div ref={root} className="annual" data-zoomed={selected !== null} onPointerLeave={leave}>
      {/* 상단 필터(다시 추가, 사용자 지시 2026-09-30): 올리면 미리 보고, 누르면 고정, '전체'는 개요로 */}
      <div className="segmented annual__filter" role="group" aria-label="연간 구조 보기">
        <button type="button" className="segmented__tab" aria-pressed={selected === null} onClick={(e) => pin(null, e.timeStamp)}>
          전체
        </button>
        {stages.map((s, i) => (
          <button
            key={s.name}
            type="button"
            className="segmented__tab"
            aria-pressed={selected === i}
            onPointerEnter={(e) => hover(i, e)}
            onClick={(e) => pin(i, e.timeStamp)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="annual__chart">
        {/* Month axis + grid lines share the same scale as the bars */}
        <div className="annual__axis" aria-hidden="true">
          {months.map((m, i) => (
            <span key={i} className="annual__tick" data-focus={inFocus(i)} style={{ left: pct(i) }}>
              <span className="annual__month">{m}</span>
            </span>
          ))}
        </div>

        <ol className="annual__rows">
          {stages.map((s, i) => {
            const isSelected = selected === i;
            // 캡슐 모양은 그대로, 캡슐 사이 간격만 없앤다(사용자 지시 2026-09-29): 각 막대가 다음 단계 시작점까지 이어진다
            const style: CSSProperties = { marginLeft: pct(s.start), width: len(barEnd(i) - s.start) };
            return (
              <li key={s.name} className="annual__row">
                {/* 막대 전체가 누르는 영역이고, 키보드 · 보조기기용 버튼은 이름 줄이다 — 펼친 카드 안에
                    링크(1학기 일정)를 둘 수 있도록 막대를 버튼에서 영역으로 바꿨다(2026-09-30) */}
                <div
                  className="annual__bar"
                  data-state={isSelected ? 'selected' : selected === null ? 'idle' : 'muted'}
                  data-pinned={pinned === i}
                  style={style}
                  onPointerEnter={(e) => hover(i, e)}
                  onClick={(e) => pin(i, e.timeStamp)}
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
