import { useEffect, useRef, useState } from 'react';
import { Text } from '../Text/Text';
import type { Course, CourseType } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import './CoursePanel.css';

/**
 * Full Course Profile in a side panel, so visitors never leave the Programs page.
 * Layout: identity column (number, names, type, experts, prev/next) beside the
 * profile — 수업 목표 · 수업 개요 · 학습 목표 (Before → After) · 전문가 소개.
 * Stays mounted so it can slide out; closes on ✕, Esc, or a click on the backdrop.
 */
export type PanelEntry = { index: number; course: Course; type: CourseType; profile: CourseProfile };

type Props = {
  entry: PanelEntry | null;
  total: number;
  onClose: () => void;
  onStep: (dir: -1 | 1) => void;
};

export function CoursePanel({ entry, total, onClose, onStep }: Props) {
  const open = entry !== null;
  // Keep the last course rendered while the panel slides out
  const [shown, setShown] = useState<PanelEntry | null>(entry);
  if (entry && entry !== shown) setShown(entry);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Esc to close, arrows to step; lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open, onClose, onStep]);

  // New course → back to the top of the panel
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [entry?.course.slug]);

  const number = shown ? String(shown.index + 1).padStart(2, '0') : '';

  return (
    <div className="course-panel" data-open={open} inert={!open}>
      <div className="course-panel__backdrop" onClick={onClose} />
      <section className="course-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="course-panel-title">
        {shown && (
          <div ref={scroller} className="course-panel__scroll">
            <div className="course-panel__bar">
              <Text as="span" typography="Label" color="tertiary">Course Profile · {number} / {String(total).padStart(2, '0')}</Text>
              <div className="course-panel__actions">
                <button type="button" className="course-panel__icon" onClick={() => onStep(-1)} aria-label="이전 수업">←</button>
                <button type="button" className="course-panel__icon" onClick={() => onStep(1)} aria-label="다음 수업">→</button>
                <button ref={closeBtn} type="button" className="course-panel__icon" onClick={onClose} aria-label="닫기">✕</button>
              </div>
            </div>

            <div key={shown.course.slug} className="course-panel__grid">
              <aside className="course-panel__identity">
                <span className="course-panel__number">{number}</span>
                <Text as="h2" id="course-panel-title" typography="Subheading">{shown.course.en}</Text>
                <Text typography="Title">{shown.course.ko}</Text>
                <dl className="course-panel__facts">
                  <div>
                    <Text as="dt" typography="Label" color="tertiary">코스 타입</Text>
                    <Text as="dd" typography="Body">{shown.type.name} · {shown.type.cadence}</Text>
                  </div>
                  <div>
                    <Text as="dt" typography="Label" color="tertiary">역량</Text>
                    <Text as="dd" typography="Body">{shown.course.tags.join(' · ')}</Text>
                  </div>
                  <div>
                    <Text as="dt" typography="Label" color="tertiary">전문가</Text>
                    <Text as="dd" typography="Body">{shown.profile.experts.map((e) => e.name).join(', ')}</Text>
                  </div>
                </dl>
              </aside>

              <div className="course-panel__content">
                <section className="course-panel__section">
                  <Text as="h3" typography="Title">수업 목표</Text>
                  <Text typography="Body" color="secondary">{shown.course.lead} {shown.course.body}</Text>
                </section>

                <section className="course-panel__section">
                  <Text as="h3" typography="Title">수업 개요</Text>
                  {shown.profile.overview.map((p, i) => (
                    <Text key={i} typography="Body" color="secondary">{p}</Text>
                  ))}
                </section>

                <section className="course-panel__section">
                  <Text as="h3" typography="Title">학습 목표</Text>
                  <div className="goals" role="table" aria-label="학습 전후 비교">
                    <div className="goals__row goals__row--head" role="row">
                      <Text as="span" typography="Label" color="tertiary" role="columnheader">Before</Text>
                      <Text as="span" typography="Label" role="columnheader">After</Text>
                    </div>
                    {shown.profile.after.map((after, i) => (
                      <div key={i} className="goals__row" role="row">
                        <Text as="span" typography="Body" color="secondary" role="cell">{shown.profile.before[i]}</Text>
                        <Text as="span" typography="Body" role="cell">{after}</Text>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="course-panel__section">
                  <Text as="h3" typography="Title">전문가 소개</Text>
                  {shown.profile.experts.map((e) => (
                    <div key={e.name} className="course-panel__expert">
                      <Text typography="Label">{e.name}</Text>
                      <Text typography="Body" color="secondary">{e.bio}</Text>
                    </div>
                  ))}
                </section>

                <a className="link typo-label" href={`https://www.phi.design/programs/courses/${shown.course.slug}`} target="_blank" rel="noreferrer">
                  phi.design에서 원문 보기 →
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
