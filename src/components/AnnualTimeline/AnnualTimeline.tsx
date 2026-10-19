import { useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * 연간 구조(v7, 2026-10-19) — toss.im/company History 형식.
 *
 * 위: 시기 패널. 왼쪽에 순서(01 / 04) · 그 시기의 질문(따옴표) · 기간 · 핵심 사실, 오른쪽에 설명과 내용(주간 리듬 · 캠프 · 수료와 졸업).
 * 아래: 1년을 한 줄로 그린 진행 바. 칸 길이 = 기간이고, 칸을 누르면(또는 ←/→) 위 패널이 바뀐다.
 *   History의 "가로 진행 막대형 기간 탭"처럼 지난 시기는 잉크, 고른 시기는 굵은 잉크, 다음 시기는 흐리게 — 1년 중 어디쯤인지가 한눈에.
 * v6의 위 세그먼트 탭은 없앴다(사용자 지시 2026-10-19) — 바 자체가 탭이다. 자동으로 넘어가지 않는다(WCAG 2.2.2).
 * 네 시기의 패널을 한 칸에 겹쳐 두어 높이가 가장 긴 시기에 맞춰진다 — 시기를 바꿔도 아래 섹션이 흔들리지 않는다.
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
export type Stage = {
  name: string;
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

type Props = { stages: Stage[]; months: number[] };

export function AnnualTimeline({ stages, months }: Props) {
  const [selected, setSelected] = useState(0);
  const [dir, setDir] = useState(1);
  const total = months.length; // 바는 [0, 13] — 눈금 13개, 마지막 시기는 13에서 끝난다
  const pct = (x: number) => `${(x / total) * 100}%`;
  const barEnd = (i: number) => stages[i + 1]?.start ?? stages[i].end;
  const pick = (i: number) => {
    const next = (i + stages.length) % stages.length;
    setDir(next >= selected ? 1 : -1);
    setSelected(next);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = selected + (e.key === 'ArrowRight' ? 1 : -1);
    if (next < 0 || next >= stages.length) return;
    pick(next);
    document.getElementById(`annual-tab-${next}`)?.focus();
  };

  return (
    <div className="history" style={{ '--dir': dir } as React.CSSProperties}>
      {/* ---------- 시기 패널 ---------- */}
      <div className="history__panels">
        {stages.map((s, i) => (
          <section
            key={s.name}
            id={`annual-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`annual-tab-${i}`}
            className="history__panel"
            data-active={selected === i}
            inert={selected !== i}
          >
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
                {s.facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="history__main">
              <div className="history__title">
                <Text as="h3" typography="Heading">{s.name}</Text>
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

      {/* ---------- 진행 바 = 탭 ---------- */}
      <div className="history__nav">
        <div className="history__track-wrap">
          <div className="history__tabs" role="tablist" aria-label="연간 구조 시기" onKeyDown={onKey}>
            {stages.map((s, i) => (
              <button
                key={s.name}
                id={`annual-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={selected === i}
                aria-controls={`annual-panel-${i}`}
                tabIndex={selected === i ? 0 : -1}
                className="history__tab"
                data-state={i < selected ? 'past' : i === selected ? 'current' : 'next'}
                style={{ left: pct(s.start), width: pct(barEnd(i) - s.start) }}
                onClick={() => pick(i)}
              >
                <span className="history__tab-name">{s.name}</span>
                <span className="history__tab-line" aria-hidden="true"><span className="history__tab-fill" /></span>
              </button>
            ))}
          </div>
          <div className="history__months" aria-hidden="true">
            {months.map((m, i) => (
              <span key={i} className="history__month" style={{ left: pct(i) }}>{m}</span>
            ))}
          </div>
        </div>
        <div className="history__arrows">
          <button type="button" className="history__arrow" onClick={() => pick(selected - 1)} disabled={selected === 0} aria-label="이전 시기">←</button>
          <button type="button" className="history__arrow" onClick={() => pick(selected + 1)} disabled={selected === stages.length - 1} aria-label="다음 시기">→</button>
        </div>
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
    <div className="annual__rhythm">
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
      <span className="annual__week-note">
        {rhythm.body}{' '}
        <a className="annual__link" href={rhythm.link.href} target="_blank" rel="noreferrer">{rhythm.link.label}</a>
      </span>
    </div>
  );
}
