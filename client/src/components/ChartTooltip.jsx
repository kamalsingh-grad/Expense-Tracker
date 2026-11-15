import { formatINR } from '../lib/format';

/** Shared recharts tooltip — theme-aware via CSS tokens */
export default function ChartTooltip({ active, payload, label, suffix = '', formatValue }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 shadow-lift backdrop-blur">
      <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: entry.color ?? entry.stroke ?? entry.fill }} aria-hidden="true" />
            <span className="font-medium text-muted">{entry.name}</span>
            <span className="ml-auto pl-3 font-bold text-ink tnum">{formatValue ? formatValue(entry.value) : `${typeof entry.value === 'number' ? formatINR(entry.value) : entry.value}${suffix}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
