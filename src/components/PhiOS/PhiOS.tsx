import { Text } from '../Text/Text';
import type { Pillar } from '../../data/programs';
import './PhiOS.css';

/**
 * 태도 · Phi OS(v8, 2026-10-19) — 마무리 바로 앞의 선언문.
 *
 * 역량(얻는 능력)은 초입의 카드, 태도(모든 수업 아래 깔린 자세)는 수업 · 장치 · 채용 연계를 다 본 뒤
 * "우리는 이렇게 사고한다"로 맺는다(사용자 지시 2026-10-19). 앞에서 본 장면이 추상적인 태도의 근거가 되고,
 * 바로 아래 신청 버튼 앞에서 "이 방식이 나와 맞는가"를 스스로 가늠하는 자리가 된다.
 * 카드가 아닌 큰 글씨의 줄 — 누를 것 없이 다섯 줄을 모두 펼쳐 둔다(대부분 읽어야 하는 정보는 숨기지 않는다).
 * 참고: toss.im/company Culture(가치 목록을 모두 펼침), AI · ML · Data 채용의 "일하는 방식"(지원 분야 다음).
 */
export function PhiOS({ items }: { items: Pillar[] }) {
  return (
    <ol className="phi-os">
      {items.map((p, i) => (
        <li key={p.en} className="phi-os__row">
          <span className="phi-os__meta">
            <span className="phi-os__num">{String(i + 1).padStart(2, '0')}</span>
            <Text as="span" typography="Caption" color="tertiary">{p.en}</Text>
          </span>
          <Text as="h3" typography="Heading" className="phi-os__name">{p.ko}</Text>
          <Text typography="Body" color="secondary" className="phi-os__body">{p.body}</Text>
        </li>
      ))}
    </ol>
  );
}
