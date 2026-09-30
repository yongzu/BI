import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Text } from '../Text/Text';
import type { Course, CourseType } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import './CourseExplorer.css';

/**
 * 주요 수업들 — 클릭하지 않아도 전체를 파악할 수 있는 목록 + 상세(사용자 지시 2026-09-30).
 * 세로 3단: ① 수업 목록 · ② 수업 목표 · 개요 · 학습 목표 · ③ 전문가 · 코스 정보.
 * - 필터(전체 · 타입별)를 고르면 첫 수업이 선택된 채로 상세가 바로 보인다.
 * - 목록에 마우스를 올리거나(잠깐 머물면) 누르면 그 수업으로 바뀐다. 떠나도 되돌아가지 않아
 *   오른쪽 상세로 옮겨 가며 읽을 수 있다. 키보드는 ↑↓ · Home · End.
 * - 필터에 걸린 수업들의 상세를 한 칸에 겹쳐 두고 고른 것만 보인다 — 상세 박스 높이가 가장 긴
 *   수업에 맞춰 고정되어 수업을 바꿔도 아래 내용이 들썩이지 않고, 바뀔 때는 서로 교차해 사라지고 떠오른다.
 * 예전 코스 카드 + 코스 프로필 패널을 대신한다(패널은 완전히 없앰, 사용자 지시 2026-09-30).
 */
export type ExplorerEntry = { course: Course; type: CourseType; profile: CourseProfile };

type Props = { types: CourseType[]; profiles: Record<string, CourseProfile> };

const HOVER_INTENT_MS = 90; // 목록 위를 스쳐 지나갈 때는 바꾸지 않는다

export function CourseExplorer({ types, profiles }: Props) {
  const [filter, setFilter] = useState<'all' | CourseType['id']>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  const entries: ExplorerEntry[] = types
    .filter((t) => filter === 'all' || t.id === filter)
    .flatMap((type) => type.courses.map((course) => ({ course, type, profile: profiles[course.slug] })));
  // 필터가 바뀌어 고른 수업이 목록에 없으면 첫 수업을 보여 준다
  const active = entries.find((e) => e.course.slug === selected) ?? entries[0];

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const choose = (slug: string) => {
    window.clearTimeout(hoverTimer.current);
    setSelected(slug);
  };
  const hover = (slug: string, pointerType: string) => {
    if (pointerType !== 'mouse') return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setSelected(slug), HOVER_INTENT_MS);
  };

  const onListKey = (e: KeyboardEvent) => {
    const i = entries.findIndex((x) => x === active);
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: entries.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = entries[(next + entries.length) % entries.length];
    choose(target.course.slug);
    listRef.current?.querySelector<HTMLElement>(`[data-slug="${target.course.slug}"]`)?.focus();
  };

  return (
    <div className="course-explorer">
      <div className="segmented" role="tablist" aria-label="수업 유형">
        {[{ id: 'all' as const, name: '전체' }, ...types].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={filter === t.id}
            className="segmented__tab"
            onClick={() => { setFilter(t.id); setSelected(null); }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="course-explorer__body">
        {/* ① 수업 목록 */}
        <div ref={listRef} className="course-list" role="tablist" aria-orientation="vertical" aria-label="수업" onKeyDown={onListKey} data-lenis-prevent-horizontal>
          {entries.map((e, i) => {
            const isActive = e === active;
            // 타입이 바뀌기 직전 수업(전체 보기의 3 · 6 · 10번째) — 아래 여백을 두 배로 벌려 타입을 나눈다
            const endsGroup = i < entries.length - 1 && entries[i + 1].type !== e.type;
            return (
              <button
                key={e.course.slug}
                type="button"
                role="tab"
                id={`course-tab-${e.course.slug}`}
                aria-selected={isActive}
                aria-controls={`course-detail-${e.course.slug}`}
                tabIndex={isActive ? 0 : -1}
                data-slug={e.course.slug}
                data-group-end={endsGroup || undefined}
                className="course-list__item"
                onPointerEnter={(ev) => hover(e.course.slug, ev.pointerType)}
                onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
                onClick={() => choose(e.course.slug)}
              >
                <span className="course-list__name">{e.course.en}</span>
                <span className="course-list__meta">{e.course.ko} · {e.type.name}</span>
              </button>
            );
          })}
        </div>

        {/* ②③ 상세 — 필터에 걸린 수업을 모두 겹쳐 두고 고른 것만 보인다 */}
        <div className="course-detail-stack">
          {entries.map((e) => (
            <CourseDetail key={e.course.slug} entry={e} active={e === active} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseDetail({ entry: { course, type, profile }, active }: { entry: ExplorerEntry; active: boolean }) {
  // 코스 프로필 개요의 첫 문단이 수업 목표와 같은 글인 수업이 많다 — 겹치는 문단은 개요에서 뺀다
  const overview = profile.overview.filter((p) => !p.startsWith(course.lead) && !p.includes(course.body.slice(0, 30)));

  return (
    <article
      id={`course-detail-${course.slug}`}
      className="course-detail"
      role="tabpanel"
      aria-labelledby={`course-tab-${course.slug}`}
      data-active={active}
      aria-hidden={!active}
      inert={!active}
    >
      {/* ② 수업 내용 */}
      <div className="course-detail__main">
        <header className="course-detail__head">
          <Text as="h4" typography="Title">{course.en}</Text>
          <Text as="span" typography="Label" color="tertiary">{course.ko}</Text>
        </header>

        <section className="course-detail__section">
          <h5 className="course-detail__heading">수업 목표</h5>
          <Text typography="Body" color="secondary">{course.lead} {course.body}</Text>
        </section>

        {overview.length > 0 && (
          <section className="course-detail__section">
            <h5 className="course-detail__heading">수업 개요</h5>
            {overview.map((p, i) => (
              <Text key={i} typography="Body" color="secondary">{p}</Text>
            ))}
          </section>
        )}

        <section className="course-detail__section">
          <h5 className="course-detail__heading">학습 목표</h5>
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

      {/* ③ 전문가 · 코스 정보 */}
      <aside className="course-detail__side">
        {profile.experts.map((ex) => (
          <section key={ex.name} className="course-detail__expert">
            <h5 className="course-detail__heading">{ex.name}</h5>
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

        <a className="link typo-label course-detail__source" href={`https://www.phi.design/programs/courses/${course.slug}`} target="_blank" rel="noreferrer">
          phi.design에서 원문 보기 →
        </a>
      </aside>
    </article>
  );
}
