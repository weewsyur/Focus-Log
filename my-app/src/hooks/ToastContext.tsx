import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, LogIn, LogOut, TriangleAlert, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'login' | 'logout' | 'warning';
interface ToastMessage { id: number; kind: ToastKind; message: string }
interface ToastApi { notify: (kind: ToastKind, message: string) => void }

const ToastContext = createContext<ToastApi | null>(null);
let nextToastId = 0;

const TOAST_STYLE: Record<ToastKind, { icon: typeof CheckCircle2; classes: string; role: 'status' | 'alert' }> = {
  success: { icon: CheckCircle2, classes: 'border-app-success/30 bg-app-white text-app-success-dark', role: 'status' },
  error: { icon: AlertCircle, classes: 'border-app-danger-border bg-app-danger-soft text-app-danger', role: 'alert' },
  login: { icon: LogIn, classes: 'border-app-primary/30 bg-app-white text-app-primary', role: 'status' },
  logout: { icon: LogOut, classes: 'border-app-border-strong bg-app-white text-app-navy', role: 'status' },
  warning: { icon: TriangleAlert, classes: 'border-app-highlight bg-app-white text-app-navy', role: 'alert' },
};

function ToastItem({ toast, dismiss }: { toast: ToastMessage; dismiss: (id: number) => void }) {
  const style = TOAST_STYLE[toast.kind];
  const Icon = style.icon;
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), 4500);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id]);

  return (
    <div role={style.role} className={`flex min-w-72 max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${style.classes}`}>
      <Icon className="mt-0.5 shrink-0" size={18} strokeWidth={2} aria-hidden="true" />
      <p className="min-w-0 flex-1">{toast.message}</p>
      <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100">
        <X size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const notify = useCallback((kind: ToastKind, message: string) => {
    const text = message.trim();
    if (!text) return;
    setToasts((current) => {
      if (current.some((toast) => toast.kind === kind && toast.message === text)) return current;
      return [...current, { id: ++nextToastId, kind, message: text }];
    });
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-label="Notifications" className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => <div key={toast.id} className="pointer-events-auto"><ToastItem toast={toast} dismiss={dismiss} /></div>)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
