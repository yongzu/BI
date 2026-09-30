import { useState, type ReactNode } from 'react';
import { Text } from '../components/Text/Text';
import { Toc, type TocItem } from '../components/Toc/Toc';
import { AnnualTimeline } from '../components/AnnualTimeline/AnnualTimeline';
import { Dropdown } from '../components/Dropdown/Dropdown';
import { CourseExplorer } from '../components/CourseExplorer/CourseExplorer';
import { BackToTop, SiteHeader } from '../components/SiteHeader/SiteHeader';
import { courseProfiles } from '../data/courseProfiles';
import { useScrollReveal } from '../hooks/useScrollReveal';
import labelRule from '../assets/label-rule.svg';
import type { Pillar } from '../data/programs';
import {
  attitudes,
  competencies,
  courseTypes,
  devices,
  facts,
  intro,
  months,
  stages,
} from '../data/programs';
import './programs.css';

const toc: TocItem[] = [
  // 목차는 섹션 다섯 개를 한 층위로 — 역량과 태도의 하위 항목은 없애고, 수업을 관통하는 접근은
  // 커리큘럼 아래에서 빼 같은 층위로(사용자 지시 2026-09-30)
  { id: 'pillars', label: '역량과 태도' },
  { id: 'curriculum-annual', label: '연간 구조' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'devices', label: '수업을 관통하는 접근' },
  { id: 'career', label: '채용 연계' },
];

/** Blocks that rise in on scroll */
const revealTargets = ['.hero > *', '.section-header > *', '.group-label', '.group__lead', '.course-explorer', '.pillar-row', '.annual', '.device-card'].join(', ');

/* ------------------------------------------------------------------ */

/** Section title (64) + lead (28, 70%) in two columns */
function SectionHeader({ title, lead }: { title: ReactNode; lead?: string }) {
  return (
    <header className="section-header">
      <Text typography="Heading">{title}</Text>
      {lead && <Text typography="Lead" color="secondary">{lead}</Text>}
    </header>
  );
}

/** Group label with the short vertical rule from the design */
function GroupLabel({ children, meta }: { children: ReactNode; meta?: string }) {
  return (
    <div className="group-label">
      <span className="group-label__rule" aria-hidden="true">
        <img src={labelRule} alt="" />
      </span>
      <Text as="h3" typography="Title">{children}</Text>
      {meta && <Text as="span" typography="Label" color="tertiary">{meta}</Text>}
    </div>
  );
}

/** Title (24) · English/meta label (16, 20%) · body (16, 70%) */
/** 수업 장치마다 학습자가 얻는 결과 한 줄 — GPT 개편안(/BI/gpt/)의 문구 그대로 */
const deviceOutcomes: Record<string, string> = {
  라이브데모: '전문가의 사고 과정을 직접 본다',
  피어크리틱: '동료와 평가 기준을 공유한다',
  셀프피드백: '스스로 성장 정도를 판단한다',
  워크숍: '필요한 기술을 제때 보완한다',
  공유회: '설명하며 다시 배운다',
  저널링: '배움을 기록하고 다음 행동으로 잇는다',
};

/**
 * 줄 목록 — 역량과 태도, 채용 연계가 같은 모양으로 쓴다
 * (사용자 지시 2026-09-30). 줄에는 번호 · 제목 · 보조 문구만 두고, 설명은 마우스를
 * 올리면 0fr → 1fr로 펼친다(사용자 지시 2026-09-23). 줄을 누르면 열린 채로 고정되고,
 * 다른 줄을 열어도 그대로 남는다(여러 줄 동시 고정).
 * `start`는 번호를 이어 매기기 위한 값 — 오른쪽 목록이 왼쪽 목록 다음 번호부터 센다.
 */
type RowItem = { id: string; title: string; sub?: string; body: ReactNode };

