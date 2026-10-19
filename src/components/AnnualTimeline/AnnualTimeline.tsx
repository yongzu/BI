import { useState } from 'react';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * 연간 구조 — 월 축 위의 네 막대 + 축 아래 고정 상세 칸(v6, 2026-10-19).
 *
 * v5까지는 막대를 누르면 축이 확대되고(최대 1.2배) 그 막대가 상세 카드로 넓어졌다. 짧은 단계(2개월)가 긴 단계(4개월)보다
 * 넓게 그려져 "길이 = 기간"이라는 시간축의 약속이 깨졌고, 바깥을 누르면 닫혀 글을 고르다 사라졌다.
 * v6은 toss.im/company History(기간 탭을 고르면 아래 칸의 내용이 바뀜)를 따른다:
 * - 축은 움직이지 않는다. 막대 길이는 늘 기간 그대로.
 * - 위 세그먼트와 막대는 같은 하나의 선택. 고르면 축 아래 상세 칸의 내용만 바뀐다. 처음엔 1학기가 골라져 있어
 *   누르기 전에도 "여기에 무엇이 나오는지" 보인다. '전체'는 없앴다 — 전체는 축 자체가 보여 준다.
 * - 바깥을 눌러도 닫히지 않는다(본문이지 팝오버가 아니다).
 * - 네 단계의 상세를 한 칸에 겹쳐 두고 고른 것만 보인다 — 칸 높이가 가장 긴 상세에 맞춰져, 단계를 바꿔도 아래 섹션이 흔들리지 않는다.
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

export function AnnualTimeline({ stages, months }: Props) {
  const [selected, setSelected] = useState(0);
  const total = months.length; // axis spans [0, total] — 눈금 13개, 마지막 단계는 13에서 끝난다
  const pct = (x: number) => `${(x / total) * 100}%`;
  const barEnd = (i: number) => stages[i + 1]?.start ?? stages[i].end;
  const inFocus = (m: number) => m >= Math.floor(stages[selected].start) && m < Math.ceil(stages[selected].end);

  return (
    <div className="annual">
      <div className="segmented annual__filter" role="group" aria-label="연간 구조 단계">
        {stages.map((s, i) => (
          <button key={s.name} type="button" className="segmented__tab" aria-pressed={selected === i} aria-controls="annual-panel" onClick={() => setSelected(i)}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="annual__chart">
        <div className="annual__axis" aria-hidden="true">
          {months.map((m, i) => (
            <span key={i} className="annual__tick" data-focus={inFocus(i)} data-edge={i === 0} style={{ left: pct(i) }}>
              <span className="annual__month">{m}</span>
            </span>
          ))}
        </div>
        <ol className="annual__rows">
          {stages.map((s, i) => (
            <li key={s.name} className="annual__row">
              {/* 막대 = 세그먼트와 같은 선택. 길이는 기간 그대로(다음 단계 시작점까지) */}
              <button
                type="button"
                className="annual__bar"
                data-state={selected === i ? 'selected' : 'idle'}
                aria-pressed={selected === i}
                aria-controls="annual-panel"
                style={{ marginLeft: pct(s.start), width: pct(barEnd(i) - s.start) }}
                onClick={() => setSelected(i)}
              >
                <span className="annual__bar-name">{s.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* 고정 상세 칸: 네 상세를 겹쳐 두고 고른 것만 보인다 */}
      <div id="annual-panel" className="annual__panel" role="region" aria-live="polite" aria-label={`${stages[selected].name} 상세`}>
        {stages.map((s, i) => (
          <div key={s.name} className="annual__stage" data-active={selected === i} aria-hidden={selected !== i} inert={selected !== i}>
            <div className="annual__stage-head">
              <Text as="h3" typography="Title">{s.name}</Text>
              <span className="annual__meta">
                <Text as="span" typography="Meta" color="secondary">{s.period}</Text>
                {s.marker && <span className="annual__badge">{s.marker}</span>}
              </span>
            </div>
            <div className="annual__stage-body">
              <Text typography="Body" color="secondary" className="annual__body">{s.body}</Text>
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
              {s.rhythm && <WeekRhythm rhythm={s.rhythm} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 주간 리듬 박스: 요일 다섯 칸 × 오전 · 점심 · 오후. 세션 칸은 세로로 크게, 칸마다 시간과 세션 이름을
 * 적고 점심시간은 한 줄로 가로지른다(예전 주간 시간표처럼, 사용자 지시 2026-09-30).
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
      <a className="annual__link" href={rhythm.link.href} target="_blank" rel="noreferrer">
        {rhythm.link.label}
      </a>
    </span>
  );
}
