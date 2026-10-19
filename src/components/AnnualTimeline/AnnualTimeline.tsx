import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import './AnnualTimeline.css';

/**
 * 연간 구조 — v10(2026-10-19): 위 탭 · 아래 내용.
 *
 * 위: 네 시기 탭(같은 폭). 전체 폭 가는 선 위에 고른 칸만 굵은 잉크 선, 아래 이름 · 짧은 기간(사용자 시안 이미지).
 *   섹션 맨 위에 두어 "무엇을 고를 수 있는지"가 먼저 보이고, 고른 결과는 바로 아래에 나온다(위 → 아래 읽는 순서와 같다).
 * 아래: 시기 패널(v7 History 형식 그대로) — 왼쪽 순서 · 시기의 질문 · 기간과 사실, 오른쪽 이름 · 설명 · 내용.
 * ←/→ 키로 탭을 옮긴다. 자동으로 넘어가지 않는다(WCAG 2.2.2).
 * 네 시기의 패널은 가로 한 줄(트랙)로 나란히 서고, 시기를 바꾸면 트랙이 좌우로 미끄러져 옆 시기로 넘어간다
 * (사용자 지시 2026-10-19 — 제자리 페이드는 뚝뚝 끊겨 보였다). 줄 높이는 가장 긴 시기에 맞춰져 아래 섹션이 흔들리지 않는다.
 * v7 · v9의 아래 진행 바(칸 길이 = 기간, 월 눈금, ←/→ 버튼)는 v10에서 이 탭으로 바뀌었다.
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
  /** 탭에 쓰는 짧은 기간 — '2026.08 – 12' */
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
  const [selected, setSelected] = useState(0);
  // 고른 칸을 가리키는 막대 하나 — 칸마다 선이 줄었다 늘었다 하지 않고, 고른 칸 자리로 미끄러져 간다(사용자 지시 2026-10-19).
  // 자리는 고른 탭을 재서 정한다 — 넓은 화면 · 휴대폰 모두 네 칸 한 줄
  const tabsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const list = tabsRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;
    const place = () => {
      const tab = list.querySelector<HTMLElement>(`#annual-tab-${selected}`);
      if (!tab) return;
      // 막대는 칸의 글자 폭만큼(오른쪽 안쪽 여백 + 4px은 비워 칸 사이가 띄어 보인다) — 휴대폰은 여백이 좁다
      bar.style.width = `${tab.offsetWidth - parseFloat(getComputedStyle(tab).paddingRight) - 4}px`;
      bar.style.transform = `translateX(${tab.offsetLeft}px)`; // 칸은 언제나 한 줄(2026-10-19)
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [selected]);
  const pick = (i: number) => {
    const next = (i + stages.length) % stages.length;
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
    <div className="history">
      {/* ---------- 탭: 섹션 위, 네 칸 같은 폭(v10, 사용자 시안 이미지) ----------
          가로로 긴 가는 선 위에 고른 칸만 굵은 잉크 선, 아래에 이름 · 짧은 기간. 고르지 않은 칸은 흐리게.
          칸 = 시기라 순서가 곧 시간 — 길이로 기간을 그리던 v7 · v9의 바는 내용(패널 왼쪽 기간)에 맡긴다 */}
      <div ref={tabsRef} className="history__tabs" role="tablist" aria-label="연간 구조 시기" onKeyDown={onKey}>
        <span ref={barRef} className="history__indicator" aria-hidden="true" />
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
            onClick={() => pick(i)}
          >
            <span className="history__tab-name">{s.name}</span>
            <span className="history__tab-period">{s.tab}</span>
          </button>
        ))}
      </div>

      {/* ---------- 시기 패널: 가로 트랙 — 고른 시기 칸만큼 옆으로 민다 ---------- */}
      <div className="history__panels">
        <div className="history__track" style={{ '--sel': selected } as React.CSSProperties}>
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
              {/* 01 / 04 번호와 질문 문구는 뺐다(사용자 지시 2026-10-20) — 기간 · 정보만 */}
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
