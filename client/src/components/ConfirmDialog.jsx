import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', loading = false, onConfirm, onClose }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button type="button" aria-label="Close dialog" className="overlay-in absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div className="modal-in relative m-0 w-full max-w-md rounded-t-2xl border border-line bg-card p-6 shadow-lift sm:m-4 sm:rounded-2xl">
        <button type="button" className="btn-icon absolute right-3 top-3 h-8 w-8" onClick={onClose} disabled={loading} aria-label="Close">
          <X size={16} />
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h2 id="confirm-title" className="mt-4 text-base font-extrabold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-6 text-muted">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" ref={cancelRef} className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
