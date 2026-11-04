import type { ReactNode } from 'react';
import { Check, LoaderCircle, X } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ConfirmationActionsProps {
  message: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmVariant;
}

export function ConfirmationActions({
  message,
  onConfirm,
  onCancel,
  busy = false,
  confirmLabel = 'Yes, save',
  cancelLabel = 'No, cancel',
  confirmVariant = 'secondary',
}: ConfirmationActionsProps) {
  return (
    <>
      <div className="text-sm leading-6 text-app-slate">{message}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" icon={<X size={15} strokeWidth={2} aria-hidden="true" />} disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} icon={busy ? <LoaderCircle className="animate-spin" size={15} strokeWidth={2} aria-hidden="true" /> : <Check size={15} strokeWidth={2} aria-hidden="true" />}
          disabled={busy} onClick={onConfirm}>
          {busy ? 'Saving…' : confirmLabel}
        </Button>
      </div>
    </>
  );
}

interface ConfirmationProps extends ConfirmationActionsProps {
  title: string;
}

export function Confirmation({ title, onCancel, ...actions }: ConfirmationProps) {
  return (
    <Modal title={title} onClose={() => { if (!actions.busy) onCancel(); }}>
      <ConfirmationActions {...actions} onCancel={onCancel} />
    </Modal>
  );
}
