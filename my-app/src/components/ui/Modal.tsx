import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-app-border bg-app-white p-0 text-app-navy shadow-lg shadow-app-black/10 backdrop:bg-app-navy/40"
    >
      <div className="flex items-center justify-between gap-4 border-b border-app-border px-5 py-4">
        <h2 id={titleId} className="text-base font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-app-muted hover:bg-app-surface hover:text-app-navy"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
