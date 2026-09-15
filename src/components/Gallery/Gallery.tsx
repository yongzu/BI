import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { IconButton } from '../Button/Button';
import './Gallery.css';

/**
 * Horizontal card gallery with scroll-snap and round paddle buttons (Apple "tiles").
 * Content starts aligned with the text column and bleeds to the right edge.
 */
export function Gallery({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className="gallery">
      <ul ref={track} className="gallery__track" aria-label={label} onScroll={update}>
        {children}
      </ul>
      <div className="gallery__paddles">
        <IconButton icon="prev" label="이전" disabled={edge.start} onClick={() => page(-1)} />
        <IconButton icon="next" label="다음" disabled={edge.end} onClick={() => page(1)} />
      </div>
    </div>
  );
}

export function GalleryItem({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={['gallery__item', className].filter(Boolean).join(' ')}>{children}</li>;
}
