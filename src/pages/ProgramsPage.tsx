import { useEffect, useState } from 'react';
import { Text } from '../components/Text/Text';
import { AnnualTimeline } from '../components/AnnualTimeline/AnnualTimeline';
import { CourseExplorer } from '../components/CourseExplorer/CourseExplorer';
import { ApplyButton } from '../components/ApplyButton/ApplyButton';
import GradientASCII from '../components/GradientASCII/GradientASCII';
import { BackToTop, External, SiteHeader } from '../components/SiteHeader/SiteHeader';
import { VersionLog } from '../components/VersionLog/VersionLog';
import { Philosophy } from '../components/Philosophy/Philosophy';
import { ProgramRows, type ProgramRow } from '../components/ProgramRows/ProgramRows';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import { SCROLL_REVEAL } from '../components/ScrollReveal/preset';
import { courseProfiles } from '../data/courseProfiles';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  admissions,
  attitudes,
  competencies,
  courseTypes,
  applyPeriod,
  devices,
  facts,
  heroStatement,
  philosophy,
  stages,
  type Pillar,
} from '../data/programs';
import './programs.css';

/**
 * v16(2026-10-23) — 페이지를 다시 짰다. 핵심 경험(사용자 정의 2026-10-23): "1년제 교육의 구조와 정보 전달".
 * 방문자는 긴 페이지를 훑다가 궁금한 곳에서만 깊이 들어가고, 판단이 끝나면 바로 지원한다.
 *
 * 히어로(그대로) → 교육 철학(sui.io 큰 글 단락, 지나가며 읽힌다) → 1년제 프로그램 다섯 줄(sui.io 'Sui is' 목록 배치,
 * 접힌 줄에 답 한 줄 · 누르면 펼침) → 신청 줄 → 푸터.
 * v15까지의 섹션(과정 개요 · 역량과 태도 · 커리큘럼 · 수업을 관통하는 접근 · 연간 구조 · 채용 연계)은 다섯 줄 안으로 압축했다:
 * 역량과 태도 · 커리큘럼(+ 수업 방식) · 연간 구조(+ 과정 개요) · 채용 연계 · 학비와 지원(새로, phi.design/admissions).
 * 목차 · 과정 개요 무대 · 역량 카드 무대 · 장치 지도는 이 페이지에서 뺐다(컴포넌트는 남김 — 지난 버전 사본이 쓴다).
 */

/** Blocks that rise in on scroll */
// 히어로는 첫 화면 순서(흐린 제목 → 맑아짐 → 소개 · 기간)를 따로 가지므로 떠오르는 등장에서 뺀다
const revealTargets = ['.program-row', '.apply-row'].join(', ');

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
 * 채용 연계 — v3의 두 단 줄 목록(사용자 지시 2026-10-20). 왼쪽 토스 별도 채용 전형 · 오른쪽 우수 졸업자 입사 특전.
 * 줄마다 번호 · 제목 · 보조 문구, 설명은 늘 펼쳐져 있다
 */
const careerRows: { id: string; title: string; sub: string; body: string; note?: string }[] = [
  { id: 'toss-hiring', title: '토스 별도 채용 전형', sub: '2027년 8월', body: '2027년 8월, Phi 1년제 1기 졸업자를 위한 토스의 별도 채용 전형이 마련됩니다.' },
  { id: 'toss-benefit', title: '우수 졸업자 입사 특전', sub: 'Benefit', body: '우수 졸업자에게는 채용 전형에 더해 별도의 입사 특전*이 제공됩니다.', note: '*채용 특전의 세부 내용은 현재 검토 중입니다.' },
];

