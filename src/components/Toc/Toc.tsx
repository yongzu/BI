import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { markNavigation, scrollToTarget } from '../../smoothScroll';
import './Toc.css';

/**
 * 페이지 목차 — 화면 오른쪽 위에 고정된 세로 목록(사용자 지시 2026-10-12: 왼쪽 세로 목차가 본문을 오른쪽으로 밀어
 * 가운데 정렬이 안 되고 화면을 다 못 쓰던 것을 고침). 감싸는 판 · 선 없이 글자만.
 * 지금 보는 섹션은 테두리 없는 회색 면 하나가 그 항목으로 미끄러져 간다(사용자 지시 2026-09-30: 항목마다 다시 그리면 뚝뚝 끊겨 보였다).
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
  const bar = useRef<HTMLSpanElement>(null);
  // 레일(목차가 붙어 가는 세로 띠) 위 끝이 화면 아래 30% 선을 넘어 올라오면 위에서 내려오며 나타나고,
  // 다시 그 아래로 내려가면(히어로로 돌아가면) 사라진다(사용자 지시 2026-10-04)
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const rail = nav.current?.parentElement;
    if (!rail) return;
    const io = new IntersectionObserver(([entry]) => setShown(entry.isIntersecting), { rootMargin: '0px 0px -30% 0px' });
    io.observe(rail);
    return () => io.disconnect();
  }, []);

  // Move the single bar to the active link; CSS transitions do the gliding
  useLayoutEffect(() => {
    const place = () => {
      const b = bar.current;
      const link = nav.current?.querySelector<HTMLElement>('a.is-active');
      if (!b) return;
      if (!link) {
        b.style.opacity = '0';
        return;
      }
      b.style.opacity = '1';
      b.style.transform = `translateY(${link.offsetTop}px)`;
      b.style.height = `${link.offsetHeight}px`;
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [active]);

  // 누르면 그 섹션 내용(윗여백 뺀 부분)이 화면 세로 가운데에 오게 스크롤한다(사용자 지시 2026-10-04).
  // 가운데 두면 위 끝이 상단바 줄(88px) 위로 올라갈 만큼 길면(커리큘럼 등) 예전처럼 제목이 위 88px에 오게
  const go = (id: string) => {
    onNavigate?.(id);
    markNavigation(); // 지나가는 길의 저절로 진행되는 연출(커리큘럼 들어가는 길)은 건너뛴다
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const box = contentBox(el);
      const h = box.bottom - box.top;
      if (h > window.innerHeight - 2 * 88 + 1) return scrollToTarget(el); // +1: 과정 개요(딱 이 높이)가 반올림으로 넘지 않게
      scrollToTarget(Math.max(0, window.scrollY + box.top + h / 2 - window.innerHeight / 2));
    });
  };

  const renderList = (list: TocItem[], level: number) => (
    <ul>
      {list.map((item) => (
        <li key={item.id} className={`toc__lv${level}`}>
          <a
            href={`#${item.id}`}
            className={active === item.id ? 'is-active' : undefined}
            aria-current={active === item.id ? 'location' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(item.id);
            }}
          >
            {item.label}
          </a>
          {item.children && renderList(item.children, level + 1)}
        </li>
      ))}
    </ul>
  );

  return (
    <nav ref={nav} className="toc" aria-label="페이지 목차" data-shown={shown}>
      <span ref={bar} className="toc__bar" aria-hidden="true" />
      {renderList(items, 1)}
    </nav>
  );
}
