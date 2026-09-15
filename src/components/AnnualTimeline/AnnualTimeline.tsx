import { useState, type CSSProperties } from 'react';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * Annual structure as a zoomable timeline.
 * - Overview: every stage is a bar on its own row, placed on a month axis.
 * - Select a stage (chip or bar): the axis zooms to that stage's months, the bar
 *   grows into a detail card, other bars fade and slide off with the new scale.
 * Everything is positioned in % of the current view window, so a single state
 * change animates bars, month labels and grid lines together via CSS transitions.
 */
export type Stage = { name: string; period: string; marker?: string; start: number; end: number; body: string };

type Props = { stages: Stage[]; months: number[] };

const PAD = 1.15; // months of context shown on each side of a selected stage

export function AnnualTimeline({ stages, months }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const total = months.length; // axis spans [0, total]

  const view = selected === null
    ? { from: 0, to: total }
    : { from: stages[selected].start - PAD, to: stages[selected].end + PAD };
  const span = view.to - view.from;
  const pct = (x: number) => `${((x - view.from) / span) * 100}%`;
  const len = (d: number) => `${(d / span) * 100}%`;

  const inFocus = (m: number) => selected !== null && m >= Math.floor(stages[selected].start) && m < Math.ceil(stages[selected].end);
  const toggle = (i: number) => setSelected((cur) => (cur === i ? null : i));

  return (
    <div className="annual" data-zoomed={selected !== null}>
      <div className="annual__chips" role="group" aria-label="연간 구조 보기">
        <button type="button" className="annual__chip typo-label" aria-pressed={selected === null} onClick={() => setSelected(null)}>
          전체
        </button>
        {stages.map((s, i) => (
          <button key={s.name} type="button" className="annual__chip typo-label" aria-pressed={selected === i} onClick={() => toggle(i)}>
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
                  aria-expanded={isSelected}
                  style={style}
                  onClick={() => toggle(i)}
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
