import { useState } from 'react';
import { Text } from '../Text/Text';
import type { CourseType, Pillar } from '../../data/programs';
import { openCourse } from '../CourseExplorer/openCourse';
import './ValueCards.css';

/**
 * 역량과 태도(v7, 2026-10-19) — 카드 다섯 장 + 아래 상세 띠.
 *
 * - 묶음(역량 · 태도)마다 카드 다섯 장이 한 줄. 카드에 번호 · 한글 · 영문 이름 · 요약이 늘 보인다(대부분 읽을 정보는 숨기지 않는다).
 * - 카드를 누르면 고른 카드가 잉크로 뒤집히고, 아래 띠에 그 항목의 전문이 나온다. 처음엔 첫 카드가 골라져 있어
 *   누르기 전에도 "누르면 여기에 나온다"가 보인다. 띠는 다섯 항목을 한 칸에 겹쳐 높이가 고정 — 바꿔도 아래가 흔들리지 않는다.
 * - 역량은 띠 오른쪽에 "이 역량을 기르는 수업"을 보여 주고, 누르면 커리큘럼의 수업 상세 패널이 바로 열린다.
 *   역량은 수업 태그로 다시 쓰이는데 v6까지는 화면에서 끊겨 있었다 — 인터랙션을 여닫기보다 "잇기"에 쓴다(노트 10.15 페이지 전체 규칙).
 * 참고: 토스뱅크 디자인 채용의 직군 카드(03) · 토스 회사 소개 Group 카드(05).
 */
type Group = { id: string; name: string; en: string; definition: string; items: Pillar[]; linkCourses?: boolean };

export function ValueCards({ groups, courseTypes }: { groups: Group[]; courseTypes: CourseType[] }) {
  const courses = courseTypes.flatMap((t) => t.courses.map((c) => ({ ...c, type: t.name })));
  return (
    <div className="value-cards">
      {groups.map((g) => (
        <ValueGroup key={g.id} group={g} courses={g.linkCourses ? courses : null} />
      ))}
    </div>
  );
}

function ValueGroup({ group: g, courses }: { group: Group; courses: { slug: string; en: string; ko: string; tags: string[]; type: string }[] | null }) {
  const [selected, setSelected] = useState(0);
  return (
    <section id={g.id} className="vc-group" aria-labelledby={`${g.id}-name`}>
      <header className="vc-group__head">
        <span className="vc-group__names">
          <Text as="h3" id={`${g.id}-name`} typography="Title">{g.name}</Text>
          <Text as="span" typography="Label" color="tertiary">{g.en}</Text>
        </span>
        <Text as="p" typography="Meta" color="secondary">{g.definition}</Text>
      </header>

      <div className="vc-cards" role="group" aria-label={`${g.name} 다섯 가지`}>
        {g.items.map((p, i) => (
          <button
            key={p.en}
            type="button"
            className="vc-card"
            aria-pressed={selected === i}
            aria-controls={`${g.id}-detail`}
            onClick={() => setSelected(i)}
          >
            <span className="vc-card__num">{String(i + 1).padStart(2, '0')}</span>
            <span className="vc-card__names">
              <span className="vc-card__ko">{p.ko}</span>
              <span className="vc-card__en">{p.en}</span>
            </span>
            <span className="vc-card__summary">{p.summary}</span>
          </button>
        ))}
      </div>

      <div id={`${g.id}-detail`} className="vc-detail" role="region" aria-live="polite" aria-label={`${g.items[selected].ko} 설명`}>
        {g.items.map((p, i) => {
          const related = courses?.filter((c) => c.tags.includes(p.ko)) ?? [];
          return (
            <div key={p.en} className="vc-detail__item" data-active={selected === i} inert={selected !== i}>
              <div className="vc-detail__head">
                <Text as="span" typography="Caption" color="tertiary">{String(i + 1).padStart(2, '0')}</Text>
                <Text as="h4" typography="Title">{p.ko}</Text>
                <Text as="span" typography="Label" color="tertiary">{p.en}</Text>
              </div>
              <Text typography="Body" color="secondary" className="vc-detail__body">{p.body}</Text>
              {courses && (
                <div className="vc-detail__courses">
                  <Text as="p" typography="Caption" color="tertiary">이 역량을 기르는 수업 {related.length}</Text>
                  <ul>
                    {related.map((c) => (
                      <li key={c.slug}>
                        <button type="button" className="vc-course" onClick={() => openCourse(c.slug)}>
                          <span className="vc-course__en">{c.en}</span>
                          <span className="vc-course__type">{c.type}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
