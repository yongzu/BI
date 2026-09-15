import { useEffect, useRef } from 'react';
import { Text } from '../components/Text/Text';
import './examples.css';

/**
 * Example: confirmation dialog.
 * Primary action = ink text on fill, secondary = gray text. Emphasis by tone only.
 */
type DialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function Dialog({ open, title, description, confirmLabel, cancelLabel = '취소', onConfirm, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dialog-title">
      <Text id="dialog-title" typography="Title">{title}</Text>
      <Text typography="Copy" color="secondary">{description}</Text>
      <div className="dialog__actions">
        <button type="button" className="pill" onClick={onClose}>{cancelLabel}</button>
        <button type="button" className="pill pill--end" aria-pressed="true" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
