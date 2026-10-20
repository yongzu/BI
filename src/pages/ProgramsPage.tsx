import { useEffect, useState, type ReactNode } from 'react';
import { Text } from '../components/Text/Text';
import { Toc, type TocItem } from '../components/Toc/Toc';
import { AnnualTimeline } from '../components/AnnualTimeline/AnnualTimeline';
import { CourseExplorer } from '../components/CourseExplorer/CourseExplorer';
import { ApplyButton } from '../components/ApplyButton/ApplyButton';
import GradientASCII from '../components/GradientASCII/GradientASCII';
import { BackToTop, SiteHeader } from '../components/SiteHeader/SiteHeader';
import { VersionLog } from '../components/VersionLog/VersionLog';
import { SkillReveal } from '../components/SkillReveal/SkillReveal';
import { DeviceMap } from '../components/DeviceMap/DeviceMap';
import { OverviewReveal } from '../components/OverviewReveal/OverviewReveal';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import { SCROLL_REVEAL } from '../components/ScrollReveal/preset';
import { courseProfiles } from '../data/courseProfiles';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  attitudes,
  competencies,
  courseTypes,
  applyPeriod,
  devices,
  facts,
  heroMore,
  heroStatement,
  stages,
} from '../data/programs';
import './programs.css';

const toc: TocItem[] = [
  // 목차는 섹션 다섯 개를 한 층위로 — 역량과 태도의 하위 항목은 없애고, 수업을 관통하는 접근은
  // 커리큘럼 아래에서 빼 같은 층위로(사용자 지시 2026-09-30)
  { id: 'overview', label: '과정 개요' }, // 맨 위(사용자 지시 2026-10-04)
  { id: 'curriculum-annual', label: '연간 구조' }, // 과정 개요 바로 아래(사용자 지시 2026-10-19)
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'pillars', label: '역량과 태도' }, // 커리큘럼 아래(사용자 지시 2026-10-19). 역량 · Phi OS를 합침(2026-10-20)
  { id: 'devices', label: '수업을 관통하는 접근' },
  { id: 'career', label: '채용 연계' }, // 맨 아래(사용자 지시 2026-10-19)
];

/** Blocks that rise in on scroll */
// 히어로는 첫 화면 순서(흐린 제목 → 맑아짐 → 소개 · 기간)를 따로 가지므로 떠오르는 등장에서 뺀다
// 섹션 제목 · 리드는 ScrollReveal이 맡으므로 뺐다(2026-10-20)
const revealTargets = ['.group-label', '.group__lead', '.course-explorer', '.career-card', '.history', '.device-map'].join(', ');

/* ------------------------------------------------------------------ */

/**
 * Section title + lead — 제목 위 · 리드 아래.
 * 제목 · 리드 모두 react-bits ScrollReveal(enter · 단어마다 흐림 10px → 또렷, 사용자 지시 2026-10-20) — 예전엔 제목이 줄마다
 * 아래에서 올라왔다(.rise-line). 리드의 의도한 줄바꿈은 글 속 
으로(ScrollReveal은 글을 단어로 나누므로 <br />을 쓰지 않는다).
 */
function SectionHeader({ title, lead }: { title: string | string[]; lead?: string }) {
  const text = typeof title === 'string' ? title : title.join(' ');
  return (
    <header className="section-header">
      <ScrollReveal as="h2" containerClassName="section-header__title typo-heading color-primary sr-plain" {...SCROLL_REVEAL}>{text}</ScrollReveal>
      {lead && <ScrollReveal as="p" containerClassName="typo-lead color-secondary sr-plain" {...SCROLL_REVEAL}>{lead}</ScrollReveal>}
    </header>
  );
}