function CareerRows() {
  return (
    <div className="career-columns">
      {careerRows.map((r, i) => (
        <article key={r.id} className="career-row">
          <Text as="span" typography="Label" color="tertiary" className="career-row__num">{String(i + 1).padStart(2, '0')}</Text>
          <span className="career-row__titles">
            <Text as="span" typography="Title">{r.title}</Text>
            <Text as="span" typography="Label" color="tertiary">{r.sub}</Text>
          </span>
          <div className="career-row__body">
            <Text typography="Body" color="secondary">{r.body}</Text>
            {r.note && <Text typography="Label" color="tertiary">{r.note}</Text>}
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------- 다섯 줄 안의 내용 ---------- */

/** 이름 · 영문 · 한 줄 칸 목록(역량 · 태도) */
function PillarItems({ items }: { items: Pillar[] }) {
  return (
    <ul className="pr-items">
      {items.map((p) => (
        <li key={p.en} className="pr-item">
          <span className="pr-item__name">{p.ko}</span>
          <span className="pr-item__en">{p.en}</span>
          <span className="pr-item__body">{p.summary}</span>
        </li>
      ))}
    </ul>
  );
}

const courseCount = courseTypes.filter((t) => !t.extra).reduce((n, t) => n + t.courses.length, 0);

const programRows: ProgramRow[] = [
  {
    id: 'pillars',
    title: '역량과 태도',
    summary: '역량 5 · 태도(Phi OS) 5',
    content: (
      <div className="pr-block">
        <div className="pr-group">
          <h3 className="pr-group__label">역량</h3>
          <PillarItems items={competencies} />
        </div>
        <div className="pr-group">
          <h3 className="pr-group__label">태도 · Phi OS</h3>
          <PillarItems items={attitudes} />
        </div>
      </div>
    ),
  },
  {
    id: 'curriculum',
    title: '커리큘럼',
    summary: `1학기 ${courseCount}개 수업 · 워크숍 · 행사`,
    content: (
      <div className="pr-block">
        <CourseExplorer types={courseTypes} profiles={courseProfiles} />
        {/* 수업을 관통하는 접근(v15까지 따로 섹션)을 커리큘럼 아래 한 덩어리로 */}
        <div className="pr-group">
          <h3 className="pr-group__label">수업 방식</h3>
          <p className="pr-group__note">인지적 도제(Cognitive Apprenticeship)를 토대로, 전문가의 사고 과정을 능동적으로 관찰하는 장치들이 모든 수업을 관통합니다.</p>
          <ul className="pr-items">
            {devices.map((d) => (
              <li key={d.name} className="pr-item">
                <span className="pr-item__name">{d.name}</span>
                <span className="pr-item__en">{d.tag}</span>
                <span className="pr-item__body">{deviceOutcomes[d.name]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'annual',
    title: '연간 구조',
    summary: '1년 · 월–금 전일제 · 약 1,000시간',
    content: (
      <div className="pr-block">
        {/* 과정 개요(v15까지 따로 섹션) — 얼마나 걸리는지 먼저. 아래 일정은 1기 기준(v17 — 학비와 지원 줄의 2기 일정과 헷갈렸다) */}
        <p className="pr-group__note">아래 일정은 1기(2026년 8월 개강) 기준입니다.</p>
        <dl className="pr-facts">
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <AnnualTimeline stages={stages} />
      </div>
    ),
  },
  {
    id: 'career',
    title: '채용 연계',
    summary: '토스 별도 채용 전형',
    content: (
      <div className="pr-block">
        <CareerRows />
      </div>
    ),
  },
  {
    id: 'admissions',
    title: '학비와 지원',
    summary: '연 1,200만원 · 학력 · 전공 · 나이 무관',
    content: (
      <div className="pr-block">
        <p className="pr-group__note">{admissions.opens}</p>
        <div className="pr-group">
          <h3 className="pr-group__label">학비</h3>
          <dl className="pr-facts">
            {admissions.tuition.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="pr-group">
          <h3 className="pr-group__label">지원 자격</h3>
          <ul className="pr-items">
            {admissions.eligibility.map((e) => (
              <li key={e.title} className="pr-item">
                <span className="pr-item__name">{e.title}</span>
                <span className="pr-item__body">{e.body}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pr-group">
          <h3 className="pr-group__label">지원 절차</h3>
          <ol className="pr-steps">
            {admissions.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <a className="link pr-link" href={admissions.link.href} target="_blank" rel="noreferrer">
            {admissions.link.label} <External />
          </a>
        </div>
      </div>
    ),
  },
];

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
      <SiteHeader cta={{ href: applyPeriod.href, label: applyPeriod.cta }} />
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
              {/* v15(2026-10-23): 모집 상태를 먼저 · 진하게, 지난 모집 기간은 그 아래 보조로 — 기간이 더 눈에 띄어 지금 모집 중으로 읽혔다 */}
              <Text typography="Label" className="hero__period">
                <span className="hero__status">{applyPeriod.status}</span>
                <span className="hero__dates">모집 기간 {applyPeriod.label}</span>
              </Text>
              <ApplyButton href={applyPeriod.href}>{applyPeriod.cta}</ApplyButton>
            </div>
          </div>

        </section>

        {/* ---------- 교육 철학 — sui.io 큰 글 단락(사용자 시안 2026-10-23) ---------- */}
        <Philosophy label={philosophy.label} paragraphs={philosophy.paragraphs} />

        {/* ---------- 1년제 프로그램 — sui.io 'Sui is' 목록 배치, 다섯 줄 ---------- */}
        <ProgramRows label="1년제 프로그램" rows={programRows} />

        {/* ---------- 신청 줄 — 판단이 끝나면 바로 다음 행동으로(v15 맨 끝 신청 줄) ---------- */}
        <section className="apply-section" aria-label="지원">
          <div className="apply-row">
            <Text typography="Title" className="apply-row__status">{applyPeriod.status}</Text>
            <div className="apply-row__actions">
              <ApplyButton href={applyPeriod.href}>{applyPeriod.cta}</ApplyButton>
              <a className="link apply-row__link" href="https://www.phi.design/admissions" target="_blank" rel="noreferrer">
                모집 안내 <External />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 화면 폭 전체, 회색 면(사용자 시안 2026-10-23) */}
      <footer className="footer">
        <Text typography="Title">Phi Institute of Design</Text>
        <Text typography="Body" color="secondary">파이인스티튜트오브디자인 · 02-556-8461 · contact@phi.design</Text>
        <Text typography="Label" color="tertiary">
          평일 10:00 - 18:00 (점심시간 13:00 - 14:00) · © 2026 Phi Institute of Design · <a href="#system" className="link">Design System</a>
        </Text>
        {/* 지난 버전 페이지로 — 맨 아래(사용자 지시 2026-10-14). 번호와 핵심 변경만, 기본으로 접힘(v15) */}
        <VersionLog />
      </footer>
    </>
  );
}
