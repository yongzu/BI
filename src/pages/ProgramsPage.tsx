import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Text } from '../components/Text/Text';
import { Toc, type TocItem } from '../components/Toc/Toc';
import { AnnualTimeline } from '../components/AnnualTimeline/AnnualTimeline';
import { CourseExplorer } from '../components/CourseExplorer/CourseExplorer';
import { BlurReveal } from '../components/BlurReveal/BlurReveal';
import { ApplyButton } from '../components/ApplyButton/ApplyButton';
import { HeroRipple, type RippleControl } from '../components/HeroRipple/HeroRipple';
import { HeroLogo3D } from '../components/HeroLogo3D/HeroLogo3D';
import { BackToTop, SiteHeader } from '../components/SiteHeader/SiteHeader';
import { courseProfiles } from '../data/courseProfiles';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { scrollToTarget } from '../smoothScroll';
import type { Pillar } from '../data/programs';
import {
  attitudes,
  competencies,
  courseTypes,
  applyPeriod,
  devices,
  deviceGroups,
  facts,
  heroMore,
  heroStatement,
  months,
  stages,
} from '../data/programs';
import './programs.css';

const toc: TocItem[] = [
  // 목차는 섹션 다섯 개를 한 층위로 — 역량과 태도의 하위 항목은 없애고, 수업을 관통하는 접근은
  // 커리큘럼 아래에서 빼 같은 층위로(사용자 지시 2026-09-30)
  { id: 'overview', label: '과정 개요' }, // 맨 위(사용자 지시 2026-10-04)
  { id: 'pillars', label: '역량과 태도' },
  { id: 'curriculum-annual', label: '연간 구조' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'devices', label: '수업을 관통하는 접근' },
  { id: 'career', label: '채용 연계' },
];

/** Blocks that rise in on scroll */
// 히어로는 첫 화면 순서(흐린 제목 → 맑아짐 → 소개 · 기간)를 따로 가지므로 떠오르는 등장에서 뺀다
const revealTargets = ['.section-header > *', '.group-label', '.group__lead', '.course-explorer', '.pillar-row', '.annual', '.device-group__head', '.device-card'].join(', ');

/* ------------------------------------------------------------------ */