/** Group label — 왼쪽 세로 막대는 없앴다(사용자 지시 2026-10-03) */
function GroupLabel({ children, meta }: { children: ReactNode; meta?: string }) {
  return (
    <div className="group-label">
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
 * 채용 연계(v7, 2026-10-19) — 카드 두 장. 시점(2027.08)과 대상을 크게, 설명은 아래.
 * v6까지는 역량과 태도와 같은 두 단 줄 목록이었다. 줄 목록이 사라지며 숫자를 앞세운 카드로(토스 홈 10의 큰 숫자)
 */
const careerCards = [
  { label: '토스 별도 채용 전형', big: '2027.08', sub: 'Phi 1년제 1기 졸업자', body: '2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.' },
  { label: '우수 졸업자 입사 특전', big: 'Benefit', sub: '채용 전형에 더해', body: '우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.', note: '*채용 특전의 세부 내용은 현재 검토 중입니다.' },
];

function CareerCards() {
  return (
    <div className="career-cards">
      {careerCards.map((c, i) => (
        <article key={c.label} className="career-card" data-tone={i === 0 ? 'ink' : 'light'}>
          <Text as="p" typography="Label" color="inherit" className="career-card__label">{c.label}</Text>
          <Text as="p" typography="Heading" color="inherit" className="career-card__big">{c.big}</Text>
          <Text as="p" typography="Meta" color="inherit" className="career-card__sub">{c.sub}</Text>
          <Text typography="Body" color="inherit" className="career-card__body">{c.body}</Text>
          {c.note && <Text as="p" typography="Caption" color="inherit" className="career-card__note">{c.note}</Text>}
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * 히어로 첫 화면 방식(사용자 지시 2026-10-04):
 * 'together' — 'Programs' · 소개 · 설명 · 지원 기간이 함께 떠올라 전체가 4.2초 동안 일렁이고, 이어서 지원하기 · 자세히 보기
 * 'sequence' — 이전 방식(따로 남겨 둠): 제목만 떠올라 일렁인 뒤 소개(단어마다 블러) → 지원 기간 → 지원하기 차례로
 */
const INTRO_STYLE: 'together' | 'sequence' = 'together';
/** 히어로 글자가 나오기 시작하는 시각(초) — GradientASCII 인트로(INTRO_SECONDS 2.4)가 끝날 때 */
const HERO_TEXT_AT = 2.4;

/* ------------------------------------------------------------------ */

export function ProgramsPage() {
  useScrollReveal(revealTargets);
  // 첫 화면: 배경(GradientASCII)의 인트로(빛이 퍼지며 글자가 풀림, 2.4초)가 끝난 뒤 글자들이 ScrollReveal로 나온다
  // (사용자 지시 2026-10-20). 그동안 글자는 숨겨 두고(data-intro), 끝나면 드러내며 단어마다 흐림 → 또렷
  const [introDone, setIntroDone] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (introDone) return;
    const t = window.setTimeout(() => setIntroDone(true), HERO_TEXT_AT * 1000);
    return () => window.clearTimeout(t);
  }, [introDone]);

  return (
    <>
      <SiteHeader />
      <BackToTop />
      <main className="page">
        {/* ---------- Hero ---------- (v9의 포인터 깊이 · 스크롤 포털은 v10에서 뺐다 — 사용자 지시 2026-10-19) */}
        <section className="hero container" aria-labelledby="hero-title" data-intro={introDone ? 'done' : INTRO_STYLE === 'together' ? 'rise' : 'blur'} data-intro-style={INTRO_STYLE}>
          {/* 배경: react-bits GradientASCII(사용자 지시 2026-10-20, 주소의 값 그대로) — 물방울 파동 · 3D Φ 로고 대신.
              화면 폭 전체 · 히어로 높이, 글자 뒤. 마우스가 지나가면 그 자리 글자가 잠깐 뒤섞인다 */}
          <div className="hero__bg" aria-hidden="true">
            <GradientASCII
              colors={['#919191', '#ffffff', '#dfdfdf', '#bfbfbf']}
              shape="horizon"
              characters=" 01" /* 글자는 0과 1만(사용자 지시 2026-10-20, 이전 P · H · I) */
              randomGlyphs /* 밝기 순서로 고르면 거의 1만 나와서, 0과 1을 고르게 섞는다 */
              cellSize={15}
              density={0.5}
              glyphOpacity={0.5}
              depthOfField={0.08}
              flicker={0.13}
              softness={0.8}
              scale={1.35}
              flow={0.3}
              speed={0.9}
              gradientOpacity={0}
              grain={0.05}
              scrambleRadius={0.02}
              clickEffect="none"
              lightMode
            />
          </div>
          {/* 첫 화면(한 화면 높이, 내용 세로 가운데) — '자세히 보기'는 그 아래 200px(사용자 지시 2026-10-04) */}
          <div className="hero__atf">
            {/* 제목은 'Programs' 한 단어(사용자 지시 2026-10-03). 제목 · 소개는 배경 인트로 뒤에 ScrollReveal로(2026-10-20) */}
            <ScrollReveal as="h1" id="hero-title" containerClassName="hero__title typo-display color-primary sr-plain" {...SCROLL_REVEAL} delay={HERO_TEXT_AT}>
              Programs
            </ScrollReveal>
            {/* 소개: 큰 글씨 두 줄 + 설명 한 문장 */}
            <div className="hero__intro">
              <ScrollReveal as="p" containerClassName="hero__statement typo-title color-primary sr-plain" {...SCROLL_REVEAL} delay={HERO_TEXT_AT + 0.15}>
                {heroStatement.lines.join('\n')}
              </ScrollReveal>
              <div className="blur-reveal__body">
                <ScrollReveal as="p" containerClassName="typo-lead color-secondary sr-plain" {...SCROLL_REVEAL} delay={HERO_TEXT_AT + 0.3}>
                  {heroStatement.body}
                </ScrollReveal>
              </div>
            </div>

            {/* 과정 개요 대신 지원 기간 + 지원하기 — 토스뱅크 디자인 채용 히어로를 따름(사용자 지시 2026-10-03) */}
            {/* v6: 기간 옆에 모집 상태를 글자로(파동이 기간 줄을 캔버스로 다시 그리므로 배지 면 대신 흐린 글자) */}
            <div className="hero__apply">
              <Text typography="Label" className="hero__period">
                {applyPeriod.label}<span className="hero__status"> · {applyPeriod.status}</span>
              </Text>
              <ApplyButton href={applyPeriod.href}>{applyPeriod.cta}</ApplyButton>
            </div>
          </div>

        </section>

        {/* 목차는 히어로 다음, '역량과 태도'부터 나온다(사용자 지시 2026-10-04) — 히어로는 화면 정가운데.
            레일이 섹션들과 함께 시작해 읽는 동안 붙어 있다가 푸터 앞에서 놓아준다 */}
        <div className="page-shell">
        <div className="toc-rail">
          <Toc items={toc} />
        </div>

        {/* ---------- 과정 개요 — 화면 폭 네 칸, 스크롤에 맞춰 차례로 떠오른다(vectrfl.com, 사용자 지시 2026-10-19).
            왼쪽 두 칸 소개 글 · 오른쪽 두 칸 과정 개요 다섯 줄 ---------- */}
        <OverviewReveal id="overview" title="1 Year Programs" paragraphs={heroMore} factsTitle="과정 개요" facts={facts} />

        {/* ---------- 연간 구조 — 과정 개요 바로 아래, 화면 폭 전체(사용자 지시 2026-10-19) ---------- */}
        <section id="curriculum-annual" className="section section--wide">
          <SectionHeader
            title="연간 구조"
            lead="2026년 8월 개강부터 2027년 8월 졸업까지, 두 학기와 방학 캠프, 졸업 프로젝트로 이어지는 1년입니다."
          />
          {/* v7: 위 시기 패널 · 아래 진행 바(toss.im/company History). v6의 안내 표 문구는 시기마다 왼쪽 사실로 옮겼다 */}
          <AnnualTimeline stages={stages} />
        </section>

        {/* ---------- 커리큘럼 ---------- */}
        {/* 화면 폭 전체(사용자 지시 2026-10-20, v14) */}
        <section id="curriculum" className="section section--wide">
          {/* 리드는 첫 문장 뒤에서 줄을 바꾼다(사용자 지시 2026-10-20) */}
          <SectionHeader title="커리큘럼" lead={'상기된 역량을 중심으로 설계된 1학기 수업들입니다.\n2학기는 1학기의 성취에 따라 학습 효과를 보완, 증폭할 수 있는 방향으로 준비됩니다.'} />

          {/* 필터 · 수업 목록 · 상세를 한 화면에 — 클릭 없이 전체를 파악한다 */}
          <div id="courses" className="group">
            <CourseExplorer types={courseTypes} profiles={courseProfiles} />
          </div>
        </section>

        {/* ---------- 배우는 역량 — 커리큘럼 아래(사용자 지시 2026-10-19) ---------- */}
        <section id="pillars" className="section container">
          {/* v11: toss.im "상품 판매와 정산" 연출 — 큰 옅은 글씨가 검정으로 채워지고, 작아지며 위로, 화면 폭 카드 다섯 장이 올라온다 */}
          {/* 역량과 태도를 합쳤다(사용자 지시 2026-10-20) — 역량 다섯 장 아래 Phi OS(태도) 다섯 장 */}
          <SkillReveal
            title="역량과 태도"
            lead="어떤 환경에서도 스스로 답을 찾을 수 있는 사고방식을 만들기 위해, Phi는 다섯 가지 역량을 기르고 다섯 가지 태도(Phi OS)를 중요시합니다. 수업과 장치는 이 역량을 기르고 태도를 연습하는 자리입니다."
            groups={[{ label: '역량', items: competencies }, { label: 'Phi OS', items: attitudes }]}
          />
        </section>

        {/* ---------- 수업을 관통하는 접근 ---------- */}
        {/* 다른 화면 폭 섹션과 같은 폭 · 제목 한 줄(사용자 지시 2026-10-20) */}
        <section id="devices" className="section section--wide">
          <SectionHeader
            title="수업을 관통하는 접근"
            lead={'Phi의 교육은 인지적 도제(Cognitive Apprenticeship)를 토대로 설계되었습니다.\n전문가의 사고 과정을 학습자가 능동적으로 관찰할 수 있도록 다양한 장치가 준비되어있습니다.'}
          />
          {/* 두 단 목록을 시험해 본 뒤 박스로 되돌림(사용자 지시 2026-09-30) */}
          <div className="group">
            {/* '핵심 수업 장치' 라벨은 배우는 자리 라벨 셋이 대신한다(2026-10-05) */}
            <DeviceMap items={devices} outcomes={deviceOutcomes} />
          </div>
        </section>

        {/* ---------- 채용 연계 — 맨 아래(사용자 지시 2026-10-19). 마지막의 마무리 블록(히어로 문장 · 기간 · 버튼)은 뺐다 ---------- */}
        <section id="career" className="section section--last container">
          <SectionHeader title="채용 연계" lead="Phi의 1년제 프로그램 졸업자들은 토스의 별도 채용 전형에 지원할 수 있습니다." />
          {/* v7: 카드 두 장 — 시점 · 대상을 크게 */}
          <div className="group">
            <GroupLabel>with Toss</GroupLabel>
            <CareerCards />
          </div>
        </section>

        </div>
      </main>

      <footer className="footer container">
        <Text typography="Title">Phi Institute of Design</Text>
        <Text typography="Body" color="secondary">파이인스티튜트오브디자인 · 02-556-8461 · contact@phi.design</Text>
        <Text typography="Label" color="tertiary">
          평일 10:00 - 18:00 (점심시간 13:00 - 14:00) · © 2026 Phi Institute of Design · <a href="#system" className="link">Design System</a>
        </Text>
        {/* 지난 버전 페이지로 — 맨 아래(사용자 지시 2026-10-14) */}
        <VersionLog />
      </footer>
    </>
  );
}
