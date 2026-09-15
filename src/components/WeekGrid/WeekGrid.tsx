import type { CSSProperties } from 'react';
import './WeekGrid.css';

/**
 * Weekly timetable as a calendar grid: hours 10–18 down the side, one column per
 * weekday, sessions placed by their real time range and a lunch band across all days.
 */
type Day = { am: string | null; pm: string | null };

type Props = {
  weekdays: string[];
  days: Day[];
  startHour?: number;
  endHour?: number;
};

const AM = { from: 10, to: 13, label: '10:00 – 13:00' };
const PM = { from: 15, to: 18, label: '15:00 – 18:00' };
const LUNCH = { from: 13, to: 15 };

/** Alternate tones so neighbouring sessions read as separate blocks */
const TONES = ['var(--week-tone-1)', 'var(--week-tone-2)', 'var(--week-tone-1)', 'var(--week-tone-2)', 'var(--week-tone-1)', 'var(--week-tone-3)', 'var(--week-tone-2)', 'var(--week-tone-3)'];

export function WeekGrid({ weekdays, days, startHour = 10, endHour = 18 }: Props) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const rowOf = (hour: number) => hour - startHour + 1; // grid line index
  let sessionIndex = 0;

  return (
    <div className="week-grid" style={{ '--week-hours': endHour - startHour } as CSSProperties} role="table" aria-label="주간 시간표">
      <div className="week-grid__head" role="row">
        <span role="columnheader" className="week-grid__corner" />
        {weekdays.map((d) => (
          <span key={d} role="columnheader" className="week-grid__day">{d}</span>
        ))}
      </div>

      <div className="week-grid__body">
        {/* Hour labels + dashed hour lines */}
        {hours.map((h) => (
          <span key={h} className="week-grid__hour" style={{ gridRow: rowOf(h) }} aria-hidden="true">
            <span>{h}</span>
          </span>
        ))}

        {/* Day column separators */}
        {weekdays.map((d, i) => (
          <span key={d} className="week-grid__col" style={{ gridColumn: i + 2 }} aria-hidden="true" />
        ))}

        {/* Lunch band across all days */}
        <span className="week-grid__lunch" style={{ gridRow: `${rowOf(LUNCH.from)} / ${rowOf(LUNCH.to)}` }}>점심시간</span>

        {/* Sessions */}
        {days.map((day, di) =>
          (['am', 'pm'] as const).map((slot) => {
            const name = day[slot];
            if (!name) return null;
            const range = slot === 'am' ? AM : PM;
            const tone = TONES[sessionIndex++ % TONES.length];
            return (
              <div
                key={`${di}-${slot}`}
                role="cell"
                className="week-grid__session"
                style={{ gridColumn: di + 2, gridRow: `${rowOf(range.from)} / ${rowOf(range.to)}`, background: tone }}
              >
                <span className="week-grid__time">{range.label}</span>
                <span className="week-grid__name">{name}</span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
