import { useEffect, useState, type ReactNode } from 'react';
import { Text } from '../components/Text/Text';
import { Pill } from '../components/Pill/Pill';
import { Reveal, RevealList } from '../components/Reveal/Reveal';
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
  type CourseType,
} from '../data/programs';
import './programs.css';

const sections = [
  { id: 'overview', label: 'Programs' },
  { id: 'pillars', label: '역량과 태도' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'courses', label: '주요 수업' },
  { id: 'devices', label: '수업 장치' },
  { id: 'week', label: '주간 시간표' },
  { id: 'camp', label: '방학 + 캠프' },
  { id: 'graduation', label: '수료 & 졸업' },
];
const sectionIds = sections.map((s) => s.id);

/** The active section is the last one whose top has passed 30% of the viewport. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ids]);
  return active;
}

function Section({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <Text id={`${id}-title`} typography="Title">{title}</Text>
      {lead && <Text typography="Copy" color="secondary" className="section__lead">{lead}</Text>}
      <div className="section__body">{children}</div>
    </section>
  );
}

function CourseGroup({ type }: { type: CourseType }) {
  return (
    <div id={`type-${type.id}`} className="course-group">
      <div className="course-group__head">
        <Text typography="Label">{type.name}</Text>
        <Text as="span" typography="Body" color="secondary">{type.cadence} · {type.courses.length}개 수업</Text>
      </div>
      <Text typography="Copy" color="secondary" className="course-group__desc">{type.body}</Text>
      <RevealList>
        {type.courses.map((course) => (
          <Reveal key={course.slug} label={course.en} meta={course.ko}>
            <Text typography="Copy" color="primary">{course.lead}</Text>
            <Text typography="Copy" color="secondary">{course.body}</Text>
            <p className="course-foot">
              <Text as="span" typography="Body" color="secondary">{course.tags.join(' · ')}</Text>
              <a className="link" href={`https://www.phi.design/programs/courses/${course.slug}`} target="_blank" rel="noreferrer">
                Course Profile →
              </a>
            </p>
          </Reveal>
        ))}
      </RevealList>
    </div>
  );
}

export function ProgramsPage() {
  const active = useActiveSection(sectionIds);
  const [filter, setFilter] = useState<CourseType['id'] | 'all'>('all');
  const visibleTypes = filter === 'all' ? courseTypes : courseTypes.filter((t) => t.id === filter);
  const totalCourses = courseTypes.reduce((n, t) => n + t.courses.length, 0);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="page">
      <header className="toolbar">
        <a href="#" className="brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Text as="span" typography="Title">Phi</Text>
        </a>
        <nav className="toolbar__nav" aria-label="주요 메뉴">
          {['About', 'Programs', 'Experts', 'Admissions'].map((item) => (
            <a key={item} href="#" className="pill" aria-current={item === 'Programs' ? 'page' : undefined}>{item}</a>
          ))}
        </nav>
        <a href="#graduation" className="pill pill--end toolbar__cta" onClick={(e) => { e.preventDefault(); go('graduation'); }}>
          오픈 알림 신청
        </a>
      </header>

      <div className="app-body">
        <nav className="side-nav" aria-label="이 페이지의 섹션">
          <ul className="nav-list">
            {sections.map((s) => (
              <li key={s.id}>
                <button type="button" className={`nav-tab tab1${active === s.id ? ' active' : ''}`} onClick={() => go(s.id)}>
                  {s.label}
                </button>
                {s.id === 'courses' && (
                  <ul className="nav-list nav-list--sub">
                    {courseTypes.map((t) => (
                      <li key={t.id}>
                        <button type="button" className="nav-tab tab2" onClick={() => { setFilter('all'); requestAnimationFrame(() => go(`type-${t.id}`)); }}>
                          {t.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className="shell">
          {/* ---------- Overview ---------- */}
          <section id="overview" className="section" aria-labelledby="overview-title">
            <Text as="h1" id="overview-title" typography="Title">Programs</Text>
            <Text typography="Heading" color="secondary">Phi의 1년제 프로그램을 소개합니다.</Text>
            <div className="section__body">
              {intro.map((p, i) => (
                <Text key={i} typography="Copy" color={i === 0 ? 'primary' : 'secondary'}>{p}</Text>
              ))}
              <dl className="facts">
                {facts.map((f) => (
                  <div key={f.label} className="facts__row">
                    <Text as="dt" typography="Body" color="secondary">{f.label}</Text>
                    <Text as="dd" typography="Body">{f.value} <span className="color-secondary">{f.note}</span></Text>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* ---------- 역량과 태도 ---------- */}
          <Section id="pillars" title="역량과 태도" lead="어떤 환경에서도 스스로 답을 찾을 수 있는 사고방식을 만들기 위해, Phi는 아래 역량과 태도를 중요시합니다.">
            {[{ label: '역량', en: 'Competency', items: competencies }, { label: '태도', en: 'Phi OS', items: attitudes }].map((group) => (
              <div key={group.en} className="group">
                <Text typography="Label">{group.label} <span className="color-secondary">{group.en}</span></Text>
                <RevealList>
                  {group.items.map((item) => (
                    <Reveal key={item.en} label={item.ko} meta={item.en}>
                      <Text typography="Copy" color="secondary">{item.body}</Text>
                    </Reveal>
                  ))}
                </RevealList>
              </div>
            ))}
          </Section>

          {/* ---------- 커리큘럼 ---------- */}
          <Section id="curriculum" title="커리큘럼" lead="2026년 8월 개강부터 2027년 8월 졸업까지, 1년의 흐름입니다.">
            <div className="timeline" aria-hidden="true">
              <div className="timeline__grid">
                {months.map((m, i) => (
                  <span key={i} className="timeline__month">{m}</span>
                ))}
                {stages.map((s, i) => (
                  <span
                    key={s.name}
                    className={`timeline__bar${i % 2 ? ' timeline__bar--quiet' : ''}`}
                    style={{ gridColumn: `${Math.floor(s.start) + 1} / ${Math.ceil(s.end) + 1}` }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <RevealList>
              {stages.map((s) => (
                <Reveal key={s.name} label={s.name} meta={s.period}>
                  <Text typography="Copy" color="secondary">{s.body}</Text>
                </Reveal>
              ))}
            </RevealList>
          </Section>

          {/* ---------- 주요 수업 ---------- */}
          <Section
            id="courses"
            title="주요 수업"
            lead="상기된 역량과 태도를 중심으로 설계된 1학기 수업들입니다. 2학기는 1학기의 성취에 따라 학습 효과를 보완, 증폭할 수 있는 방향으로 준비됩니다."
          >
            <div className="filter" role="group" aria-label="코스 타입 필터">
              <Pill className="pill--start" selected={filter === 'all'} count={totalCourses} onClick={() => setFilter('all')}>전체</Pill>
              {courseTypes.map((t) => (
                <Pill key={t.id} selected={filter === t.id} count={t.courses.length} onClick={() => setFilter(t.id)}>{t.name}</Pill>
              ))}
            </div>
            {visibleTypes.map((type) => (
              <CourseGroup key={type.id} type={type} />
            ))}
          </Section>

          {/* ---------- 수업 장치 ---------- */}
          <Section
            id="devices"
            title="수업을 관통하는 접근"
            lead="Phi의 교육은 인지적 도제(Cognitive Apprenticeship)를 토대로 설계되었습니다. 전문가의 사고 과정을 학습자가 능동적으로 관찰할 수 있도록 다양한 장치가 준비되어있습니다."
          >
            <RevealList>
              {devices.map((d) => (
                <Reveal key={d.name} label={d.name}>
                  <Text typography="Copy" color="secondary">{d.body}</Text>
                </Reveal>
              ))}
            </RevealList>
          </Section>

          {/* ---------- 주간 시간표 ---------- */}
          <Section
            id="week"
            title="주간 시간표"
            lead="매주 월-금 수업이 진행됩니다. 화, 수, 목은 오전-오후 풀타임으로 진행되며 월, 금은 학기 수업 스케줄에 따라 유동적으로 진행됩니다."
          >
            <div className="table-scroll">
              <table className="week">
                <thead>
                  <tr>
                    <th scope="col"><span className="visually-hidden">시간</span></th>
                    {weekdays.map((d) => <th key={d} scope="col">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(['am', 'pm'] as const).map((slot) => (
                    <tr key={slot}>
                      <th scope="row">{slot === 'am' ? '10:00–13:00' : '15:00–18:00'}</th>
                      {timetable.map((day, i) => (
                        <td key={i}>
                          {day[slot] ? <span className="week__cell">{day[slot]}</span> : <span className="visually-hidden">없음</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a className="link" href="https://www.phi.design/lab-pdf/timetable-monthly" target="_blank" rel="noreferrer">1학기 일정 자세히보기 →</a>
          </Section>

          {/* ---------- 방학 + 캠프 ---------- */}
          <Section
            id="camp"
            title="방학 + 캠프"
            lead="4개월의 학기 루틴에서 벗어나 휴식과 함께 진행되는 워크숍 프로그램. 캠프는 별도 비용 없이 희망자 모두 참석할 수 있습니다."
          >
            <RevealList>
              {camps.map((c) => (
                <Reveal key={c.name} label={c.name} meta={c.partner}>
                  <Text typography="Copy" color="secondary">{c.body}</Text>
                </Reveal>
              ))}
            </RevealList>
          </Section>

          {/* ---------- 수료 & 졸업 ---------- */}
          <Section id="graduation" title="수료 & 졸업">
            <dl className="facts">
              <div className="facts__row">
                <Text as="dt" typography="Body" color="secondary">수료</Text>
                <Text as="dd" typography="Copy">2026년 8월부터 2027년 6월까지 예정된 모든 수업을 이수한 상태.</Text>
              </div>
              <div className="facts__row">
                <Text as="dt" typography="Body" color="secondary">졸업</Text>
                <Text as="dd" typography="Copy">수료 조건 달성 후, 2027년 7–8월에 본인의 목표에 따른 프로젝트를 완성합니다. 해당 프로젝트는 외부에 실제로 발표 또는 출시되어야 합니다.</Text>
              </div>
            </dl>
            <div className="group">
              <Text typography="Label">채용 연계</Text>
              <Text typography="Copy" color="secondary">Phi의 1년제 프로그램 졸업자들은 토스의 별도 채용 전형에 지원할 수 있습니다.</Text>
              <dl className="facts">
                <div className="facts__row">
                  <Text as="dt" typography="Body" color="secondary">토스 별도 채용 전형</Text>
                  <Text as="dd" typography="Copy">2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.</Text>
                </div>
                <div className="facts__row">
                  <Text as="dt" typography="Body" color="secondary">우수 졸업자 입사 특전</Text>
                  <Text as="dd" typography="Copy">
                    우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.
                    <span className="block color-secondary">*채용 특전의 세부 내용은 현재 검토 중입니다.</span>
                  </Text>
                </div>
              </dl>
            </div>
          </Section>
        </main>
      </div>

      <footer className="site-footer">
        <p className="color-primary">파이인스티튜트오브디자인</p>
        <p>02-556-8461 · contact@phi.design</p>
        <p>평일 10:00 - 18:00 (점심시간 13:00 - 14:00)</p>
        <p>© 2026 Phi Institute of Design · <a href="#system" className="link">Design System</a></p>
      </footer>
    </div>
  );
}
