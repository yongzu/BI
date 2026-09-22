import { Text } from '../Text/Text';
import type { Course } from '../../data/programs';
import type { CourseProfile } from '../../data/courseProfiles';
import './CourseCard.css';

/**
 * Course box for 주요 수업들.
 * - Resting: name · Korean name · opening line · competency tags.
 * - Hover (mouse): a larger preview layer grows over the box and its contents
 *   surface from a blur — the first learning goals give a taste of the profile.
 * - Click: opens the full Course Profile panel.
 * The preview floats above the grid, so hovering never reflows the layout.
 */
type Props = {
  index: number;
  course: Course;
  /** 코스 타입(Fundamental · Domain · Ritual · Study) — 상단 왼쪽 배지 */
  typeName: string;
  profile: CourseProfile;
  onOpen: () => void;
};

export function CourseCard({ index, course, typeName, profile, onOpen }: Props) {
  const number = String(index + 1).padStart(2, '0');
  const experts = profile.experts.map((e) => e.name).join(', ');

  return (
    <article className="course-card">
      <button type="button" className="course-card__hit" onClick={onOpen} aria-haspopup="dialog" aria-label={`${course.en} 코스 프로필 열기`}>
        <span className="course-card__face">
          <span className="course-card__topline">
            <Text as="span" typography="Label" color="inherit" className="course-card__badge">{typeName}</Text>
            <Text as="span" typography="Label" color="inherit" className="course-card__expert" title={experts}>{experts}</Text>
          </span>
          <Text as="h4" typography="Title" className="course-card__name">{course.en}</Text>
          <Text as="span" typography="Label" color="tertiary">{course.ko}</Text>
          <Text as="span" typography="Body" color="secondary" className="course-card__lead">{course.lead}</Text>
          <Text as="span" typography="Label" color="tertiary" className="course-card__tags">{course.tags.join(' · ')}</Text>
        </span>

        <span className="course-card__preview" aria-hidden="true">
          <span className="course-card__preview-inner">
            <Text as="span" typography="Label" color="tertiary">{number} · {experts}</Text>
            <Text as="span" typography="Title">{course.en}</Text>
            <Text as="span" typography="Body">{course.lead}</Text>
            <span className="course-card__goals">
              <Text as="span" typography="Label" color="tertiary" className="course-card__goals-title">Learning Outcome</Text>
              {profile.after.slice(0, 2).map((goal) => (
                <Text key={goal} as="span" typography="Body" color="secondary" className="course-card__goal">{goal}</Text>
              ))}
            </span>
            <Text as="span" typography="Label" className="course-card__more">코스 프로필 보기 →</Text>
          </span>
        </span>
      </button>
    </article>
  );
}