/** Section title (64) + lead (28, 70%) — 제목 위, 리드 아래(사용자 지시 2026-10-05: 왼 → 오 → 아래로 읽는 피로를 덜게) */
function SectionHeader({ title, lead }: { title: ReactNode; lead?: string }) {
  return (
    <header className="section-header">
      <Text typography="Heading">{title}</Text>
      {lead && <Text typography="Lead" color="secondary">{lead}</Text>}
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
 * 줄 목록 — 역량과 태도가 쓴다(사용자 지시 2026-09-30). 줄에는 번호 · 제목 · 보조 문구만 두고, 누르면 설명이
 * 0fr → 1fr로 펼쳐진다. 한 줄을 누르면 묶음 전체(양쪽 단)가 함께 여닫힌다(사용자 지시 2026-10-05) — 열림 상태는
 * RowColumns가 갖는다. 커리큘럼 수업 줄처럼 선 없는 흰 면 — 호버하면 회색 면 + 글이 오른쪽으로 살짝 들어가
 * 누를 수 있음을 알린다(사용자 지시 2026-10-04). 호버만으로는 펼치지 않는다.
 * `onToggle`이 없으면 드롭다운 없이 설명까지 늘 보이는 정적 목록(채용 연계, 사용자 지시 2026-10-05).
 * `start`는 번호를 이어 매기기 위한 값 — 오른쪽 목록이 왼쪽 목록 다음 번호부터 센다.
 */
type RowItem = { id: string; title: string; sub?: string; body: ReactNode };

/**
 * 펼치면서 누른 박스를 화면 세로 가운데로(사용자 지시 2026-10-05). 펼침(0.48초)이 끝나길 기다리지 않고 누르는 순간
 * 펼친 뒤의 자리를 미리 계산해 함께 움직인다: 각 칸이 늘어날 높이 = 접힌 칸 안 내용의 높이(scrollHeight),
 * 누른 박스 위(같은 세로 줄)에서 늘어나는 칸만큼 박스가 내려가고, 박스 자신은 제 칸만큼 길어진다.
 * 박스가 화면에 다 안 들어가면(위아래 88px 제외) 목차처럼 위 88px에 맞춘다.
 */
function centerOnOpen(target: HTMLElement, scope: HTMLElement, clipSelector: string) {
  const t = target.getBoundingClientRect();
  let above = 0;
  let own = 0;
  scope.querySelectorAll<HTMLElement>(clipSelector).forEach((clip) => {
    const grow = clip.scrollHeight - clip.clientHeight;
    if (grow <= 0) return;
    if (target.contains(clip)) { own += grow; return; }
    const r = clip.getBoundingClientRect();
    if (r.left < t.right && r.right > t.left && r.bottom <= t.top + 1) above += grow;
  });
  const top = window.scrollY + t.top + above;
  const height = t.height + own;
  const y = height > window.innerHeight - 2 * 88 ? top - 88 : top + height / 2 - window.innerHeight / 2;
  scrollToTarget(Math.max(0, y));
}

/** 설명 한 개 — 글이면 본문 문단, 아니면 그대로 */
const renderBody = (body: ReactNode) => (typeof body === 'string' ? <Text typography="Body" color="secondary">{body}</Text> : body);

/**
 * `group`: 같은 묶음의 모든 줄(양쪽 단 포함). 펼친 칸에 묶음의 설명을 모두 겹쳐 두어 높이를 가장 긴 설명에 맞춘다
 */
function RowList({ items, start = 0, group = items, open, onToggle }: { items: RowItem[]; start?: number; group?: RowItem[]; open: boolean; onToggle?: (row: HTMLElement | null) => void }) {
  return (
    <div className="pillar-list" data-static={!onToggle}>
      {items.map((item, i) => {
        const panelId = `row-${item.id}`;
        const lead = (
          <span className="pillar-row__lead">
            <Text as="span" typography="Label" color="tertiary">{String(start + i + 1).padStart(2, '0')}</Text>
            <span className="pillar-row__titles">
              <Text as="span" typography="Title">{item.title}</Text>
              {item.sub && <Text as="span" typography="Label" color="tertiary">{item.sub}</Text>}
            </span>
          </span>
        );
        return (
          <article key={item.id} className="pillar-row" data-pinned={open}>
            {onToggle ? (
              <button type="button" className="pillar-row__hit" aria-expanded={open} aria-controls={panelId} onClick={(e) => onToggle(e.currentTarget.closest<HTMLElement>('.pillar-row'))}>
                {lead}
              </button>
            ) : (
              <div className="pillar-row__hit">{lead}</div>
            )}
            <div id={panelId} className="pillar-row__panel" role="region" aria-label={item.title}>
              <div className="pillar-row__clip">
                <div className="pillar-row__body">
                  {group.map((o) => (
                    <div key={o.id} className="pillar-row__text" data-ghost={o.id !== item.id} aria-hidden={o.id !== item.id}>
                      {renderBody(o.body)}
                    </div>
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

const pillarRows = (items: Pillar[]): RowItem[] => items.map((p) => ({ id: p.en.replace(/\s+/g, '-').toLowerCase(), title: p.ko, sub: p.en, body: p.body }));

/**
 * 수업을 관통하는 접근 — 묶음(관찰 · 성찰 · 확장)마다 머리글을 위에, 박스 두 개를 아래에(사용자 지시 2026-10-05:
 * 커리큘럼 유형 머리글처럼 위아래로 — 왼쪽에 두면 페이지 레이아웃과 어긋난다). 박스마다 붙던 배우는 자리 태그는
 * 머리글 메타로 옮겼다. 박스에는 번호 · 장치 이름 · 결과 한 줄만
 * 보이고, 누르면 설명이 펼쳐진다(0fr → 1fr, 한 번 누르면 전체가 함께). 닫힌 박스는 작게, 펼친 박스는 설명이 가장 긴
 * 박스 크기로 모두 같다. 열린 설명을 눌러도 닫힌다 — 역량과 태도 목록과 같은 조작.
 * 회색 면 없는 흰 박스, 호버하면 회색 면 + 글이 오른쪽으로 살짝(사용자 지시 2026-10-04).
 */
function DeviceGrid({ items, groups }: { items: { name: string; tag: string; body: string }[]; groups: typeof deviceGroups }) {
  // 한 박스를 누르면 여섯 박스가 함께 여닫힌다(사용자 지시 2026-10-05)
  const [open, setOpen] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  // 펼칠 때만 누른 박스를 화면 가운데로
  const toggle = (card: HTMLElement | null) => {
    if (!open && card && grid.current) centerOnOpen(card, grid.current, '.device-card__clip');
    setOpen((v) => !v);
  };
  return (
    <div ref={grid} className="device-groups">
      {groups.map((g) => (
        <section key={g.tag} className="device-group" aria-labelledby={`device-group-${g.en.toLowerCase()}`}>
          <header className="device-group__head">
            <div className="device-group__title">
              <h4 id={`device-group-${g.en.toLowerCase()}`} className="device-group__name">{g.name} <span className="device-group__en">{g.en}</span></h4>
              <span className="device-group__meta">{g.meta}</span>
            </div>
            <Text typography="Body" color="secondary" className="device-group__body">{g.body}</Text>
          </header>
          <div className="grid-devices">
      {items.map((d, i) => {
        if (d.tag !== g.tag) return null;
        const panelId = `device-panel-${i}`;
        return (
          <article key={d.name} className="device-card" data-pinned={open}>
            <button type="button" className="device-card__hit" aria-expanded={open} aria-controls={panelId} onClick={(e) => toggle(e.currentTarget.closest<HTMLElement>('.device-card'))}>
              {/* 호버하면 글 묶음(.device-card__lead)이 오른쪽으로 살짝 들어간다 */}
              <span className="device-card__lead">
                <span className="device-card__topline">
                  <Text as="span" typography="Label" color="inherit" className="device-card__badge">{String(i + 1).padStart(2, '0')}</Text>
                </span>
                <Text as="h4" typography="Title" className="device-card__name">{d.name}</Text>
                {deviceOutcomes[d.name] && <Text as="span" typography="Label" color="tertiary">{deviceOutcomes[d.name]}</Text>}
              </span>
            </button>
            <div id={panelId} className="device-card__panel" role="region" aria-label={d.name} onClick={() => toggle(null)}>
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
        </section>
      ))}
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
function RowColumns({ columns, numbering = 'continue', collapsible = true }: { columns: { id?: string; label?: string; items: RowItem[] }[]; numbering?: 'continue' | 'restart'; collapsible?: boolean }) {
  const group = columns.flatMap((col) => col.items); // 양쪽 단의 줄 — 펼친 높이를 같게
  // 한 줄을 누르면 양쪽 단 전체가 함께 여닫힌다(사용자 지시 2026-10-05). 접지 않는 목록은 늘 펼침
  const [open, setOpen] = useState(!collapsible);
  const root = useRef<HTMLDivElement>(null);
  // 펼칠 때만 누른 줄을 화면 가운데로
  const toggle = collapsible
    ? (row: HTMLElement | null) => {
      if (!open && row && root.current) centerOnOpen(row, root.current, '.pillar-row__clip');
      setOpen((v) => !v);
    }
    : undefined;
  return (
    <div ref={root} className="pillar-columns">
      {columns.map((col, c) => {
        const from = numbering === 'continue' ? columns.slice(0, c).reduce((n, prev) => n + prev.items.length, 0) : 0;
        return (
          <div key={col.id ?? c} id={col.id} className="pillar-column">
            {col.label && <GroupLabel>{col.label}</GroupLabel>}
            <RowList items={col.items} start={from} group={group} open={open} onToggle={toggle} />
          </div>
        );
      })}
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

/**
 * 과정 개요(히어로 다음, 목차 맨 위): 왼쪽 소개 글 두 문단, 오른쪽 과정 개요.
 * 한 화면 높이를 차지하고 내용은 세로 가운데 — 가운데 두면 위아래 다른 섹션이 보이지 않는다(사용자 지시 2026-10-04).
 * 버튼 없이, 내용 자리(블록 가운데)가 화면 아래 15% 선 위로 올라오면 높이 0fr → 1fr로 한 번 펼쳐진다.
 * 움직임 줄이기면 처음부터 펼침
 */
function HeroMore() {
  const [open, setOpen] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panel.current;
    if (!el || open) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setOpen(true);
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open]);
  return (
    <section id="overview" className="hero-more container" data-open={open} aria-label="과정 개요">
      <div ref={panel} className="hero-more__panel">
        <div className="hero-more__inner">
          <div className="hero-more__text">
            <Text as="p" typography="Label" className="hero-more__head">1 Year Programs</Text>
            {heroMore.map((p) => (
              <Text key={p.slice(0, 12)} typography="Body" color="secondary" className="hero-more__para">{p}</Text>
            ))}
          </div>
          <div className="hero-more__facts">
            <Text as="p" typography="Label" className="hero-more__head">과정 개요</Text>
            <dl>
              {facts.map((f) => (
                <div key={f.label} className="hero-more__row">
                  <Text as="dt" typography="Label" color="tertiary">{f.label}</Text>
                  <Text as="dd" typography="Body">{f.value}</Text>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function ProgramsPage() {
  useScrollReveal(revealTargets);
  // 첫 화면: 흐린 'Programs'와 지원하기만 → 제목이 맑아지면 소개 · 지원 기간(사용자 지시 2026-10-04)
  const [introDone, setIntroDone] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // 3D 로고가 X자가 될 때마다 글자를 일렁이게 한다(사용자 지시 2026-10-05)
  const rippleCtl = useRef<RippleControl | null>(null);

  return (
    <>
      <SiteHeader />
      <BackToTop />
      <main className="page">
        {/* ---------- Hero ---------- */}
        <section className="hero container" aria-labelledby="hero-title" data-intro={introDone ? 'done' : INTRO_STYLE === 'together' ? 'rise' : 'blur'} data-intro-style={INTRO_STYLE}>
          {/* 첫 화면(한 화면 높이, 내용 세로 가운데) — '자세히 보기'는 그 아래 200px(사용자 지시 2026-10-04) */}
          <div className="hero__atf">
            {/* phi.design 히어로의 3D Φ 로고 — 'Programs' 위, 제목과 함께 떠오른다(사용자 지시 2026-10-05) */}
            <HeroLogo3D onPose={() => rippleCtl.current?.ripple()} />
            {/* 제목은 'Programs' 한 단어(사용자 지시 2026-10-03) */}
            <Text id="hero-title" typography="Display" className="hero__title">
              Programs
            </Text>
            {/* 소개: 큰 글씨 두 줄 + 설명 한 문장, 단어마다 블러에서 떠오른다(사용자 지시 2026-10-03) */}
            <BlurReveal lines={heroStatement.lines} typography="Subheading" headingClassName="hero__statement" className="hero__intro" show={INTRO_STYLE === 'together' || introDone}>
              <Text typography="Intro" color="secondary">{heroStatement.body}</Text>
            </BlurReveal>

            {/* 과정 개요 대신 지원 기간 + 지원하기 — 토스뱅크 디자인 채용 히어로를 따름(사용자 지시 2026-10-03) */}
            <div className="hero__apply">
              <Text typography="Label" className="hero__period">{applyPeriod.label}</Text>
              <ApplyButton href={applyPeriod.href}>지원하기</ApplyButton>
            </div>
          </div>

          {/* 6초마다 파동이 글자를 일렁이게 한다 — 토스뱅크 디자인 채용 히어로를 따름(사용자 지시 2026-10-03) */}
          <HeroRipple introStyle={INTRO_STYLE} onIntroEnd={() => setIntroDone(true)} controlRef={rippleCtl} />
        </section>

        {/* 목차는 히어로 다음, '역량과 태도'부터 나온다(사용자 지시 2026-10-04) — 히어로는 화면 정가운데.
            레일이 섹션들과 함께 시작해 읽는 동안 붙어 있다가 푸터 앞에서 놓아준다 */}
        <div className="page-shell">
        <div className="toc-rail">
          <Toc items={toc} />
        </div>

        {/* ---------- 과정 개요 — 한 화면 높이 가운데, 스크롤해 보이면 펼쳐진다(사용자 지시 2026-10-04) ---------- */}
        <HeroMore />

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
            {/* '핵심 수업 장치' 라벨은 묶음 머리글(관찰 · 성찰 · 확장)이 대신한다(2026-10-05) */}
            <DeviceGrid items={devices} groups={deviceGroups} />
          </div>
        </section>

        {/* ---------- 채용 연계 ---------- */}
        <section id="career" className="section section--last container">
          <SectionHeader title="채용 연계" lead="Phi의 1년제 프로그램 졸업자들은 토스의 별도 채용 전형에 지원할 수 있습니다." />
          {/* 역량과 태도와 같은 두 단 목록: 왼쪽 채용 전형 · 오른쪽 입사 특전 — 드롭다운 없이 내용까지 바로(사용자 지시 2026-10-05) */}
          <div className="group">
            <GroupLabel>with Toss</GroupLabel>
            <RowColumns collapsible={false} columns={[{ items: careerRows.slice(0, 1) }, { items: careerRows.slice(1) }]} />
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
      </footer>
    </>
  );
}