function RowList({ items, start = 0 }: { items: RowItem[]; start?: number }) {
  const [pinned, setPinned] = useState<Set<string>>(() => new Set());
  const togglePin = (id: string) => setPinned((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return (
    <div className="pillar-list">
      {items.map((item, i) => {
        const isPinned = pinned.has(item.id);
        const panelId = `row-${item.id}`;
        return (
          <article key={item.id} className="pillar-row" data-pinned={isPinned}>
            <button
              type="button"
              className="pillar-row__hit"
              aria-expanded={isPinned}
              aria-controls={panelId}
              onClick={() => togglePin(item.id)}
            >
              <Text as="span" typography="Label" color="tertiary">{String(start + i + 1).padStart(2, '0')}</Text>
              <span className="pillar-row__titles">
                <Text as="span" typography="Title">{item.title}</Text>
                {item.sub && <Text as="span" typography="Label" color="tertiary">{item.sub}</Text>}
              </span>
              <span className="pillar-row__icon" aria-hidden="true">＋</span>
            </button>
            <div id={panelId} className="pillar-row__panel" role="region" aria-label={item.title}>
              <div className="pillar-row__clip">
                <div className="pillar-row__body">
                  {typeof item.body === 'string' ? <Text typography="Body" color="secondary">{item.body}</Text> : item.body}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const pillarRows = (items: Pillar[]): RowItem[] => items.map((p) => ({ id: p.en.replace(/\s+/g, '-').toLowerCase(), title: p.ko, sub: p.en, body: p.body }));

/**
 * 수업을 관통하는 접근 — 주요 수업들의 코스 박스를 참고한 박스, 한 줄에 2개씩 3줄
 * (사용자 지시 2026-09-29). 박스에는 번호 · 장치 이름 · 결과 한 줄만 보이고, 설명은
 * 마우스를 올리면 펼친다(0fr → 1fr). 닫힌 박스는 작게, 펼친 박스는 설명이 가장 긴 박스
 * 크기로 모두 같다.
 * 누르면 열린 채로 고정되고(여러 박스 동시 고정),
 * 열린 설명을 눌러도 닫힌다 — 역량과 태도 목록과 같은 조작이다.
 */
function DeviceGrid({ items }: { items: { name: string; tag: string; body: string }[] }) {
  const [pinned, setPinned] = useState<Set<number>>(() => new Set());
  const togglePin = (i: number) => setPinned((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  return (
    <div className="grid-devices">
      {items.map((d, i) => {
        const isPinned = pinned.has(i);
        const panelId = `device-panel-${i}`;
        return (
          <article key={d.name} className="device-card" data-pinned={isPinned}>
            <button type="button" className="device-card__hit" aria-expanded={isPinned} aria-controls={panelId} onClick={() => togglePin(i)}>
              <span className="device-card__topline">
                {/* 번호(흰 알약) 옆에 배우는 자리 태그(테두리 알약) */}
                <span className="device-card__chips">
                  <Text as="span" typography="Label" color="inherit" className="device-card__badge">{String(i + 1).padStart(2, '0')}</Text>
                  <span className="device-card__tag">{d.tag}</span>
                </span>
                <span className="device-card__icon" aria-hidden="true">＋</span>
              </span>
              <Text as="h4" typography="Title" className="device-card__name">{d.name}</Text>
              {deviceOutcomes[d.name] && <Text as="span" typography="Label" color="tertiary">{deviceOutcomes[d.name]}</Text>}
            </button>
            <div id={panelId} className="device-card__panel" role="region" aria-label={d.name} onClick={() => togglePin(i)}>
              <div className="device-card__clip">
                {/* 여섯 설명을 한 칸에 겹쳐 두고 자기 설명만 보인다 — 펼친 높이가 늘 가장 긴 설명에 맞춰진다 */}
                <div className="device-card__body">
                  {items.map((o) => (
                    <Text key={o.name} typography="Body" color="secondary" className="device-card__text" data-ghost={o !== d} aria-hidden={o !== d}>{o.body}</Text>
                  ))}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** 채용 연계 — 왼쪽 토스 별도 채용 전형, 오른쪽 우수 졸업자 입사 특전 */
const careerRows: RowItem[] = [
  { id: 'toss-hiring', title: '토스 별도 채용 전형', sub: '2027년 8월', body: '2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.' },
  {
    id: 'toss-benefit',
    title: '우수 졸업자 입사 특전',
    sub: 'Benefit',
    body: (
      <>
        <Text typography="Body" color="secondary">우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.</Text>
        <Text typography="Label" color="tertiary">*채용 특전의 세부 내용은 현재 검토 중입니다.</Text>
      </>
    ),
  },
];

/**
 * 역량과 태도와 같은 두 단: 왼쪽 목록 · 오른쪽 목록, 좁으면 위아래.
 * 번호는 오른쪽이 왼쪽에 이어 세고(continue), 서로 다른 묶음(역량 · 태도)은 각자 01부터(restart).
 */
function RowColumns({ columns, numbering = 'continue' }: { columns: { id?: string; label?: string; items: RowItem[] }[]; numbering?: 'continue' | 'restart' }) {
  return (
    <div className="pillar-columns">
      {columns.map((col, c) => {
        const from = numbering === 'continue' ? columns.slice(0, c).reduce((n, prev) => n + prev.items.length, 0) : 0;
        return (
          <div key={col.id ?? c} id={col.id} className="pillar-column">
            {col.label && <GroupLabel>{col.label}</GroupLabel>}
            <RowList items={col.items} start={from} />
          </div>
        );
      })}
    </div>
  );
}

/** 과정 개요 드롭다운 — 실제 것과, 펼친 높이를 잡아 두는 보이지 않는 사본이 같은 모양을 쓴다 */
function Overview({ autoOpen, staticOpen }: { autoOpen?: boolean; staticOpen?: boolean }) {
  return (
    <Dropdown
      autoOpen={autoOpen}
      staticOpen={staticOpen}
      className="overview"
      label={<Text as="span" typography="Label">과정 개요</Text>}
      summary={<Text as="span" typography="Body" color="secondary">1년 · 전일제 오프라인 · 2026년 8월 24일 개강</Text>}
    >
      <dl className="overview__list">
        {facts.map((f) => (
          <div key={f.label} className="overview__row">
            <Text as="dt" typography="Label" color="tertiary">{f.label}</Text>
            <Text as="dd" typography="Body">{f.value}</Text>
          </div>
        ))}
      </dl>
    </Dropdown>
  );
}

/* ------------------------------------------------------------------ */

export function ProgramsPage() {
  useScrollReveal(revealTargets);

  return (
    <>
      <SiteHeader />
      <BackToTop />
      {/* The TOC rides a rail inside the page shell: it starts beside the hero,
          sticks while reading, and lets go before the footer. */}
      <div className="page-shell">
        <div className="toc-rail">
          <Toc items={toc} />
        </div>

      <main className="page">
        {/* ---------- Hero ---------- */}
        <section className="hero container" aria-labelledby="hero-title">
          <Text id="hero-title" typography="Display" className="hero__title">
            Phi Programs
            <br />
            도구보다 사고방식
          </Text>
          <Text typography="Intro" color="secondary" className="hero__intro">{intro[0]}</Text>

          {/* 과정 개요 자리: 펼친 높이를 미리 잡아 둔다(보이지 않는 펼친 사본) — 0.5초 뒤 자동으로
              펼쳐져도 가운데 정렬된 제목 · 소개문이 밀려 올라가지 않는다(Full Viewport A안, 2026-09-30) */}
          <div className="overview-slot">
            <div className="overview-ghost" aria-hidden="true" inert>
              <Overview staticOpen />
            </div>
            <Overview autoOpen />
          </div>
        </section>

        {/* ---------- 역량과 태도 ---------- */}
        <section id="pillars" className="section container">
          <SectionHeader title="역량과 태도" lead="어떤 환경에서도 스스로 답을 찾을 수 있는 사고방식을 만들기 위해, Phi는 아래 역량과 태도를 중요시합니다." />
          {/* 역량은 왼쪽, 태도는 오른쪽 — 두 목록을 나란히 세로로(사용자 지시 2026-09-30). 설명은 호버로 펼친다 */}
          <div className="group">
            <RowColumns
              numbering="restart"
              columns={[
                { id: 'pillars-competency', label: '역량 · Competency', items: pillarRows(competencies) },
                { id: 'pillars-attitude', label: '태도 · Phi OS', items: pillarRows(attitudes) },
              ]}
            />
          </div>
        </section>

        {/* ---------- 연간 구조 — 역량과 태도 바로 아래 ---------- */}
        <section id="curriculum-annual" className="section container">
          <SectionHeader
            title="연간 구조"
            lead="2026년 8월 개강부터 2027년 8월 졸업까지, 두 학기와 방학 캠프, 졸업 프로젝트로 이어지는 1년입니다."
          />
          <AnnualTimeline stages={stages} months={months} />
        </section>

        {/* ---------- 커리큘럼 ---------- */}
        <section id="curriculum" className="section container">
          <SectionHeader title="커리큘럼" lead="상기된 역량과 태도를 중심으로 설계된 1학기 수업들입니다. 2학기는 1학기의 성취에 따라 학습 효과를 보완, 증폭할 수 있는 방향으로 준비됩니다." />

          {/* 필터 · 수업 목록 · 상세를 한 화면에 — 클릭 없이 전체를 파악한다 */}
          <div id="courses" className="group">
            <CourseExplorer types={courseTypes} profiles={courseProfiles} />
          </div>
        </section>

        {/* ---------- 수업을 관통하는 접근 ---------- */}
        <section id="devices" className="section container">
          <SectionHeader
            title={<>수업을<br />관통하는 접근</>}
            lead="Phi의 교육은 인지적 도제(Cognitive Apprenticeship)를 토대로 설계되었습니다. 전문가의 사고 과정을 학습자가 능동적으로 관찰할 수 있도록 다양한 장치가 준비되어있습니다."
          />
          {/* 두 단 목록을 시험해 본 뒤 박스로 되돌림(사용자 지시 2026-09-30) */}
          <div className="group">
            <GroupLabel>핵심 수업 장치</GroupLabel>
            <DeviceGrid items={devices} />
          </div>
        </section>

        {/* ---------- 채용 연계 ---------- */}
        <section id="career" className="section section--last container">
          <SectionHeader title="채용 연계" lead="Phi의 1년제 프로그램 졸업자들은 토스의 별도 채용 전형에 지원할 수 있습니다." />
          {/* 역량과 태도와 같은 두 단 목록(로컬 시험, 2026-09-30): 왼쪽 채용 전형 · 오른쪽 입사 특전 */}
          <div className="group">
            <GroupLabel>with Toss</GroupLabel>
            <RowColumns columns={[{ items: careerRows.slice(0, 1) }, { items: careerRows.slice(1) }]} />
          </div>
        </section>
      </main>
      </div>

      <footer className="footer container">
        <Text typography="Title">Phi Institute of Design</Text>
        <Text typography="Body" color="secondary">파이인스티튜트오브디자인 · 02-556-8461 · contact@phi.design</Text>
        <Text typography="Label" color="tertiary">
          평일 10:00 - 18:00 (점심시간 13:00 - 14:00) · © 2026 Phi Institute of Design · <a href="#system" className="link">Design System</a>
        </Text>
      </footer>
    </>
  );
}
