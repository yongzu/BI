import { useId, useState } from 'react';
import type { Pillar } from '../../data/programs';
import { PillarArt } from './PillarArt';
import './PillarList.css';

/**
 * 역량과 태도(사용자 지시 2026-10-24) — toss.im/company '일하는 방식이 곧 성공 전략'(Culture) 형식.
 *
 * - 제목 아래 가는 선, 그 아래 두 칸: 왼쪽은 화면에 붙는 이미지 박스(줄마다 그래픽 — PillarArt), 오른쪽은 줄 목록.
 * - 오른쪽은 두 묶음(역량 · 태도 · Phi OS)의 01–05 줄이 이어진다. 줄 하나 = 번호 · 이름(영문 / 한글 두 줄) | 설명.
 *   묶음 제목은 왼쪽 이미지 박스 위에 — 고른 줄의 묶음으로 바뀐다(사용자 지시 2026-10-24).
 * - 줄 사이 구분선 · 여백은 토스 값 그대로: 첫 줄 빼고 위에 1px 선 + 24px, 줄 아래 92px(토스 CSS .dcrv6q6).
 * - 고른 줄만 검정, 나머지는 회색(토스). 고른 줄 = 마우스를 올린 줄(처음엔 첫 줄). 스크롤로는 바뀌지 않는다(사용자 지시 2026-10-24) —
 *   고르면 왼쪽 제목 · 그래픽도 그 줄로 넘어간다. 고른 줄은 검정 —
 *   단 번호는 검정이 아니라 진한 회색(사용자 지시).
 * - 토스처럼 줄은 스크롤하면 아래에서 떠오른다(ProgramsPage revealTargets).
 * - 좁은 화면: 이미지 박스 없이 줄만, 이름 아래 설명.
 * 예전 SkillReveal(붙는 무대 · 가로로 흐르는 카드 열 장)은 이 형식으로 바뀌었다.
 * 채용 연계도 같은 구성으로 쓴다(사용자 지시 2026-10-27) — arts로 이미지 박스 그래픽을 골라 쓰고, 줄에 각주(note)를 달 수 있다.
 */
export type PillarItem = Pick<Pillar, 'ko' | 'en' | 'body'> & { note?: string };
export type PillarGroup = { label: string; items: PillarItem[] };

export function PillarList({ groups, arts }: { groups: PillarGroup[]; arts?: number[] }) {
  const [active, setActive] = useState(0);
  const uid = useId(); // 한 페이지에 둘(역량과 태도 · 채용 연계) — 묶음 제목 id가 겹치지 않게

  // 묶음을 이어 센 줄 번호의 시작(고른 줄 비교용) — 역량 0–4, 태도 5–9
  const starts = groups.map((_, gi) => groups.slice(0, gi).reduce((sum, g) => sum + g.items.length, 0));
  // 고른 줄이 든 묶음 — 이미지 박스 위 제목이 이 묶음으로 넘어간다
  const activeGroup = Math.max(0, starts.findLastIndex((start) => active >= start));
  return (
    <div className="pillar-list">
      <div className="pillar-list__rule" aria-hidden="true" />
      <div className="pillar-list__body">
        <div className="pillar-list__side">
          {/* 묶음 제목은 이미지 박스 위에(사용자 지시 2026-10-24 — 토스의 'Culture' 자리). 고른 줄의 묶음으로 위아래로 넘어간다 */}
          <div className="pillar-list__label" aria-hidden="true">
            <div className="pillar-list__label-track" style={{ '--g': activeGroup } as React.CSSProperties}>
              {groups.map((g) => <p key={g.label}>{g.label}</p>)}
            </div>
          </div>
          {/* 이미지 박스 — 줄마다 모노톤 움직이는 그래픽 + 가운데 영문 이름(사용자 지시 2026-10-24). 고른 줄을 따라 넘어간다 */}
          <PillarArt titles={groups.flatMap((g) => g.items.map((p) => p.en))} active={active} arts={arts} />
        </div>
        <div className="pillar-list__groups">
          {groups.map((g, gi) => (
            <section key={g.label} className="pillar-group" aria-labelledby={`${uid}-group-${gi}`}>
              {/* 보이는 제목은 왼쪽 이미지 박스 위 — 여기는 화면 읽기 프로그램용 */}
              <h3 id={`${uid}-group-${gi}`} className="visually-hidden">{g.label}</h3>
              <ol className="pillar-group__rows">
                {g.items.map((p, i) => {
                  const index = starts[gi] + i;
                  return (
                    // 마우스를 올리면 그 줄을 고른다 — 글 진하기와 왼쪽 그래픽이 함께 바뀐다(사용자 지시 2026-10-24)
                    <li key={p.en} className="pillar-row" data-active={active === index} onMouseEnter={() => setActive(index)}>
                      <div className="pillar-row__head">
                        <span className="pillar-row__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <h4 className="pillar-row__name">
                          <span lang="en">{p.en}</span>
                          <span>{p.ko}</span>
                        </h4>
                      </div>
                      <div className="pillar-row__body">
                        <p>{p.body}</p>
                        {p.note && <p className="pillar-row__note">{p.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
