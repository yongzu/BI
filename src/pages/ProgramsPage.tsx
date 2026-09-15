import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Text } from '../components/Text/Text';
import { Pill } from '../components/Pill/Pill';
import { Disclosure } from '../components/Disclosure/Disclosure';
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
  { id: 'pillars', label: '역량과 태도' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'courses', label: '주요 수업' },
  { id: 'devices', label: '수업 장치' },
  { id: 'week', label: '주간 시간표' },
  { id: 'camp', label: '방학 + 캠프' },
  { id: 'graduation', label: '수료 & 졸업' },
];

/** 받침 유무로 을/를 선택 */
const objectParticle = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code % 28 !== 0 ? '을' : '를';
};

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    // The active section is the last one whose top has passed 35% of the viewport.
    const update = () => {
      const line = window.innerHeight * 0.35;
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

function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % words.length), 1800);
    return () => clearInterval(t);
  }, [words.length]);
  const word = words[index];
  return (
    <span className="rotating" aria-live="off">
      <span key={word} className="rotating__word">{word}</span>
      {objectParticle(word)}
    </span>
  );
}

function SectionHeader({ index, title, children, tone = 'default' }: { index: string; title: string; children?: ReactNode; tone?: 'default' | 'inverse' }) {
  const inverse = tone === 'inverse';
  return (
    <header className="section-header">
      <Text typography="Caption2" color={inverse ? 'inverseSecondary' : 'tertiary'} className="section-header__index">{index}</Text>
      <Text as="h2" typography="Title1" color={inverse ? 'inverse' : 'primary'}>{title}</Text>
      {children && <Text typography="Body1" color={inverse ? 'inverseSecondary' : 'secondary'} className="section-header__desc">{children}</Text>}
    </header>
  );
}

