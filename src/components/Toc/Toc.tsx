import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { scrollToTarget } from '../../smoothScroll';
import './Toc.css';

/**
 * Right-side hierarchical table of contents ("ON THIS PAGE").
 * Three levels, hairline rule on the left, a 3px bar marks the section in view.
 * The bar is one element that glides to the active item (사용자 지시 2026-09-30) instead of
 * being redrawn on each link, which made it jump from block to block.
 */
export type TocItem = { id: string; label: string; children?: TocItem[] };

const flatten = (items: TocItem[]): string[] => items.flatMap((i) => [i.id, ...(i.children ? flatten(i.children) : [])]);

function useActiveId(ids: string[], offset = 160) {
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
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || !el.getClientRects().length) continue;
        const top = el.getBoundingClientRect().top;
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
  }, [ids, offset]);
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
      b.style.transform = `translateY(${link.offsetTop + 4}px)`;
      b.style.height = `${link.offsetHeight - 8}px`;
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [active]);

  const go = (id: string) => {
    onNavigate?.(id);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) scrollToTarget(el);
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
    <nav ref={nav} className="toc" aria-label="페이지 목차">
      <span ref={bar} className="toc__bar" aria-hidden="true" />
      <p className="toc__title">ON THIS PAGE</p>
      {renderList(items, 1)}
    </nav>
  );
}
