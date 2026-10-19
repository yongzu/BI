import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import type { Course, CourseType } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import './CourseExplorer.css';

/**
 * 커리큘럼(v6, 2026-10-19) — 왼쪽 세로 탭(타입 + 수업 수) · 오른쪽 수업 카드 · 카드를 누르면 옆 패널에 Course Profile.
 *
 * v5까지는 타입 필터 → 타입 머리글 → 수업 줄, 줄을 누르면 그 아래로 상세(약 1,300px)가 펼쳐져 다른 수업을 화면 밖으로 밀어냈다.
 * v6은 토스 채용 공고(AI · ML · Data 채용, 토스플레이스 채용)의 형식을 따른다:
 * - 세로 탭: 타입 이름 + 수업 수 — 고르기 전에 규모가 보인다. 활성 = 진한 글씨 + 왼쪽 세로 막대. ↑/↓로도 옮긴다.
 * - 카드 2열: 영문 · 한글 이름, 첫 문장, 전문가 · 기르는 역량. 카드 전체가 상세로 가는 버튼.
 * - 상세는 목록을 밀어내지 않는 옆 패널(논모달) — 목록이 그대로 보여, 다른 카드를 누르면 패널 내용만 바뀐다.
 *   패널 안 ←/→ 버튼(과 키)으로 12개 수업을 차례로, Esc나 닫기로 닫는다. 좁은 화면에선 전체 화면 시트.
 * - 섹션이 보일 때 첫 수업을 저절로 펼치던 동작은 없앴다 — 사용자가 요청할 때만 바뀐다.
 */
type Props = { types: CourseType[]; profiles: Record<string, CourseProfile> };

