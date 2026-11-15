import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ComposedChart, Pie, PieChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertCircle, Flame, PiggyBank, RefreshCw, Trophy } from 'lucide-react';
import { getCategoryBreakdown, getDailyFlow, getMonthly, getSummary } from '../lib/api';
import { CHART_PALETTE } from '../lib/categories';
import { cx, formatINR } from '../lib/format';
import ChartTooltip from '../components/ChartTooltip';
import Skeleton from '../components/Skeleton';

const RANGE_OPTIONS = [{ label: '3M', value: 3 }, { label: '6M', value: 6 }, { label: '12M', value: 12 }];

function InsightCard({ icon: Icon, tone, label, value, sub }) {
  const tones = {
    rose: 'text-rose-400 bg-rose-400/10 ring-rose-400/20',
    amber: 'text-amber-400 bg-amber-400/10 ring-amber-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20',
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1', tones[tone])}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="mt-0.5 truncate text-lg font-extrabold tracking-tight tnum">{value}</p>
        <p className="truncate text-[10.5px] font-medium text-faint">{sub}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState(6);
  const [breakdownType, setBreakdownType] = useState('expense');
  const [monthly, setMonthly] = useState([]);
  const [breakdown, setBreakdown] = useState({ categories: [], total: 0 });
  const [daily, setDaily] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mon, brk, day, sum] = await Promise.all([
        getMonthly(range),
        getCategoryBreakdown({ type: breakdownType, months: range }),
        getDailyFlow(30),
        getSummary(),
      ]);
      setMonthly(mon);
      setBreakdown(brk);
      setDaily(day);
      setSummary(sum);
    } catch (err) {
      setError(err.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [range, breakdownType]);

  useEffect(() => { load(); }, [load]);

  const savingsTrend = useMemo(
    () => monthly.map((m) => ({ ...m, rate: m.income > 0 ? Math.round(((m.income - m.expense) / m.income) * 1000) / 10 : 0 })),
    [monthly]
  );

  const insights = useMemo(() => {
    if (!monthly.length) return null;
    const peak = monthly.reduce((a, b) => (b.expense > a.expense ? b : a), monthly[0]);
    const totIncome = monthly.reduce((s, m) => s + m.income, 0);
    const totSavings = monthly.reduce((s, m) => s + m.savings, 0);
    const avgRate = totIncome > 0 ? (totSavings / totIncome) * 100 : 0;
    return { peak, avgRate };
  }, [monthly]);

  const donutData = breakdown.categories.slice(0, 7);
  const rest = breakdown.categories.slice(7).reduce((s, c) => s + c.amount, 0);
  const chartCats = rest > 0 ? [...donutData, { category: 'Others', amount: rest, percentage: breakdown.total ? (rest / breakdown.total) * 100 : 0, count: 0 }] : donutData;
  const maxBreakdown = breakdown.categories[0]?.amount ?? 1;

  if (error) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <AlertCircle size={30} className="text-danger" />
        <h2 className="text-base font-bold">Couldn’t load analytics</h2>
        <p className="max-w-md text-sm text-muted">{error}</p>
        <button type="button" className="btn-primary mt-1" onClick={load}><RefreshCw size={15} /> Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">Financial analytics</h2>
          <p className="text-[11.5px] font-medium text-muted">Auto-generated from your transaction ledger</p>
        </div>
        <div className="flex rounded-xl border border-line bg-card2 p-1" role="tablist" aria-label="Analysis range">
          {RANGE_OPTIONS.map((r) => (
            <button key={r.value} role="tab" aria-selected={range === r.value} onClick={() => setRange(r.value)}
              className={cx('rounded-lg px-3 py-1.5 text-[12px] font-bold text-muted transition-colors', range === r.value && 'bg-card text-ink shadow-sm')}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* auto insights */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {loading && !insights ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[5.5rem]" />)
        ) : insights ? (
          <>
            <InsightCard icon={Flame} tone="rose" label="Peak spend month" value={formatINR(insights.peak.expense)} sub={insights.peak.fullLabel} />
            <InsightCard icon={Trophy} tone="amber" label={`Top ${breakdownType === 'expense' ? 'expense' : 'income'} category`} value={breakdown.categories[0]?.category ?? '—'} sub={breakdown.categories[0] ? `${formatINR(breakdown.categories[0].amount)} · ${breakdown.categories[0].percentage.toFixed(1)}% of total` : 'No data in range'} />
            <InsightCard icon={PiggyBank} tone="emerald" label="Avg savings rate" value={`${insights.avgRate.toFixed(1)}%`} sub={`Across ${monthly.length} months · all-time ${(summary?.savingsRate ?? 0).toFixed(1)}%`} />
          </>
        ) : null}
      </div>

      {/* bar chart + savings line */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="card p-5 sm:p-6 xl:col-span-3" aria-label="Income vs expenses by month">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-extrabold tracking-tight">Income vs expenses</h3>
              <p className="text-[11px] font-medium text-muted">Side-by-side, {range}-month view</p>
            </div>
            <span className="flex items-center gap-3 text-[10.5px] font-semibold text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[4px] bg-emerald-500" />Income</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[4px] bg-rose-500" />Expenses</span>
            </span>
          </div>
          {loading && !monthly.length ? <Skeleton className="mt-4 h-64" /> : (
            <div className="mt-4 h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 2, left: 0, bottom: 0 }} barCategoryGap="24%">
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11, fontWeight: 600 }} dy={6} />
                  <YAxis width={46} tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} tickFormatter={(v) => formatINR(v, { compact: true })} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--card-2)' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 2, 2]} maxBarSize={26} />
                  <Bar dataKey="expense" name="Expenses" fill="#fb7185" radius={[6, 6, 2, 2]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card p-5 sm:p-6 xl:col-span-2" aria-label="Savings rate trend">
          <h3 className="text-[15px] font-extrabold tracking-tight">Savings rate</h3>
          <p className="text-[11px] font-medium text-muted">Share of income kept each month</p>
          {loading && !savingsTrend.length ? <Skeleton className="mt-4 h-64" /> : (
            <div className="mt-4 h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsTrend} margin={{ top: 8, right: 4, left: -6, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11, fontWeight: 600 }} dy={6} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTooltip formatValue={(v) => `${Number(v).toFixed(1)}%`} />} />
                  <ReferenceLine y={20} stroke="var(--border-strong)" strokeDasharray="6 6" label={{ value: '20% target', position: 'insideTopRight', fill: 'var(--faint)', fontSize: 10, fontWeight: 700 }} />
                  <Line type="monotone" dataKey="rate" name="Savings rate" stroke="#f59e0b" strokeWidth={2.6} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* breakdown + daily net flow */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="card p-5 sm:p-6 xl:col-span-2" aria-label="Category breakdown">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-extrabold tracking-tight">Category breakdown</h3>
              <p className="text-[11px] font-medium text-muted">{breakdownType === 'expense' ? 'Where the money went' : 'Where the money came from'}</p>
            </div>
            <div className="flex rounded-xl border border-line bg-card2 p-1" role="group" aria-label="Breakdown type">
              {[['expense', 'Expense'], ['income', 'Income']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setBreakdownType(value)} aria-pressed={breakdownType === value}
                  className={cx('rounded-lg px-3 py-1 text-[11.5px] font-bold text-muted transition-colors', breakdownType === value && 'bg-card text-ink shadow-sm')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading && !breakdown.categories.length ? <Skeleton className="mt-4 h-64" /> : chartCats.length ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="mx-auto h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartCats} dataKey="amount" nameKey="category" innerRadius="60%" outerRadius="88%" paddingAngle={3} strokeWidth={3} stroke="var(--card)">
                      {chartCats.map((entry, i) => <Cell key={entry.category} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {breakdown.categories.slice(0, 6).map((c, i) => (
                  <li key={c.category} className="flex items-center gap-2 text-[12px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} aria-hidden="true" />
                    <span className="w-36 truncate font-medium text-muted sm:w-40">{c.category}</span>
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-card2">
                      <div className="bar-grow h-full rounded-full" style={{ width: `${Math.max(3, (c.amount / maxBreakdown) * 100)}%`, background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                    </div>
                    <span className="w-14 shrink-0 text-right font-bold tnum">{c.percentage.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">No {breakdownType} data in this range.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6 xl:col-span-3" aria-label="Net cash flow, last 30 days">
          <h3 className="text-[15px] font-extrabold tracking-tight">Net cash flow · 30 days</h3>
          <p className="text-[11px] font-medium text-muted">Daily income minus expenses (salary days spike high)</p>
          {loading && !daily.length ? <Skeleton className="mt-4 h-64" /> : (
            <div className="mt-4 h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 10 }} interval={4} dy={6} />
                  <YAxis width={52} tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 10 }} tickFormatter={(v) => formatINR(v, { compact: true })} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
                  <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="6 6" />
                  <Area type="monotone" dataKey="net" name="Net" stroke="#10b981" strokeWidth={2.4} fill="url(#netGrad)" dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expense" name="Expenses" stroke="#fb7185" strokeWidth={1.6} strokeDasharray="3 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* monthly ledger table */}
      <section className="card overflow-hidden" aria-label="Month by month ledger">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-[15px] font-extrabold tracking-tight">Month-by-month ledger</h3>
          <p className="text-[11px] font-medium text-muted">Every month, fully itemised</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                <th className="px-5 py-3 text-left">Month</th>
                <th className="px-3 py-3 text-right">Income</th>
                <th className="px-3 py-3 text-right">Expenses</th>
                <th className="px-3 py-3 text-right">Net savings</th>
                <th className="px-5 py-3 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {monthly.map((m) => {
                const rate = m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0;
                return (
                  <tr key={m.month} className="transition-colors hover:bg-card2/60">
                    <td className="px-5 py-2.5 font-bold">{m.fullLabel}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-500 tnum dark:text-emerald-400">{formatINR(m.income)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tnum">{formatINR(m.expense)}</td>
                    <td className={cx('px-3 py-2.5 text-right font-bold tnum', m.savings >= 0 ? '' : 'text-danger')}>{m.savings >= 0 ? '+' : ''}{formatINR(m.savings)}</td>
                    <td className="px-5 py-2.5 text-right"><span className={cx('chip tnum', rate >= 20 && 'chip-active')}>{rate.toFixed(0)}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
