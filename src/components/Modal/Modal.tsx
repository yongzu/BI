import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from '../Button/Button';
import './Modal.css';

/** Full-content modal opened from a card's plus button (Apple "tile overlay"). */
export function Modal({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="modal__sheet">
        <IconButton icon="close" label="닫기" tone="action" className="modal__close" onClick={onClose} />
        {children}
      </div>
    </dialog>
  );
}
