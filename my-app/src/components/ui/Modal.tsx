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
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 border-t-4 border-t-[#32CC59] bg-white p-0 text-[#0B2F63] shadow-2xl backdrop:bg-[#0B2F63]/50"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#E3EAF3] px-6 py-5">
        <h2 id={titleId} className="text-lg font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#6B7C93] hover:bg-[#EAF3FC] hover:text-[#0B2F63]"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
