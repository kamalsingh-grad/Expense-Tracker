import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, cls: 'text-brand-strong border-brand/40' },
  error: { Icon: AlertCircle, cls: 'text-danger border-danger/40' },
  info: { Icon: Info, cls: 'text-sky-400 border-sky-400/40' },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((toast) => toast.id !== id)), []);

  const push = useCallback((type, title, description) => {
    idCounter += 1;
    const id = idCounter;
    setToasts((t) => [...t.slice(-2), { id, type, title, description }]);
    window.setTimeout(() => dismiss(id), 4800);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (title, description) => push('success', title, description),
    error: (title, description) => push('error', title, description),
    info: (title, description) => push('info', title, description),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map(({ id, type, title, description }) => {
          const { Icon, cls } = ICONS[type] ?? ICONS.info;
          return (
            <div key={id} role="status" className={`toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border bg-card p-3 shadow-lift backdrop-blur ${cls}`}>
              <Icon size={19} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-5 text-ink">{title}</p>
                {description && <p className="mt-0.5 break-words text-xs leading-5 text-muted">{description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(id)} aria-label="Dismiss notification" className="btn-icon h-7 w-7 shrink-0">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
