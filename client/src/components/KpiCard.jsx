import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cx, formatPct } from '../lib/format';

const TONES = {
  emerald: 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20',
  rose: 'text-rose-400 bg-rose-400/10 ring-rose-400/20',
  sky: 'text-sky-400 bg-sky-400/10 ring-sky-400/20',
  amber: 'text-amber-400 bg-amber-400/10 ring-amber-400/20',
};

/**
 * @param invert  true for metrics where "down" is good (e.g. expenses)
 */
export default function KpiCard({ label, value, icon: Icon, tone = 'emerald', delta = null, deltaLabel = 'vs last month', invert = false, footnote }) {
  const hasDelta = delta !== null && Number.isFinite(delta);
  const good = hasDelta ? (invert ? delta <= 0 : delta >= 0) : true;
  const DeltaIcon = !hasDelta ? Minus : delta >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="card group relative overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-brand/10 to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
          <p className="mt-2 truncate text-[clamp(1.45rem,2.1vw,1.75rem)] font-extrabold leading-none tracking-tight tnum">{value}</p>
        </div>
        <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1', TONES[tone])}>
          <Icon size={20} strokeWidth={2.1} />
        </span>
      </div>
      <div className="mt-3.5 flex min-h-[1.5rem] flex-wrap items-center gap-2">
        {hasDelta ? (
          <>
            <span className={cx('kpi-delta', good ? 'bg-emerald-400/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-400/10 text-rose-500 dark:text-rose-400')}>
              <DeltaIcon size={12} strokeWidth={2.5} />
              {formatPct(Math.abs(delta))}
            </span>
            <span className="text-[10.5px] font-medium text-faint">{deltaLabel}</span>
          </>
        ) : (
          <span className="text-[10.5px] font-medium text-faint">{footnote ?? 'All time'}</span>
        )}
      </div>
    </article>
  );
}
