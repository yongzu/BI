import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * Annual structure as a zoomable timeline.
 * - Overview: every stage is a bar on its own row, placed on a month axis.
 * - Hover a stage (bar or chip): preview — the axis zooms to that stage's months and
 *   the bar grows into a detail card. Leaving the timeline ends the preview.
 * - Click: pins the stage so it stays open. Click it again, choose "전체", or click
 *   anywhere outside the timeline to return to the overview.
 * Everything is positioned in % of the current view window, so a single state
 * change animates bars, month labels and grid lines together via CSS transitions.
 */
export type Stage = { name: string; period: string; marker?: string; start: number; end: number; body: string };

type Props = { stages: Stage[]; months: number[] };

const PAD = 1.15; // months of context shown on each side of a selected stage
const SETTLE_MS = 700; // ignore hover while bars are still sliding, so a bar moving under the pointer can't steal focus

export function AnnualTimeline({ stages, months }: Props) {
  const [pinned, setPinned] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const settleUntil = useRef(0);
  const suppressHover = useRef(false);

  const selected = preview ?? pinned;
  const total = months.length; // axis spans [0, total]

  const view = selected === null
    ? { from: 0, to: total }
    : { from: stages[selected].start - PAD, to: stages[selected].end + PAD };
  const span = view.to - view.from;
  const pct = (x: number) => `${((x - view.from) / span) * 100}%`;
  const len = (d: number) => `${(d / span) * 100}%`;
  const inFocus = (m: number) => selected !== null && m >= Math.floor(stages[selected].start) && m < Math.ceil(stages[selected].end);

  // Event timestamps (not performance.now) keep these handlers pure for the linter
  const markMoving = (at: number) => { settleUntil.current = at + SETTLE_MS; };

  const hover = (i: number, e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || suppressHover.current) return;
    if (e.timeStamp < settleUntil.current) return;
    if (i !== selected) markMoving(e.timeStamp);
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
      <div className="annual__chips" role="group" aria-label="연간 구조 보기">
        <button type="button" className="annual__chip typo-label" aria-pressed={selected === null} onClick={(e) => pin(null, e.timeStamp)}>
          전체
        </button>
        {stages.map((s, i) => (
          <button
            key={s.name}
            type="button"
            className="annual__chip typo-label"
            aria-pressed={selected === i}
            data-pinned={pinned === i}
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
            const style: CSSProperties = { marginLeft: pct(s.start), width: len(s.end - s.start) };
            return (
              <li key={s.name} className="annual__row">
                <button
                  type="button"
                  className="annual__bar"
                  data-state={isSelected ? 'selected' : selected === null ? 'idle' : 'muted'}
                  data-pinned={pinned === i}
                  aria-expanded={isSelected}
                  aria-pressed={pinned === i}
                  style={style}
                  onPointerEnter={(e) => hover(i, e)}
                  onClick={(e) => pin(i, e.timeStamp)}
                >
                  <span className="annual__bar-head">
                    <span className="annual__bar-name">{s.name}</span>
                  </span>
                  <span className="annual__detail" aria-hidden={!isSelected}>
                    <span className="annual__detail-inner">
                      <span className="annual__meta">
                        <Text as="span" typography="Label" color="inherit">{s.period}</Text>
                        {s.marker && <span className="annual__badge">{s.marker}</span>}
                      </span>
                      <Text as="span" typography="Body" color="inherit" className="annual__body">{s.body}</Text>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
