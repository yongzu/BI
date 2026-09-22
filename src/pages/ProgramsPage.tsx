import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Text } from '../components/Text/Text';
import { Toc, type TocItem } from '../components/Toc/Toc';
import { AnnualTimeline } from '../components/AnnualTimeline/AnnualTimeline';
import { Dropdown } from '../components/Dropdown/Dropdown';
import { CourseCard } from '../components/CourseCard/CourseCard';
import { WeekGrid } from '../components/WeekGrid/WeekGrid';
import { BackToTop, SiteHeader } from '../components/SiteHeader/SiteHeader';
import { CoursePanel, type PanelEntry } from '../components/CoursePanel/CoursePanel';
import { courseProfiles } from '../data/courseProfiles';
import { useScrollReveal } from '../hooks/useScrollReveal';
import labelRule from '../assets/label-rule.svg';
import {
  attitudes,
  camps,
  competencies,
  courseTypes,
  devices,
  facts,
  intro,
  months,
  stages,
  timetable,
  weekdays,
} from '../data/programs';
import './programs.css';

const toc: TocItem[] = [
  {
    id: 'pillars',
    label: '역량과 태도',
    children: [
      { id: 'pillars-competency', label: '역량 Competency' },
      { id: 'pillars-attitude', label: '태도 Phi OS' },
    ],
  },
  {
    id: 'curriculum',
    label: '커리큘럼',
    children: [
      { id: 'curriculum-annual', label: '연간 구조' },
      { id: 'courses', label: '주요 수업들', children: courseTypes.map((t) => ({ id: `type-${t.id}`, label: t.name })) },
      { id: 'devices', label: '수업을 관통하는 접근' },
      { id: 'week', label: '주간 시간표' },
      { id: 'camp', label: '방학 + 캠프' },
      { id: 'graduation', label: '수료 & 졸업' },
    ],
  },
  { id: 'career', label: '채용 연계' },
];

/** Blocks that rise in on scroll */
const revealTargets = ['.hero > *', '.section-header > *', '.group-label', '.group__lead', '.course-type__head', '.course-card', '.item', '.annual', '.week-scroll', '.device-accordion__item'].join(', ');

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
 * 수업을 관통하는 접근 — GPT 개편안의 결과 중심 아코디언을 그대로 옮기고, 열고 닫힘을 부드럽게.
 * 줄을 누르면 설명이 아래로 스르르 펼쳐진다(높이 0fr → 1fr 전환 + 글자 페이드). 여러 줄을 함께 열 수 있고,
 * 첫 줄은 열린 채로 시작한다(GPT 판과 같다). <details>는 열림이 즉시라 버튼 + 영역으로 바꿨다.
 */