function CourseTypeBlock({ type }: { type: CourseType }) {
  return (
    <section className="course-type" id={`type-${type.id}`} aria-labelledby={`type-${type.id}-title`}>
      <div className="course-type__cover">
        <Text as="h3" id={`type-${type.id}-title`} typography="Display1">{type.name}</Text>
        <div className="course-type__meta">
          <Text typography="Subtitle1">{type.cadence}</Text>
          <Text typography="Caption1" color="tertiary">{type.courses.length}개 수업</Text>
        </div>
        <Text typography="Body2" color="secondary" className="course-type__body">{type.body}</Text>
      </div>

      <ul className="course-list">
        {type.courses.map((course) => (
          <li key={course.slug}>
            <Disclosure
              summary={
                <span className="course-row">
                  <Text as="span" typography="Subtitle1" className="course-row__name">{course.en}</Text>
                  <Text as="span" typography="Body2" color="tertiary" className="course-row__ko">{course.ko}</Text>
                  <span className="course-row__tags">
                    {course.tags.map((tag) => (
                      <Text key={tag} as="span" typography="Caption1" color="secondary" className="tag">{tag}</Text>
                    ))}
                  </span>
                </span>
              }
            >
              <div className="course-detail">
                <Text as="p" typography="Title2" className="course-detail__lead">{course.lead}</Text>
                <Text typography="Body1" color="secondary" className="course-detail__body">{course.body}</Text>
                <a className="text-link typo-subtitle2" href={`https://www.phi.design/programs/courses/${course.slug}`} target="_blank" rel="noreferrer">
                  Course Profile 보기 <span aria-hidden="true">→</span>
                </a>
              </div>
            </Disclosure>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProgramsPage() {
  const ids = useMemo(() => sections.map((s) => s.id), []);
  const active = useActiveSection(ids);
  const [filter, setFilter] = useState<CourseType['id'] | 'all'>('all');
  const visibleTypes = filter === 'all' ? courseTypes : courseTypes.filter((t) => t.id === filter);
  const totalCourses = courseTypes.reduce((n, t) => n + t.courses.length, 0);

  return (
    <div className="programs">
      <header className="site-header">
        <div className="container site-header__inner">
          <a href="#top" className="site-header__logo typo-display2" aria-label="Phi Institute of Design">Phi</a>
          <nav aria-label="주요 메뉴" className="site-header__nav">
            {['About', 'Programs', 'Experts', 'Admissions'].map((item) => (
              <Text key={item} as="a" href="#top" typography="Body2" color={item === 'Programs' ? 'primary' : 'tertiary'} aria-current={item === 'Programs' ? 'page' : undefined}>{item}</Text>
            ))}
          </nav>
          <a className="button button--primary typo-subtitle2" href="#graduation">오픈 알림 신청</a>
        </div>
      </header>

      <main id="top">
        {/* ---------- Hero ---------- */}
        <section className="hero container">
          <Text typography="Subtitle1" color="tertiary">Phi Institute of Design · 1년제 프로그램</Text>
          <Text as="h1" typography="Display1" className="hero__title">Programs</Text>
          <div className="hero__intro">
            {intro.map((p, i) => (
              <Text key={i} typography={i === 0 ? 'Title3' : 'Body1'} color={i === 0 ? 'primary' : 'secondary'}>{p}</Text>
            ))}
          </div>
          <dl className="facts">
            {facts.map((f) => (
              <div key={f.label} className="facts__item">
                <Text as="dt" typography="Caption1" color="tertiary">{f.label}</Text>
                <dd>
                  <Text as="span" typography="Title1" className="facts__value">{f.value}</Text>
                  <Text as="span" typography="Body2" color="secondary">{f.note}</Text>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- Sticky chip navigation ---------- */}
        <nav className="chip-nav" aria-label="이 페이지의 섹션">
          <div className="container chip-nav__inner">
            {sections.map((s) => (
              <Pill key={s.id} selected={active === s.id} onClick={() => document.getElementById(s.id)?.scrollIntoView()}>
                {s.label}
              </Pill>
            ))}
          </div>
        </nav>

        {/* ---------- 역량과 태도 (inverse) ---------- */}
        <section id="pillars" className="band band--inverse">
          <div className="container">
            <SectionHeader index="01" title="역량과 태도" tone="inverse">
              어떤 환경에서도 스스로 답을 찾을 수 있는 사고방식을 만들기 위해, Phi는 아래 역량과 태도를 중요시합니다.
            </SectionHeader>

            <Text as="p" typography="Title1" color="inverse" className="statement">
              Phi는 <RotatingWord words={competencies.map((c) => c.ko)} /> 훈련합니다.
            </Text>

            {[{ label: '역량', en: 'Competency', items: competencies }, { label: '태도', en: 'Phi OS', items: attitudes }].map((group) => (
              <div key={group.en} className="pillars">
                <div className="pillars__label">
                  <Text as="h3" typography="Title2" color="inverse">{group.label}</Text>
                  <Text typography="Display2" color="inverseTertiary">{group.en}</Text>
                </div>
                <ol className="pillars__grid">
                  {group.items.map((item, i) => (
                    <li key={item.en} className="pillar">
                      <Text typography="Caption2" color="inverseTertiary">{String(i + 1).padStart(2, '0')}</Text>
                      <Text as="h4" typography="Title3" color="inverse">{item.ko}</Text>
                      <Text typography="Body2" color="inverseTertiary" className="pillar__en">{item.en}</Text>
                      <Text typography="Body2" color="inverseSecondary">{item.body}</Text>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 커리큘럼 ---------- */}
        <section id="curriculum" className="band container">
          <SectionHeader index="02" title="커리큘럼">1년, 두 학기와 캠프, 그리고 졸업 프로젝트로 이어집니다.</SectionHeader>
          <div className="timeline" role="img" aria-label="2026년 8월부터 2027년 8월까지의 연간 구조">
            <div className="timeline__months">
              {months.map((m, i) => (
                <Text key={i} as="span" typography="Caption1" color="tertiary">{m}월</Text>
              ))}
            </div>
            <div className="timeline__bars">
              {stages.map((s, i) => (
                <div key={s.name} className={`timeline__bar timeline__bar--${i}`} style={{ gridColumn: `${Math.floor(s.start) + 1} / ${Math.ceil(s.end) + 1}` }}>
                  <Text as="span" typography="Subtitle2" color={i % 2 === 0 ? 'inverse' : 'primary'}>{s.name}</Text>
                </div>
              ))}
            </div>
          </div>
          <ol className="stages">
            {stages.map((s, i) => (
              <li key={s.name} className="stage">
                <Text typography="Caption2" color="tertiary">{String(i + 1).padStart(2, '0')}</Text>
                <Text as="h3" typography="Title3">{s.name}</Text>
                <Text typography="Body2" color="primary">{s.period}</Text>
                <Text typography="Body2" color="secondary">{s.body}</Text>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- 주요 수업 ---------- */}
        <section id="courses" className="band container">
          <SectionHeader index="03" title="주요 수업">
            상기된 역량과 태도를 중심으로 설계된 1학기 수업들입니다. 수업은 진행 기간과 방식에 따라 네 가지 코스 타입으로 나뉩니다. 2학기는 1학기의 성취에 따라 학습 효과를 보완, 증폭할 수 있는 방향으로 준비됩니다.
          </SectionHeader>

          <div className="filter" role="group" aria-label="코스 타입 필터">
            <Pill selected={filter === 'all'} count={totalCourses} onClick={() => setFilter('all')}>전체</Pill>
            {courseTypes.map((t) => (
              <Pill key={t.id} selected={filter === t.id} count={t.courses.length} onClick={() => setFilter(t.id)}>{t.name}</Pill>
            ))}
          </div>

          {visibleTypes.map((type) => (
            <CourseTypeBlock key={type.id} type={type} />
          ))}
        </section>

        {/* ---------- 수업 장치 ---------- */}
        <section id="devices" className="band band--muted">
          <div className="container devices">
            <SectionHeader index="04" title="수업을 관통하는 접근">
              Phi의 교육은 인지적 도제(Cognitive Apprenticeship)를 토대로 설계되었습니다. 전문가의 사고 과정을 학습자가 능동적으로 관찰할 수 있도록 다양한 장치가 준비되어있습니다.
            </SectionHeader>
            <Text as="p" typography="Title2" className="formula" aria-hidden="true">
              {devices.map((d, i) => (
                <span key={d.name}>
                  {d.name}
                  {i < devices.length - 1 && <span className="formula__plus"> + </span>}
                </span>
              ))}
            </Text>
            <ul className="device-list">
              {devices.map((d) => (
                <li key={d.name}>
                  <Disclosure summary={<Text as="span" typography="Subtitle1">{d.name}</Text>}>
                    <Text typography="Body1" color="secondary" className="measure">{d.body}</Text>
                  </Disclosure>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- 주간 시간표 ---------- */}
        <section id="week" className="band container">
          <SectionHeader index="05" title="주간 시간표">
            매주 월-금 수업이 진행됩니다. 화, 수, 목은 오전-오후 풀타임으로 진행되며 월, 금은 학기 수업 스케줄에 따라 유동적으로 진행됩니다.
          </SectionHeader>
          <div className="table-scroll">
            <table className="week">
              <thead>
                <tr>
                  <th scope="col"><span className="visually-hidden">시간</span></th>
                  {weekdays.map((d) => (
                    <th key={d} scope="col"><Text as="span" typography="Title3">{d}</Text></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['am', 'pm'] as const).map((slot) => (
                  <tr key={slot}>
                    <th scope="row">
                      <Text as="span" typography="Subtitle2">{slot === 'am' ? '오전' : '오후'}</Text>
                      <Text as="span" typography="Caption1" color="tertiary">{slot === 'am' ? '10:00–13:00' : '15:00–18:00'}</Text>
                    </th>
                    {timetable.map((day, i) => (
                      <td key={i} className={day[slot] ? 'week__cell' : 'week__cell week__cell--empty'}>
                        <Text as="span" typography="Subtitle2" color={day[slot] ? 'primary' : 'disabled'}>{day[slot] ?? '—'}</Text>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a className="text-link typo-subtitle2" href="https://www.phi.design/lab-pdf/timetable-monthly" target="_blank" rel="noreferrer">
            1학기 일정 자세히보기 <span aria-hidden="true">→</span>
          </a>
        </section>

        {/* ---------- 방학 + 캠프 ---------- */}
        <section id="camp" className="band container">
          <SectionHeader index="06" title="방학 + 캠프">
            4개월의 학기 루틴에서 벗어나 휴식과 함께 진행되는 워크숍 프로그램. 각 학습자의 성취와 보완이 필요한 부분을 바탕으로 구성됩니다. 캠프는 별도 비용 없이 희망자 모두 참석할 수 있습니다.
          </SectionHeader>
          <ol className="camps">
            {camps.map((c, i) => (
              <li key={c.name} className="camp">
                <Text typography="Display2" color="tertiary">{String(i + 1).padStart(2, '0')}</Text>
                <div>
                  <Text as="h3" typography="Title3">{c.name}</Text>
                  <Text typography="Body2" color="tertiary">{c.partner}</Text>
                </div>
                <Text typography="Body1" color="secondary">{c.body}</Text>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- 수료 & 졸업 + 채용 연계 (inverse) ---------- */}
        <section id="graduation" className="band band--inverse">
          <div className="container">
            <SectionHeader index="07" title="수료 & 졸업" tone="inverse" />
            <dl className="grad">
              <div>
                <Text as="dt" typography="Title1" color="inverse">수료</Text>
                <Text as="dd" typography="Body1" color="inverseSecondary">2026년 8월부터 2027년 6월까지 예정된 모든 수업을 이수한 상태.</Text>
              </div>
              <div>
                <Text as="dt" typography="Title1" color="inverse">졸업</Text>
                <Text as="dd" typography="Body1" color="inverseSecondary">수료 조건 달성 후, 2027년 7–8월에 본인의 목표에 따른 프로젝트를 완성합니다. 해당 프로젝트는 외부에 실제로 발표 또는 출시되어야 합니다.</Text>
              </div>
            </dl>

            <div className="hiring">
              <Text as="h3" typography="Title2" color="inverse">채용 연계</Text>
              <Text typography="Body1" color="inverseSecondary">Phi의 1년제 프로그램 졸업자들은 토스의 별도 채용 전형에 지원할 수 있습니다.</Text>
              <div className="hiring__grid">
                <div>
                  <Text as="p" typography="Title1" color="inverse">토스 별도 채용 전형</Text>
                  <Text typography="Body2" color="inverseSecondary">2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.</Text>
                </div>
                <div>
                  <Text as="p" typography="Title1" color="inverse">우수 졸업자 입사 특전</Text>
                  <Text typography="Body2" color="inverseSecondary">우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.</Text>
                  <Text typography="Caption1" color="inverseTertiary">*채용 특전의 세부 내용은 현재 검토 중입니다.</Text>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Text typography="Subtitle2">파이인스티튜트오브디자인</Text>
          <Text typography="Caption1" color="tertiary">02-556-8461 · contact@phi.design · 평일 10:00 - 18:00 (점심시간 13:00 - 14:00)</Text>
          <Text typography="Caption1" color="tertiary">© 2026 Phi Institute of Design · <a href="#system" className="text-link">Design System</a></Text>
        </div>
      </footer>
    </div>
  );
}
