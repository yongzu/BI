import { useId, useState, type ReactNode } from 'react';
import './Accordion.css';

/**
 * Apple FAQ-style accordion: large semibold question, hairline dividers,
 * a rotating plus on the right, optional "expand all".
 */
type Item = { id: string; title: ReactNode; content: ReactNode };

export function Accordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const allOpen = open.size === items.length;
  const baseId = useId();

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="accordion">
      <div className="accordion__tools">
        <button type="button" className="accordion__toggle-all typo-caption" onClick={() => setOpen(allOpen ? new Set() : new Set(items.map((i) => i.id)))}>
          {allOpen ? '모두 접기' : '모두 펼치기'}
        </button>
      </div>
      <ul>
        {items.map((item) => {
          const isOpen = open.has(item.id);
          const panelId = `${baseId}-${item.id}`;
          return (
            <li key={item.id} className="accordion__item" data-open={isOpen}>
              <h3>
                <button type="button" className="accordion__button typo-title" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(item.id)}>
                  <span>{item.title}</span>
                  <span className="accordion__icon" aria-hidden="true" />
                </button>
              </h3>
              <div id={panelId} className="accordion__panel" role="region" hidden={!isOpen}>
                {item.content}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
