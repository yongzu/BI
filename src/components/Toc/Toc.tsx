import { useEffect, useMemo, useState } from 'react';
import './Toc.css';

/**
 * Right-side hierarchical table of contents ("ON THIS PAGE").
 * Three levels, hairline rule on the left, a 3px bar marks the section in view.
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

  const go = (id: string) => {
    onNavigate?.(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
    <nav className="toc" aria-label="페이지 목차">
      <p className="toc__title">ON THIS PAGE</p>
      {renderList(items, 1)}
    </nav>
  );
}
