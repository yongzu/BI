import { useState, type ReactNode } from 'react';
import { Text } from '../components/Text/Text';
import { Button, IconButton } from '../components/Button/Button';
import { Gallery, GalleryItem } from '../components/Gallery/Gallery';
import { Accordion } from '../components/Accordion/Accordion';
import { Segmented } from '../components/Segmented/Segmented';
import { Modal } from '../components/Modal/Modal';
import { Toc, type TocItem } from '../components/Toc/Toc';
import { useScrollReveal } from '../hooks/useScrollReveal';
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
  type Course,
  type CourseType,
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

/** Text blocks that rise in on scroll */
const revealTargets = [
  '.hero > *',
  '.section-header > *',
  '.pillar-group__title',
  '.course-type__head > *',
  '.courses__filter',
  '.stats__note',
  '.viewer__detail > *',
  '.cta-row > *',
].join(', ');

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Section header: optional eyebrow + headline + optional intro, in the 980px column. */
function SectionHeader({ eyebrow, headline, intro }: { eyebrow?: string; headline: string; intro?: ReactNode }) {
  return (
    <header className="section-header text-column">
      {eyebrow && <Text typography="Eyebrow" color="secondary" className="section-header__eyebrow">{eyebrow}</Text>}
      <Text as={eyebrow ? 'p' : 'h2'} typography="Headline">{headline}</Text>
      {intro && <Text typography="Intro" color="secondary" className="section-header__intro">{intro}</Text>}
    </header>
  );
}

function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  return (
    <article className="course-card">
      <Text typography="Caption" color="secondary">{course.ko}</Text>
      <Text as="h3" typography="Eyebrow" className="course-card__name">{course.en}</Text>
      <Text typography="Body" className="course-card__lead">{course.lead}</Text>
      <div className="course-card__foot">
        <Text as="span" typography="Footnote" color="secondary">{course.tags.join(' · ')}</Text>
        <IconButton icon="plus" label={`${course.en} 자세히 보기`} tone="action" onClick={onOpen} />
      </div>
    </article>
  );
}

