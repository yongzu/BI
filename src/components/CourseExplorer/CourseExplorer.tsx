import { useEffect, useRef, useState } from 'react';
import { Text } from '../Text/Text';
import type { Course, CourseType } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import './CourseExplorer.css';

/**
 * 주요 수업들 — 타입 필터 + 타입별 설명 + 펼쳐지는 수업 목록(사용자 지시 2026-10-03, toss.im/career/jobs 참고).
 * - 필터: 전체 · Fundamental · Domain · Ritual · Study. 전체면 네 타입이 차례로, 아니면 고른 타입만.
 * - 타입마다 머리글: 왼쪽 이름 · 진행 방식 · 수업 수, 오른쪽 타입 설명.
 * - 수업 한 줄: 영문 이름(크게) + 전문가 캡슐(이름 오른쪽) / 한글 이름(작게, 아래) / 기르는 역량 태그(오른쪽).
 *   호버하면 회색 면이 깔려 누를 수 있는 줄임을 알린다. 누르면 아래로 상세가 펼쳐진다.
 * - 여러 줄을 함께 펼칠 수 있다. 섹션이 처음 화면에 들어오면 맨 위 수업이 스스로 펼쳐진다
 *   (그 전에 사용자가 먼저 눌렀다면 건드리지 않는다).
 */
type Props = { types: CourseType[]; profiles: Record<string, CourseProfile> };

export function CourseExplorer({ types, profiles }: Props) {
  const [filter, setFilter] = useState<'all' | CourseType['id']>('all');
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const touched = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const visible = types.filter((t) => filter === 'all' || t.id === filter);

  // 처음 화면에 들어올 때 한 번, 맨 위 수업을 펼친다
  useEffect(() => {
    const root = rootRef.current;
    const first = types[0]?.courses[0]?.slug;
    if (!root || !first) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (!touched.current) setOpen(new Set([first]));
      },
      { rootMargin: '0px 0px -25% 0px' },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [types]);

  const toggle = (slug: string) => {
    touched.current = true;
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div ref={rootRef} className="course-explorer">
      <div className="course-filter">
        <div className="segmented" role="group" aria-label="수업 유형">
          {[{ id: 'all' as const, name: '전체' }, ...types].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={filter === t.id}
              className="segmented__tab"
              onClick={() => setFilter(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {visible.map((type) => (
        <section key={type.id} className="course-group" aria-labelledby={`course-group-${type.id}`}>
          <header className="course-group__head">
            <div className="course-group__title">
              <h4 id={`course-group-${type.id}`} className="course-group__name">{type.name}</h4>
              <span className="course-group__meta">{type.cadence} · {type.courses.length}개 수업</span>
            </div>
            <Text typography="Body" color="secondary" className="course-group__body">{type.body}</Text>
          </header>

          <ul className="course-rows">
            {type.courses.map((course) => (
              <CourseRow
                key={course.slug}
                course={course}
                type={type}
                profile={profiles[course.slug]}
                open={open.has(course.slug)}
                onToggle={() => toggle(course.slug)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

type RowProps = { course: Course; type: CourseType; profile: CourseProfile; open: boolean; onToggle: () => void };

function CourseRow({ course, type, profile, open, onToggle }: RowProps) {
  const panelId = `course-detail-${course.slug}`;
  return (
    <li className="course-row" data-open={open}>
      <button type="button" className="course-row__hit" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className="course-row__text">
          <span className="course-row__title">
            <span className="course-row__name">{course.en}</span>
            {profile.experts.map((ex) => (
              <span key={ex.name} className="course-row__tag">{ex.name}</span>
            ))}
          </span>
          <span className="course-row__meta">{course.ko}</span>
        </span>
        <span className="course-row__tags">
          {course.tags.map((tag) => (
            <span key={tag} className="course-row__tag">{tag}</span>
          ))}
        </span>
        <span className="course-row__chevron" aria-hidden="true" />
      </button>

      <div id={panelId} className="course-row__panel" role="region" aria-label={course.en} aria-hidden={!open} inert={!open}>
        <div className="course-row__inner">
          <CourseDetail course={course} type={type} profile={profile} />
        </div>
      </div>
    </li>
  );
}

function CourseDetail({ course, type, profile }: { course: Course; type: CourseType; profile: CourseProfile }) {
  // 코스 프로필 개요의 첫 문단이 수업 목표와 같은 글인 수업이 많다 — 겹치는 문단은 개요에서 뺀다
  const overview = profile.overview.filter((p) => !p.startsWith(course.lead) && !p.includes(course.body.slice(0, 30)));

  return (
    <article className="course-detail">
      {/* 수업 내용 */}
      <div className="course-detail__main">
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

      {/* 전문가 · 코스 정보 */}
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
      </aside>
    </article>
  );
}
