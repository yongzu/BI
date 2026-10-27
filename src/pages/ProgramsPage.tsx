import { useEffect, useState, type CSSProperties } from 'react';
import { Text } from '../components/Text/Text';
import { Toc, type TocItem } from '../components/Toc/Toc';
import { AnnualTimeline } from '../components/AnnualTimeline/AnnualTimeline';
import { CourseExplorer } from '../components/CourseExplorer/CourseExplorer';
import { ApplyButton } from '../components/ApplyButton/ApplyButton';
import { HeroMark, MOVE_MS, SETTLE_AT } from '../components/HeroMark/HeroMark';
import { CareerReveal } from '../components/CareerReveal/CareerReveal';
import { BackToTop, SiteHeader } from '../components/SiteHeader/SiteHeader';
import { FooterMark } from '../components/FooterMark/FooterMark';
import { PillarList, type PillarItem } from '../components/PillarList/PillarList';
import { CurriculumEntry } from '../components/CurriculumEntry/CurriculumEntry';
import { Philosophy } from '../components/Philosophy/Philosophy';
import { VectorHandoff } from '../components/VectorWord/VectorHandoff';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import { SCROLL_REVEAL } from '../components/ScrollReveal/preset';
import { courseProfiles } from '../data/courseProfiles';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  attitudes,
  competencies,
  courseTypes,
  applyPeriod,
  approachGroups,
  devices,
  heroStatement,
  philosophy,
  stages,
} from '../data/programs';
import './programs.css';

/**
 * v18(사용자 지시 2026-10-23): v15 그대로에서 두 가지만 —
 * ① 과정 개요(OverviewReveal) 자리를 v17의 교육 철학(한 화면 한 단락)으로 바꾼다.
 * ② 목차는 v3의 오른쪽 위 세로 목차(글자 + 미끄러지는 회색 면). 교육 철학은 목차에 넣지 않고 역량과 태도부터.
 */
const toc: TocItem[] = [
  // 목차는 섹션 다섯 개를 한 층위로 — 역량과 태도의 하위 항목은 없애고, 수업을 관통하는 접근은
  // 커리큘럼 아래에서 빼 같은 층위로(사용자 지시 2026-09-30)
  // 순서는 페이지 섹션과 같다(사용자 지시 2026-10-23)
  { id: 'pillars', label: '역량과 태도' }, // 맨 위(v18 — 교육 철학은 목차에 넣지 않는다). 역량 · Phi OS를 합침(2026-10-20)
  { id: 'curriculum', label: '커리큘럼' }, // 수업을 관통하는 접근은 커리큘럼 탭 안으로 옮겨 목차에서 뺐다(사용자 지시 2026-10-27)
  { id: 'curriculum-annual', label: '연간 구조' },
  { id: 'career', label: '채용 연계' }, // 맨 아래(사용자 지시 2026-10-19)
];

/** Blocks that rise in on scroll */
// 히어로는 첫 화면 순서(흐린 제목 → 맑아짐 → 소개 · 기간)를 따로 가지므로 떠오르는 등장에서 뺀다
// 섹션 제목 · 리드는 ScrollReveal이 맡으므로 뺐다(2026-10-20)
const revealTargets = ['.group-label', '.group__lead', '.pillar-row'].join(', ');

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



/**
 * 채용 연계 — 토스 별도 채용 전형 · 우수 졸업자 입사 특전. 2026-10-27(사용자 지시): 역량과 태도와 같은 구성(PillarList)에
 * 아래에서 떠오르는 하늘색 빛(CareerReveal — toss.im/company 히어로를 뒤집음). 영문 이름은 이미지 박스 · 줄 첫 줄에 쓴다.
 * 이미지 박스 · 묶음 이름 없이 줄만(2026-10-27).
 * v7 ~ v14는 카드 두 장, v3 ~ v22는 두 단 줄 목록이었다
 */
const careerItems: PillarItem[] = [
  { en: 'Toss Hiring Track', ko: '토스 별도 채용 전형', body: '2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.' },
  { en: 'Graduate Benefit', ko: '우수 졸업자 입사 특전', body: '우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.', note: '*채용 특전의 세부 내용은 현재 검토 중입니다.' },
];


/* ------------------------------------------------------------------ */

/** 히어로 글자가 나오기 시작하는 시각(초) — 예전엔 GradientASCII 인트로(2.4초)가 끝날 때였다.
 *  2026-10-27(사용자 지시 — 로고가 먼저 나오고 그 아래 내용이 나온다): Φ 마크(HeroMark)가 위로 거의 다 올라왔을 때.
 *  내용은 위에서 아래로 차례로(소개 → 설명 → 기간 → 지원하기), 흐림 없이 떠오른다(programs.css .hero-seq) */
const HERO_TEXT_AT = (SETTLE_AT + MOVE_MS * 0.6) / 1000;