export function ProgramsPage() {
  const [stage, setStage] = useState(0);
  const [filter, setFilter] = useState<CourseType['id'] | 'all'>('all');
  const [openCourse, setOpenCourse] = useState<Course | null>(null);

  const visibleTypes = filter === 'all' ? courseTypes : courseTypes.filter((t) => t.id === filter);
  const openType = openCourse ? courseTypes.find((t) => t.courses.includes(openCourse)) : undefined;

  useScrollReveal(revealTargets, filter);

  return (
    <>
      {/* ---------- Right-side table of contents ---------- */}
      <Toc items={toc} onNavigate={(id) => { if (id.startsWith('type-')) setFilter('all'); }} />

      <main>
        {/* ---------- Hero ---------- */}
        <section id="overview" className="hero">
          <Text typography="Eyebrow" as="p" className="hero__eyebrow">Phi의 1년제 프로그램</Text>
          <Text typography="Hero" className="hero__title">도구보다<br />사고방식.</Text>
          <Text typography="Intro" color="secondary" className="hero__intro">{intro[0]}</Text>
          <div className="hero__actions">
            <Button size="lg" onClick={() => go('courses')}>주요 수업 보기</Button>
            <Button size="lg" variant="secondary" onClick={() => go('curriculum')}>커리큘럼 살펴보기</Button>
          </div>
        </section>

        {/* ---------- Highlights ---------- */}
        <section className="section section--alt" aria-labelledby="highlights">
          <header className="section-header text-column">
            <Text id="highlights" typography="Headline">일단 핵심부터.</Text>
          </header>
          <ul className="stats wide-column">
            {facts.map((f) => (
              <li key={f.label} className="stat-card">
                <Text typography="Caption" color="secondary">{f.label}</Text>
                <Text typography="Stat" className="stat-card__value">{f.value}</Text>
                <Text typography="Body" color="secondary">{f.note}</Text>
              </li>
            ))}
          </ul>
          <Text typography="Intro" color="secondary" className="text-column stats__note">{intro[1]}</Text>
        </section>

        {/* ---------- 역량과 태도 ---------- */}
        <section id="pillars" className="section">
          <SectionHeader
            eyebrow="역량과 태도"
            headline="어떤 환경에서도 스스로 답을 찾는 사고방식."
            intro="어떤 환경에서도 스스로 답을 찾을 수 있는 사고방식을 만들기 위해, Phi는 아래 역량과 태도를 중요시합니다."
          />
          {[
            { id: 'pillars-competency', title: '역량', en: 'Competency', items: competencies },
            { id: 'pillars-attitude', title: '태도', en: 'Phi OS', items: attitudes },
          ].map((group) => (
            <div key={group.en} id={group.id} className="pillar-group">
              <Text typography="Title" className="text-column pillar-group__title">{group.title} <span className="color-secondary">{group.en}</span></Text>
              <Gallery label={`${group.title} ${group.en}`}>
                {group.items.map((item, i) => (
                  <GalleryItem key={item.en}>
                    <article className="tile">
                      <Text typography="Caption" color="secondary">{String(i + 1).padStart(2, '0')} · {item.en}</Text>
                      <Text as="h3" typography="Eyebrow" className="tile__title">{item.ko}</Text>
                      <Text typography="Body" color="secondary">{item.body}</Text>
                    </article>
                  </GalleryItem>
                ))}
              </Gallery>
            </div>
          ))}
        </section>

        {/* ---------- 커리큘럼 ---------- */}
        <section id="curriculum" className="section section--alt">
          <SectionHeader eyebrow="커리큘럼" headline="2026년 8월 24일 개강." intro="1년 동안 두 학기와 방학 캠프, 그리고 졸업 프로젝트로 이어집니다." />
          <div id="curriculum-annual" className="viewer wide-column">
            <div className="viewer__stage">
              <div className="timeline" aria-hidden="true">
                <div className="timeline__months">
                  {months.map((m, i) => <span key={i}>{m}월</span>)}
                </div>
                <div className="timeline__bars">
                  {stages.map((s, i) => (
                    <span
                      key={s.name}
                      className={`timeline__bar${stage === i ? ' is-active' : ''}`}
                      style={{ gridColumn: `${Math.floor(s.start) + 1} / ${Math.ceil(s.end) + 1}` }}
                    />
                  ))}
                </div>
              </div>
              <div className="viewer__detail" aria-live="polite">
                <Text typography="Caption" color="secondary">{stages[stage].period}</Text>
                <Text as="h3" typography="Headline">{stages[stage].name}</Text>
                <Text typography="Intro" color="secondary">{stages[stage].body}</Text>
              </div>
            </div>
            <ul className="viewer__controls" role="tablist" aria-label="연간 구조">
              {stages.map((s, i) => (
                <li key={s.name}>
                  <button type="button" role="tab" aria-selected={stage === i} className="control-pill typo-label" onClick={() => setStage(i)}>
                    <span className="control-pill__icon" aria-hidden="true" />
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- 주요 수업 ---------- */}
        <section id="courses" className="section">
          <SectionHeader
            eyebrow="주요 수업"
            headline="학습 목표에 따라 다른 시수와 기간."
            intro="Phi의 코스는 일관된 시수가 아니라, 학습 목표에 따라 각기 다른 시수와 기간으로 구성됩니다. 본 주요 수업들은 1학기에 진행되는 수업들입니다."
          />
          <div className="text-column courses__filter">
            <Segmented
              label="코스 타입"
              value={filter}
              onChange={setFilter}
              options={[{ value: 'all', label: '전체' }, ...courseTypes.map((t) => ({ value: t.id, label: t.name }))]}
            />
          </div>
          {visibleTypes.map((type) => (
            <div key={type.id} id={`type-${type.id}`} className="course-type">
              <div className="text-column course-type__head">
                <Text as="h3" typography="Title">{type.name}</Text>
                <Text typography="Body" color="secondary">{type.cadence} · {type.courses.length}개 수업</Text>
                <Text typography="Body" color="secondary" className="course-type__body">{type.body}</Text>
              </div>
              <Gallery label={`${type.name} 수업`}>
                {type.courses.map((course) => (
                  <GalleryItem key={course.slug}>
                    <CourseCard course={course} onOpen={() => setOpenCourse(course)} />
                  </GalleryItem>
                ))}
              </Gallery>
            </div>
          ))}
        </section>

        {/* ---------- 수업 장치 (FAQ accordion) ---------- */}
        <section id="devices" className="section section--alt">
          <SectionHeader
            eyebrow="수업을 관통하는 접근"
            headline="전문가의 사고 과정을 관찰하는 여섯 가지 장치."
            intro="Phi의 교육은 인지적 도제(Cognitive Apprenticeship)를 토대로 설계되었습니다."
          />
          <div className="text-column">
            <Accordion items={devices.map((d) => ({ id: d.name, title: d.name, content: <Text typography="Body">{d.body}</Text> }))} />
          </div>
        </section>

        {/* ---------- 주간 시간표 ---------- */}
        <section id="week" className="section">
          <SectionHeader
            eyebrow="주간 시간표"
            headline="매주 월–금, 전일제 오프라인."
            intro="화, 수, 목은 오전-오후 풀타임으로 진행되며 월, 금은 학기 수업 스케줄에 따라 유동적으로 진행됩니다."
          />
          <div className="text-column">
            <div className="week-card">
              <div className="table-scroll">
                <table className="week">
                  <thead>
                    <tr>
                      <th scope="col"><span className="visually-hidden">시간</span></th>
                      {weekdays.map((d) => <th key={d} scope="col" className="typo-label">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(['am', 'pm'] as const).map((slot) => (
                      <tr key={slot}>
                        <th scope="row" className="typo-caption color-secondary">{slot === 'am' ? '10:00–13:00' : '15:00–18:00'}</th>
                        {timetable.map((day, i) => (
                          <td key={i}>
                            {day[slot] ? <span className="week__cell typo-caption">{day[slot]}</span> : <span className="visually-hidden">없음</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <a className="text-link typo-body" href="https://www.phi.design/lab-pdf/timetable-monthly" target="_blank" rel="noreferrer">1학기 일정 자세히보기 ›</a>
          </div>
        </section>

        {/* ---------- 방학 + 캠프 ---------- */}
        <section id="camp" className="section section--alt">
          <SectionHeader
            eyebrow="방학 + 캠프"
            headline="4개월의 루틴에서 벗어나."
            intro="휴식과 함께 진행되는 워크숍 프로그램. 캠프는 별도 비용 없이 희망자 모두 참석할 수 있습니다."
          />
          <Gallery label="방학 + 캠프">
            {camps.map((c) => (
              <GalleryItem key={c.name}>
                <article className="tile">
                  <Text typography="Caption" color="secondary">{c.partner}</Text>
                  <Text as="h3" typography="Eyebrow" className="tile__title">{c.name}</Text>
                  <Text typography="Body" color="secondary">{c.body}</Text>
                </article>
              </GalleryItem>
            ))}
          </Gallery>
        </section>

        {/* ---------- 수료 & 졸업 ---------- */}
        <section id="graduation" className="section">
          <SectionHeader eyebrow="수료 & 졸업" headline="외부에 실제로 발표 또는 출시." />
          <div className="duo wide-column">
            <article className="duo__card">
              <Text as="h3" typography="Eyebrow">수료</Text>
              <Text typography="Body" color="secondary">2026년 8월부터 2027년 6월까지 예정된 모든 수업을 이수한 상태.</Text>
            </article>
            <article className="duo__card">
              <Text as="h3" typography="Eyebrow">졸업</Text>
              <Text typography="Body" color="secondary">수료 조건 달성 후, 2027년 7–8월에 본인의 목표에 따른 프로젝트를 완성합니다. 해당 프로젝트는 외부에 실제로 발표 또는 출시되어야 합니다.</Text>
            </article>
            <article id="career" className="duo__card duo__card--dark">
              <Text typography="Caption" color="inverse">채용 연계</Text>
              <Text as="h3" typography="Eyebrow" color="inverse">토스 별도 채용 전형</Text>
              <Text typography="Body" color="inverse">2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.</Text>
            </article>
            <article className="duo__card duo__card--dark">
              <Text typography="Caption" color="inverse">채용 연계</Text>
              <Text as="h3" typography="Eyebrow" color="inverse">우수 졸업자 입사 특전</Text>
              <Text typography="Body" color="inverse">우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.</Text>
            </article>
          </div>
          <div className="text-column cta-row">
            <Button size="lg">오픈 알림 신청</Button>
            <Text typography="Footnote" color="tertiary">*채용 특전의 세부 내용은 현재 검토 중입니다.</Text>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="footer">
        <div className="text-column">
          <Text typography="Footnote" color="tertiary">
            파이인스티튜트오브디자인 · 02-556-8461 · contact@phi.design · 평일 10:00 - 18:00 (점심시간 13:00 - 14:00)
          </Text>
          <Text typography="Footnote" color="tertiary" className="footer__legal">
            © 2026 Phi Institute of Design · <a href="#system" className="text-link">Design System</a>
          </Text>
        </div>
      </footer>

      {/* ---------- Course modal ---------- */}
      <Modal open={openCourse !== null} onClose={() => setOpenCourse(null)} labelledBy="course-modal-title">
        {openCourse && (
          <div className="course-modal">
            <Text typography="Caption" color="secondary">{openType?.name} · {openType?.cadence}</Text>
            <Text as="h2" id="course-modal-title" typography="Headline">{openCourse.en}</Text>
            <Text typography="Intro" color="secondary">{openCourse.ko}</Text>
            <Text typography="Eyebrow" as="p" className="course-modal__lead">{openCourse.lead}</Text>
            <Text typography="Body">{openCourse.body}</Text>
            <Text typography="Caption" color="secondary">역량 · {openCourse.tags.join(', ')}</Text>
            <a className="text-link typo-body" href={`https://www.phi.design/programs/courses/${openCourse.slug}`} target="_blank" rel="noreferrer">Course Profile 보기 ›</a>
          </div>
        )}
      </Modal>
    </>
  );
}
