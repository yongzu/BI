import { useEffect, useRef, useState } from 'react';
import { Text } from '../Text/Text';
import { scrollToTarget } from '../../smoothScroll';
import './DeviceMap.css';

/**
 * 수업을 관통하는 접근(v7, 2026-10-19) — 왼쪽에 고정된 지도 + 오른쪽 설명.
 *
 * - 지도: 배우는 자리 세 곳(세션 안에서 → 스스로 돌아보기 → 세션 밖에서)이 위에서 아래로 이어지고, 자리마다 장치 두 개.
 *   여섯 장치가 "어디서 일어나는가"를 한 그림으로 본다(AI · ML · Data 채용 06의 개념 그림, 토스 홈 08의 고정 화면).
 * - 오른쪽 설명을 읽어 내려가면 지금 읽는 장치가 지도에서 잉크로 표시된다. 표시만 바뀌고 글은 하나도 숨지 않는다 —
 *   흐리게 하지 않는 것은 흐린 글이 대비 기준(WCAG 1.4.3)을 넘지 못해서다.
 * - 지도의 장치를 누르면 그 설명으로 이동한다. 좁은 화면에선 지도 없이 자리 라벨 + 설명 줄.
 */
type Device = { name: string; tag: string; body: string };

export function DeviceMap({ items, outcomes }: { items: Device[]; outcomes: Record<string, string> }) {
  const places = [...new Set(items.map((d) => d.tag))];
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // 화면 가운데 띠(위 40% · 아래 40%를 뺀 곳)에 들어온 설명을 지금 장치로
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(refs.current.indexOf(seen.target as HTMLElement));
      },
      { rootMargin: '-40% 0px -40% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="device-map">
      <aside className="device-map__map" aria-label="배우는 자리와 수업 장치">
        <ol className="device-map__places">
          {places.map((place, p) => (
            <li key={place} className="device-map__place" data-active={items[active]?.tag === place}>
              <Text as="span" typography="Caption" className="device-map__place-name">
                {String(p + 1).padStart(2, '0')} · {place}
              </Text>
              <span className="device-map__nodes">
                {items.map((d, i) => d.tag === place && (
                  <button
                    key={d.name}
                    type="button"
                    className="device-map__node"
                    aria-current={active === i ? 'step' : undefined}
                    onClick={() => { const el = refs.current[i]; if (el) scrollToTarget(el); }}
                  >
                    <span className="device-map__num">{String(i + 1).padStart(2, '0')}</span>
                    {d.name}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ol>
        <p className="device-map__now" aria-live="polite">
          <span className="device-map__now-label">지금</span>
          {items[active]?.name} — {outcomes[items[active]?.name]}
        </p>
      </aside>

      <div className="device-map__list">
        {items.map((d, i) => (
          <article
            key={d.name}
            id={`device-${i + 1}`}
            ref={(el) => { refs.current[i] = el; }}
            className="device-step"
            data-active={active === i}
          >
            {(i === 0 || items[i - 1].tag !== d.tag) && (
              <Text as="h3" typography="Caption" color="tertiary" className="device-step__place">{d.tag}</Text>
            )}
            <span className="device-step__num">{String(i + 1).padStart(2, '0')}</span>
            <Text as="h4" typography="Title">{d.name}</Text>
            {outcomes[d.name] && <Text as="p" typography="Label" color="tertiary">{outcomes[d.name]}</Text>}
            <Text typography="Body" color="secondary" className="device-step__body">{d.body}</Text>
          </article>
        ))}
      </div>
    </div>
  );
}
