import { useEffect, useMemo, useRef, useState } from 'react';
import { scrollToTarget } from '../../smoothScroll';
import './Toc.css';

/**
 * 페이지 목차 — 화면 오른쪽 세로 가운데의 짧은 선 목록(toss.im 섹션 앵커를 오른쪽에 거울처럼, 사용자 지시 2026-10-19).
 * 섹션마다 가는 선 하나, 지금 보는 섹션은 진한 선. 마우스를 가까이 대면 커서에 가까운 선일수록 길어지고(돋보기처럼),
 * 가리킨 선 왼쪽에 섹션 이름이 뜬다. 누르면 그 섹션으로 간다.
 * 2026-10-12 – 10-19엔 오른쪽 위 글자 목록 + 미끄러지는 회색 면이었다.
 */
export type TocItem = { id: string; label: string; children?: TocItem[] };

const flatten = (items: TocItem[]): string[] => items.flatMap((i) => [i.id, ...(i.children ? flatten(i.children) : [])]);

/** 섹션 내용의 위 끝(섹션 윗여백 아래) — 목차가 가운데로 맞추는 기준 */
function contentBox(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const st = getComputedStyle(el);
  return { top: r.top + parseFloat(st.paddingTop), bottom: r.bottom - parseFloat(st.paddingBottom) };
}

/** 내용 위 끝이 화면 세로 가운데 선을 넘은 가장 아래 섹션 — 누르면 내용이 가운데 오므로 그 줄과 맞춘다(2026-10-04) */
function useActiveId(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const update = () => {
      // At the very bottom the last targets can never reach the offset line
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(ids[ids.length - 1]);
        return;
      }
      let current: string | null = null;
      let best = -Infinity;
      const offset = window.innerHeight / 2;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || !el.getClientRects().length) continue;
        const top = contentBox(el).top;
        // deepest target that has crossed the offset line wins
        if (top <= offset && top >= best) {
          best = top;
          current = id;
        }
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ids]);
  return active;
}

type TocProps = {
  items: TocItem[];
  /** Called before scrolling, e.g. to reveal a filtered-out target */
  onNavigate?: (id: string) => void;
};

export function Toc({ items, onNavigate }: TocProps) {
  const ids = useMemo(() => flatten(items), [items]);
  const active = useActiveId(ids);
  const nav = useRef<HTMLElement>(null);
  // 레일(목차가 붙어 가는 세로 띠) 위 끝이 화면 아래 30% 선을 넘어 올라오면 나타나고,
  // 다시 그 아래로 내려가면(히어로로 돌아가면) 사라진다(사용자 지시 2026-10-04)
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const rail = nav.current?.parentElement;
    if (!rail) return;
    const io = new IntersectionObserver(([entry]) => setShown(entry.isIntersecting), { rootMargin: '0px 0px -30% 0px' });
    io.observe(rail);
    return () => io.disconnect();
  }, []);

  // 돋보기: 커서와 선의 세로 거리로 길이(--s, 0.35 → 1)를 정한다 — 가까울수록 길다. 커서가 떠나면 모두 짧게
  const lens = (y: number | null) => {
    nav.current?.querySelectorAll<HTMLElement>('.toc__link').forEach((a) => {
      let s = MIN;
      if (y !== null) {
        const r = a.getBoundingClientRect();
        const d = (r.top + r.height / 2 - y) / 22;
        s = MIN + (1 - MIN) * Math.exp(-d * d);
      }
      a.style.setProperty('--s', s.toFixed(3));
    });
  };

  // 누르면 그 섹션 내용(윗여백 뺀 부분)이 화면 세로 가운데에 오게 스크롤한다(사용자 지시 2026-10-04).
  // 가운데 두면 위 끝이 상단바 줄(88px) 위로 올라갈 만큼 길면(커리큘럼 등) 예전처럼 제목이 위 88px에 오게
  const go = (id: string) => {
    onNavigate?.(id);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const box = contentBox(el);
      const h = box.bottom - box.top;
      if (h > window.innerHeight - 2 * 88 + 1) return scrollToTarget(el);
      scrollToTarget(Math.max(0, window.scrollY + box.top + h / 2 - window.innerHeight / 2));
    });
  };

  return (
    <nav
      ref={nav}
      className="toc"
      aria-label="페이지 목차"
      data-shown={shown}
      onPointerMove={(e) => { if (e.pointerType === 'mouse') lens(e.clientY); }}
      onPointerLeave={() => lens(null)}
    >
      <ul>
        {ids.map((id) => {
          const label = findLabel(items, id);
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`toc__link${active === id ? ' is-active' : ''}`}
                aria-current={active === id ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(id);
                }}
              >
                <span className="toc__label">{label}</span>
                <span className="toc__line" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 선 길이의 최소 비율(최대 길이 40px의 35% = 14px, toss.im과 같다) */
const MIN = 0.35;

function findLabel(list: TocItem[], id: string): string {
  for (const item of list) {
    if (item.id === id) return item.label;
    if (item.children) {
      const found = findLabel(item.children, id);
      if (found) return found;
    }
  }
  return '';
}