/* ------------------------------------------------------------------ */

export function ProgramsPage() {
  useScrollReveal(revealTargets);
  // 첫 화면: Φ 마크(HeroMark)가 화면 가운데에서 재생된 뒤 조금 위 제자리로 올라가면 내용이 위에서부터 차례로 나온다.
  // 그동안 내용은 숨겨 둔다(data-intro='rise' → 'done')
  const [introDone, setIntroDone] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (introDone) return;
    const t = window.setTimeout(() => setIntroDone(true), HERO_TEXT_AT * 1000);
    return () => window.clearTimeout(t);
  }, [introDone]);

  return (
    <>
      <SiteHeader cta={{ href: applyPeriod.href, label: applyPeriod.cta }} />
      <BackToTop />
      <main className="page">
        {/* ---------- Hero ---------- (v9의 포인터 깊이 · 스크롤 포털은 v10에서 뺐다 — 사용자 지시 2026-10-19) */}
        <section className="hero container" aria-labelledby="hero-title" data-intro={introDone ? 'done' : 'rise'}>
          {/* 배경 GradientASCII(2026-10-20 ~ 10-27)는 뺐다(사용자 지시 2026-10-27) — 흰 바탕 위에 Φ 마크 → 내용 차례로 */}
          {/* 첫 화면(한 화면 높이, 내용 세로 가운데) — '자세히 보기'는 그 아래 200px(사용자 지시 2026-10-04) */}
          <div className="hero__atf">
            {/* Φ 마크: 화면 가운데에서 재생된 뒤 크기 그대로 이 자리로 조금 올라온다(사용자 지시 2026-10-27) */}
            <HeroMark />
            {/* 제목 'Programs'는 화면에서 뺐다(사용자 지시 2026-10-27 — 큰 글씨 제거). 읽기 도구용 제목으로만 남긴다 */}
            <h1 id="hero-title" className="visually-hidden">Programs</h1>
            {/* 소개: 큰 글씨 두 줄 + 설명 한 문장 */}
            {/* 위에서 아래로 차례로(--i), 흐림 없이(사용자 지시 2026-10-27 — 예전엔 ScrollReveal로 단어마다 흐림 → 또렷) */}
            <div className="hero__intro">
              <p className="hero__statement typo-title color-primary hero-seq" style={{ '--i': 0 } as CSSProperties}>
                {heroStatement.lines.join('\n')}
              </p>
              <p className="hero__body typo-lead color-secondary hero-seq" style={{ '--i': 1 } as CSSProperties}>
                {heroStatement.body}
              </p>
            </div>

            {/* 과정 개요 대신 지원 기간 + 지원하기 — 토스뱅크 디자인 채용 히어로를 따름(사용자 지시 2026-10-03) */}
            {/* v6: 기간 옆에 모집 상태를 글자로(파동이 기간 줄을 캔버스로 다시 그리므로 배지 면 대신 흐린 글자) */}
            <div className="hero__apply">
              {/* v15(2026-10-23): 모집 상태를 먼저 · 진하게, 기간은 그 아래 보조로. 2026-10-27(사용자 지시): 상태('1기 모집 중')는 빼고 기간만 */}
              <Text typography="Label" className="hero__period hero-seq" style={{ '--i': 2 } as CSSProperties}>
                <span className="hero__dates">모집 기간 {applyPeriod.label}</span>
              </Text>
              <div className="hero-seq" style={{ '--i': 3 } as CSSProperties}>
                <ApplyButton href={applyPeriod.href}>{applyPeriod.cta}</ApplyButton>
              </div>
            </div>
          </div>

        </section>

        {/* ---------- 교육 철학 — v18: 과정 개요 자리에 v17의 한 화면 한 단락(sui.io 큰 글). 목차 레일 밖이라 이 동안 목차는 숨어 있다 ---------- */}
        <Philosophy title={philosophy.title} paragraphs={philosophy.paragraphs} />
        {/* 교육 철학 → 역량과 태도: 마지막 단락의 [역량과 태도] 벡터 낱말이 상자째 내려가 섹션 제목이 된다(사용자 지시 2026-10-24) */}
        <VectorHandoff targetSelector="#pillars .section-header__title" />

        {/* 목차는 '역량과 태도'부터 나온다(사용자 지시 2026-10-04 · 10-23) — 레일이 역량과 태도와 함께 시작해 읽는 동안 붙어 있다가 푸터 앞에서 놓아준다.
            v18: v3의 오른쪽 위 세로 목차 */}
        <div className="page-shell">
        <div className="toc-rail">
          <Toc items={toc} />
        </div>

        {/* 섹션 순서(사용자 지시 2026-10-23): 과정 개요 → 역량과 태도 → 커리큘럼 → 수업을 관통하는 접근 → 연간 구조 → 채용 연계 */}

        {/* ---------- 역량과 태도 — 과정 개요 바로 아래(사용자 지시 2026-10-23, 예전엔 커리큘럼 아래) ---------- */}
        <section id="pillars" className="section section--wide">{/* 화면 폭 섹션 — 다른 섹션과 같은 양옆 여백(사용자 지시 2026-10-24) */}
          {/* toss.im/company '일하는 방식이 곧 성공 전략' 형식(사용자 지시 2026-10-24) — 왼쪽 붙는 이미지 박스(비움) · 오른쪽
              묶음 제목 아래 01–05 줄. 예전 v11–v14 SkillReveal(큰 글씨 채움 · 가로로 흐르는 카드 열 장)은 바꿨다 */}
          <SectionHeader
            title="역량과 태도"
            lead={'어떤 환경에서도 스스로 답을 찾을 수 있는 사고방식을 만들기 위해, Phi는 다섯 가지 역량을 기르고 다섯 가지 태도(Phi OS)를 중요시합니다.\n수업과 장치는 이 역량을 기르고 태도를 연습하는 자리입니다.'} /* '중요시합니다.' 뒤에서 줄을 바꾼다(사용자 지시 2026-10-24) */
          />
          <PillarList groups={[{ label: '역량', sub: 'Competency', items: competencies }, { label: '태도', sub: 'Phi OS', items: attitudes }]} />
        </section>

        {/* ---------- 커리큘럼 ---------- */}
        {/* 화면 폭 전체(사용자 지시 2026-10-20, v14) */}
        <section id="curriculum" className="section section--wide">
          {/* 들어가는 길(사용자 지시 2026-10-24): 큰 과목 분류 릴이 저절로 굴러가다 줄어들며 왼쪽 탭으로 */}
          <CurriculumEntry types={courseTypes}>
            {/* 섹션 제목 · 리드를 과목 분류 머리글 자리에 되살렸다(사용자 지시 2026-10-25) — 분류 이름 · 설명은 고른 탭 아래로 옮겼다(CourseExplorer) */}
            <SectionHeader
              title="커리큘럼"
              lead={'상기된 역량을 중심으로 설계된 1학기 수업들입니다.\n2학기는 1학기의 성취에 따라 학습 효과를 보완, 증폭할 수 있는 방향으로 준비됩니다.'}
            />
            {/* 필터 · 수업 목록 · 상세를 한 화면에 — 클릭 없이 전체를 파악한다 */}
            <div id="courses" className="group">
              <CourseExplorer types={courseTypes} profiles={courseProfiles} approaches={approachGroups} devices={devices} />
            </div>
          </CurriculumEntry>
        </section>


        {/* ---------- 연간 구조 — 수업을 관통하는 접근 다음, 채용 연계 앞(사용자 지시 2026-10-23, 예전엔 과정 개요 바로 아래). 화면 폭 전체 ---------- */}
        <section id="curriculum-annual" className="section section--wide">
          <SectionHeader
            title="연간 구조"
            lead="2026년 8월 개강부터 2027년 8월 졸업까지, 두 학기와 방학 캠프, 졸업 프로젝트로 이어지는 1년입니다."
          />
          {/* 채용 연계와 같은 줄 형식 + 왼쪽 세로 진행 막대(사용자 지시 2026-10-27). 예전엔 왼쪽 붙는 시기 목록(10-24), 그 전엔 가로로 넘기는 탭 */}
          <AnnualTimeline stages={stages} />
        </section>

        {/* ---------- 채용 연계 — 맨 아래(사용자 지시 2026-10-19). 2026-10-27: 다른 섹션처럼 제목 · 리드, 아래에서 하늘색 빛이 떠오른다 ---------- */}
        <CareerReveal
          header={<SectionHeader title="채용 연계" lead="Phi의 1년제 프로그램 졸업자들은 토스의 별도 채용 전형에 지원할 수 있습니다." />}
          items={careerItems}
        />

        </div>
      </main>

      {/* 화면 폭 전체(사용자 지시 2026-10-23) — 채용 연계 등 화면 폭 섹션과 같은 양옆 여백 */}
      <footer className="footer">
        <Text typography="Title">Phi Institute of Design</Text>
        <Text typography="Body" color="secondary">파이인스티튜트오브디자인 · 02-556-8461 · contact@phi.design</Text>
        <Text typography="Label" color="tertiary">
          평일 10:00 - 18:00 (점심시간 13:00 - 14:00) · © 2026 Phi Institute of Design · <a href="#system" className="link">Design System</a>
        </Text>
        {/* 맨 아래, 여백 없이 화면 폭에 꽉 찬 'Fundamental Over Tools' — 글자 뒤에서 카드가 떠올랐다 내려간다(사용자 지시 2026-10-27) */}
        <FooterMark />
      </footer>
    </>
  );
}
