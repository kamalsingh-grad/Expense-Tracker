import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cx } from '../lib/format';

/** Page number window: first … current±1 … last (never more than 7 slots) */
export function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const items = buildPageList(page, totalPages);

  const btn = 'flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[13px] font-semibold text-muted transition-colors hover:border-line hover:bg-card2 hover:text-ink disabled:pointer-events-none disabled:opacity-35';

  return (
    <nav className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <div className="flex items-center justify-between gap-4 sm:justify-start">
        <p className="text-xs font-medium text-muted">
          Showing <span className="font-bold text-ink tnum">{from}–{to}</span> of <span className="font-bold text-ink tnum">{total}</span>
        </p>
        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="hidden xs:inline">Rows</span>
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))} className="input h-9 w-[4.5rem] !px-2" aria-label="Rows per page">
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-center gap-1">
        <button type="button" className={btn} onClick={() => onPageChange(1)} disabled={page === 1} aria-label="First page"><ChevronsLeft size={16} /></button>
        <button type="button" className={btn} onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page"><ChevronLeft size={16} /></button>
        {items.map((item, i) =>
          item === '…' ? (
            <span key={`e${i}`} className="px-1 text-xs text-faint">…</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cx(btn, item === page && 'border-brand/50 bg-brand-soft font-bold text-brand-strong')}
            >
              {item}
            </button>
          )
        )}
        <button type="button" className={btn} onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page"><ChevronRight size={16} /></button>
        <button type="button" className={btn} onClick={() => onPageChange(totalPages)} disabled={page === totalPages} aria-label="Last page"><ChevronsRight size={16} /></button>
      </div>
    </nav>
  );
}