function DeviceAccordion({ items }: { items: { name: string; body: string }[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  return (
    <div className="device-accordion">
      {items.map((d, i) => {
        const isOpen = open.has(i);
        const panelId = `device-panel-${i}`;
        return (
          <div key={d.name} className="device-accordion__item" data-open={isOpen}>
            <button type="button" className="device-accordion__summary" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(i)}>
              <Text as="span" typography="Label" color="tertiary">{String(i + 1).padStart(2, '0')}</Text>
              <Text as="span" typography="Title">{deviceOutcomes[d.name] ?? d.name}</Text>
              <Text as="span" typography="Label" className="device-accordion__name">{d.name}</Text>
              <span className="device-accordion__icon" aria-hidden="true">＋</span>
            </button>
            <div id={panelId} className="device-accordion__panel" role="region" aria-label={d.name} inert={!isOpen}>
              <div className="device-accordion__clip">
                <div className="device-accordion__body">
                  <Text typography="Body" color="secondary">{d.body}</Text>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Item({ title, label, children }: { title: ReactNode; label?: ReactNode; children?: ReactNode }) {
  return (
    <article className="item">
      <Text as="h4" typography="Title">{title}</Text>
      {label && <Text typography="Label" color="tertiary" className="item__label">{label}</Text>}
      {children && <div className="item__body">{children}</div>}
    </article>
  );
}

/* ------------------------------------------------------------------ */

export function ProgramsPage() {
  useScrollReveal(revealTargets);

  // All 12 courses in page order, for numbering and prev/next inside the panel
  const entries = useMemo<PanelEntry[]>(
    () => courseTypes.flatMap((type) => type.courses.map((course) => ({ course, type, profile: courseProfiles[course.slug] }))).map((e, index) => ({ ...e, index })),
    [],
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closePanel = useCallback(() => setOpenIndex(null), []);
  const stepPanel = useCallback((dir: -1 | 1) => setOpenIndex((i) => (i === null ? i : (i + dir + entries.length) % entries.length)), [entries.length]);

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

          <Dropdown
            autoOpen
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
        </section>

        {/* ---------- 역량과 태도 ---------- */}
        <section id="pillars" className="section container">
          <SectionHeader title="역량과 태도" lead="어떤 환경에서도 스스로 답을 찾을 수 있는 사고방식을 만들기 위해, Phi는 아래 역량과 태도를 중요시합니다." />
          {[
            { id: 'pillars-competency', label: '역량 · Competency', items: competencies },
            { id: 'pillars-attitude', label: '태도 · Phi OS', items: attitudes },
          ].map((group) => (
            <div key={group.id} id={group.id} className="group">
              <GroupLabel>{group.label}</GroupLabel>
              <div className="grid-5">
                {group.items.map((p) => (
                  <Item key={p.en} title={p.ko} label={p.en}>
                    <Text typography="Body" color="secondary">{p.body}</Text>
                  </Item>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ---------- 커리큘럼 ---------- */}
        <section id="curriculum" className="section container">
          <SectionHeader title="커리큘럼" lead="2026년 8월 개강부터 2027년 8월 졸업까지, 두 학기와 방학 캠프, 졸업 프로젝트로 이어지는 1년입니다." />

          <div id="curriculum-annual" className="group">
            <GroupLabel>연간 구조</GroupLabel>
            <AnnualTimeline stages={stages} months={months} />
          </div>

          <div id="courses" className="group">
            <GroupLabel>주요 수업들</GroupLabel>
            <Text typography="Body" color="secondary" className="group__lead">
              상기된 역량과 태도를 중심으로 설계된 1학기 수업들입니다. 2학기는 1학기의 성취에 따라 학습 효과를 보완, 증폭할 수 있는 방향으로 준비됩니다.
            </Text>

            {courseTypes.map((type) => (
              <div key={type.id} id={`type-${type.id}`} className="course-type">
                <div className="course-type__head">
                  <Text as="h4" typography="Title">{type.name}</Text>
                  <Text typography="Label" color="tertiary">{type.cadence} · {type.courses.length}개 수업</Text>
                  <Text typography="Body" color="secondary" className="course-type__body">{type.body}</Text>
                </div>
                <div className="grid-courses">
                  {type.courses.map((c) => {
                    const entry = entries.find((e) => e.course.slug === c.slug)!;
                    return <CourseCard key={c.slug} index={entry.index} course={c} profile={entry.profile} onOpen={() => setOpenIndex(entry.index)} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 수업을 관통하는 접근 ---------- */}
        <section id="devices" className="section container">
          <SectionHeader
            title={<>수업을<br />관통하는 접근</>}
            lead="Phi의 교육은 인지적 도제(Cognitive Apprenticeship)를 토대로 설계되었습니다. 전문가의 사고 과정을 학습자가 능동적으로 관찰할 수 있도록 다양한 장치가 준비되어있습니다."
          />
          <div className="group">
            <GroupLabel>핵심 수업 장치</GroupLabel>
            <DeviceAccordion items={devices} />
          </div>
        </section>

        {/* ---------- 주간 시간표 ---------- */}
        <section id="week" className="section container">
          <SectionHeader
            title="주간 시간표"
            lead="매주 월-금 수업이 진행됩니다. 화, 수, 목은 오전-오후 풀타임으로 진행되며 월, 금은 학기 수업 스케줄에 따라 유동적으로 진행됩니다."
          />
          <div className="group">
            <GroupLabel>1학기 기준</GroupLabel>
            <div className="week-scroll" data-lenis-prevent-horizontal>
              <WeekGrid weekdays={weekdays} days={timetable} />
            </div>
            <a className="link typo-label" href="https://www.phi.design/lab-pdf/timetable-monthly" target="_blank" rel="noreferrer">1학기 일정 자세히보기 →</a>
          </div>
        </section>

        {/* ---------- 방학 + 캠프 ---------- */}
        <section id="camp" className="section container">
          <SectionHeader
            title="방학 + 캠프"
            lead="4개월의 학기 루틴에서 벗어나 휴식과 함께 진행되는 워크숍 프로그램. 캠프는 별도 비용 없이 희망자 모두 참석할 수 있습니다."
          />
          <div className="group">
            <GroupLabel>2027년 1월 – 2월</GroupLabel>
            <div className="grid-3">
              {camps.map((c) => (
                <Item key={c.name} title={c.name} label={c.partner}>
                  <Text typography="Body" color="secondary">{c.body}</Text>
                </Item>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 수료 & 졸업 ---------- */}
        <section id="graduation" className="section container">
          <SectionHeader title="수료 & 졸업" lead="졸업 프로젝트는 외부에 실제로 발표 또는 출시되어야 합니다." />
          <div className="group">
            <GroupLabel>2027년 6월 – 8월</GroupLabel>
            <div className="grid-3">
              <Item title="수료" label="Completion">
                <Text typography="Body" color="secondary">2026년 8월부터 2027년 6월까지 예정된 모든 수업을 이수한 상태.</Text>
              </Item>
              <Item title="졸업" label="Graduation">
                <Text typography="Body" color="secondary">수료 조건 달성 후, 2027년 7–8월에 본인의 목표에 따른 프로젝트를 완성합니다. 해당 프로젝트는 외부에 실제로 발표 또는 출시되어야 합니다.</Text>
              </Item>
            </div>
          </div>
        </section>

        {/* ---------- 채용 연계 ---------- */}
        <section id="career" className="section section--last container">
          <SectionHeader title="채용 연계" lead="Phi의 1년제 프로그램 졸업자들은 토스의 별도 채용 전형에 지원할 수 있습니다." />
          <div className="group">
            <GroupLabel>with Toss</GroupLabel>
            <div className="grid-3">
              <Item title="토스 별도 채용 전형" label="2027년 8월">
                <Text typography="Body" color="secondary">2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.</Text>
              </Item>
              <Item title="우수 졸업자 입사 특전" label="Benefit">
                <Text typography="Body" color="secondary">우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.</Text>
                <Text typography="Label" color="tertiary">*채용 특전의 세부 내용은 현재 검토 중입니다.</Text>
              </Item>
            </div>
          </div>
        </section>
      </main>
      </div>

      <CoursePanel entry={openIndex === null ? null : entries[openIndex]} total={entries.length} onClose={closePanel} onStep={stepPanel} />

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
