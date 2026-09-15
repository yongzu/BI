import { useEffect, useRef } from 'react';
import { Text } from '../components/Text/Text';
import './examples.css';

/**
 * Example: confirmation dialog.
 * Primary action = inverse (black) fill, secondary action = subtle gray fill.
 * With no hue available, emphasis is expressed only by fill contrast.
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
      <Text as="h2" id="dialog-title" typography="Title3">{title}</Text>
      <Text typography="Body1" color="secondary">{description}</Text>
      <div className="dialog__actions">
        <button type="button" className="dialog__button typo-subtitle2" onClick={onClose}>{cancelLabel}</button>
        <button type="button" className="dialog__button dialog__button--primary typo-subtitle2" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