export function CourseExplorer({ types, profiles }: Props) {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [shownSlug, setShownSlug] = useState<string | null>(null); // 닫혀 가는 동안에도 패널에 남는 마지막 수업
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastCard = useRef<HTMLElement | null>(null);

  const all = types.flatMap((t) => t.courses.map((c) => ({ course: c, type: t })));
  const index = all.findIndex((x) => x.course.slug === shownSlug);
  const shown = index >= 0 ? all[index] : null;
  // 지금 수업은 ref로도 — 빠르게 연달아 ←/→를 눌러도 렌더 전의 값이 아니라 마지막으로 넘긴 수업에서 센다
  const slugRef = useRef<string | null>(null);
  const show = (slug: string) => { slugRef.current = slug; setOpen(slug); setShownSlug(slug); };
  const type = types[tab];

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (tab + step + types.length) % types.length;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const close = () => {
    setOpen(null);
    lastCard.current?.focus({ preventScroll: true });
  };
  // 패널에서 이웃 수업으로 넘어가면 왼쪽 탭도 그 수업의 타입으로 — 목록과 패널이 같은 수업을 가리킨다
  const go = (step: number) => {
    const at = all.findIndex((x) => x.course.slug === slugRef.current);
    const next = all[(at + step + all.length) % all.length];
    show(next.course.slug);
    setTab(types.indexOf(next.type));
  };

  return (
    <div className="course-explorer">
      <div className="course-layout">
        <div className="course-tabs" role="tablist" aria-orientation="vertical" aria-label="수업 유형" onKeyDown={onTabKey}>
          {types.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`course-tab-${t.id}`}
              aria-selected={tab === i}
              aria-controls={`course-panel-${t.id}`}
              tabIndex={tab === i ? 0 : -1}
              className="course-tab"
              onClick={() => setTab(i)}
            >
              <span className="course-tab__name">{t.name}</span>
              <span className="course-tab__count">{t.courses.length}</span>
            </button>
          ))}
          <Text as="p" typography="Caption" color="tertiary" className="course-tabs__total">1학기 수업 {all.length}개</Text>
        </div>

        <section key={type.id} id={`course-panel-${type.id}`} role="tabpanel" aria-labelledby={`course-tab-${type.id}`} className="course-tabpanel">
          <header className="course-type">
            <Text as="p" typography="Meta" className="course-type__cadence">{type.cadence}</Text>
            <Text typography="Body" color="secondary" className="course-type__body">{type.body}</Text>
          </header>
          <ul className="course-cards">
            {type.courses.map((course) => (
              <li key={course.slug}>
                <CourseCard
                  course={course}
                  profile={profiles[course.slug]}
                  active={open === course.slug}
                  onOpen={(el) => { lastCard.current = el; show(course.slug); }}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <CoursePanel
        isOpen={open !== null}
        shown={shown}
        profile={shown ? profiles[shown.course.slug] : null}
        position={index + 1}
        total={all.length}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onClose={close}
      />
    </div>
  );
}

function CourseCard({ course, profile, active, onOpen }: { course: Course; profile: CourseProfile; active: boolean; onOpen: (el: HTMLElement) => void }) {
  return (
    <button type="button" className="course-card" data-active={active} aria-haspopup="dialog" aria-controls="course-panel" onClick={(e) => onOpen(e.currentTarget)}>
      <span className="course-card__names">
        <span className="course-card__en">{course.en}</span>
        <span className="course-card__ko">{course.ko}</span>
      </span>
      <span className="course-card__lead">{course.lead}</span>
      <span className="course-card__foot">
        <span className="course-card__experts">{profile.experts.map((ex) => ex.name).join(' · ')}</span>
        <span className="course-card__tags">
          {course.tags.map((tag) => <span key={tag} className="course-card__tag">{tag}</span>)}
        </span>
      </span>
      <span className="course-card__arrow" aria-hidden="true" />
    </button>
  );
}

type PanelProps = {
  isOpen: boolean;
  shown: { course: Course; type: CourseType } | null;
  profile: CourseProfile | null;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

/**
 * 옆 패널(논모달). 닫혀도 DOM에 남아 미끄러져 나가고(그동안 마지막 수업이 보인다), 닫힌 동안은 inert.
 * 열리면 닫기 버튼으로 초점, 수업이 바뀌면 맨 위부터. Esc로 닫고, 패널 안에서 ←/→로 이웃 수업
 */
function CoursePanel({ isOpen, shown, profile, position, total, onPrev, onNext, onClose }: PanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slug = shown?.course.slug;

  useEffect(() => {
    if (isOpen) closeRef.current?.focus({ preventScroll: true });
  }, [isOpen]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [slug]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('a, input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
  };

  return (
    <div id="course-panel" className="course-panel" data-open={isOpen} role="dialog" aria-modal="false" aria-labelledby="course-panel-title" inert={!isOpen} onKeyDown={onKey}>
      <div className="course-panel__bar">
        <Text as="span" typography="Caption" color="tertiary">{position} / {total}</Text>
        <span className="course-panel__nav">
          <button type="button" className="course-panel__btn" onClick={onPrev} aria-label="이전 수업">←</button>
          <button type="button" className="course-panel__btn" onClick={onNext} aria-label="다음 수업">→</button>
          <button ref={closeRef} type="button" className="course-panel__btn" onClick={onClose} aria-label="닫기">×</button>
        </span>
      </div>
      <div ref={scrollRef} className="course-panel__scroll" data-lenis-prevent>
        {shown && profile && (
          <>
            <header className="course-panel__head">
              <Text as="p" typography="Meta" color="tertiary">{shown.type.name} · {shown.type.cadence}</Text>
              <Text as="h3" id="course-panel-title" typography="Title">{shown.course.en}</Text>
              <Text as="p" typography="Body" color="secondary">{shown.course.ko}</Text>
            </header>
            <CourseDetail course={shown.course} type={shown.type} profile={profile} />
          </>
        )}
      </div>
    </div>
  );
}

function CourseDetail({ course, type, profile }: { course: Course; type: CourseType; profile: CourseProfile }) {
  // 코스 프로필 개요의 첫 문단이 수업 목표와 같은 글인 수업이 많다 — 겹치는 문단은 개요에서 뺀다
  const overview = profile.overview.filter((p) => !p.startsWith(course.lead) && !p.includes(course.body.slice(0, 30)));

  return (
    <article className="course-detail">
      <div className="course-detail__main">
        <section className="course-detail__section">
          <h4 className="course-detail__heading">수업 목표</h4>
          <Text typography="Body" color="secondary">{course.lead} {course.body}</Text>
        </section>

        {overview.length > 0 && (
          <section className="course-detail__section">
            <h4 className="course-detail__heading">수업 개요</h4>
            {overview.map((p, i) => (
              <Text key={i} typography="Body" color="secondary">{p}</Text>
            ))}
          </section>
        )}

        <section className="course-detail__section">
          <h4 className="course-detail__heading">학습 목표</h4>
          <div className="course-goals" role="table" aria-label="학습 전후 비교">
            <div className="course-goals__row course-goals__row--head" role="row">
              <span role="columnheader">Before</span>
              <span role="columnheader">After</span>
            </div>
            {profile.after.map((after, i) => (
              <div key={i} className="course-goals__row" role="row">
                <span role="cell" className="course-goals__before">{profile.before[i]}</span>
                <span role="cell" className="course-goals__after">{after}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="course-detail__side">
        {profile.experts.map((ex) => (
          <section key={ex.name} className="course-detail__expert">
            <h4 className="course-detail__heading">{ex.name}</h4>
            <p className="course-detail__bio">{ex.bio}</p>
          </section>
        ))}
        <dl className="course-detail__facts">
          <div>
            <dt>코스 타입</dt>
            <dd>{type.name} · {type.cadence}</dd>
          </div>
          <div>
            <dt>역량</dt>
            <dd>{course.tags.join(' · ')}</dd>
          </div>
        </dl>
      </aside>
    </article>
  );
}
