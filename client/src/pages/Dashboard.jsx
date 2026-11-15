import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertCircle, ArrowDownLeft, ArrowRight, ArrowUpRight, PiggyBank, RefreshCw, TrendingUp, Wallet,
} from 'lucide-react';
import { getCategoryBreakdown, getMonthly, getRecentTransactions, getSummary } from '../lib/api';
import { categoryMeta, CHART_PALETTE } from '../lib/categories';
import { cx, formatDate, formatINR, formatSigned, txId } from '../lib/format';
import KpiCard from '../components/KpiCard';
import ChartTooltip from '../components/ChartTooltip';
import Skeleton, { CardSkeleton, KpiSkeletonRow } from '../components/Skeleton';

const RANGES = [{ label: '3M', value: 3 }, { label: '6M', value: 6 }, { label: '12M', value: 12 }];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [cats, setCats] = useState({ categories: [], total: 0 });
  const [monthCats, setMonthCats] = useState({ categories: [], total: 0 });
  const [recent, setRecent] = useState([]);
  const [range, setRange] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, mon, cat6, cat1, rec] = await Promise.all([
        getSummary(),
        getMonthly(range),
        getCategoryBreakdown({ type: 'expense', months: 6 }),
        getCategoryBreakdown({ type: 'expense', months: 1 }),
        getRecentTransactions(6),
      ]);
      setSummary(sum);
      setMonthly(mon);
      setCats(cat6);
      setMonthCats(cat1);
      setRecent(rec);
    } catch (err) {
      setError(err.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (error) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <AlertCircle size={30} className="text-danger" />
        <h2 className="text-base font-bold">Couldn’t load your dashboard</h2>
        <p className="max-w-md text-sm text-muted">{error}</p>
        <button type="button" className="btn-primary mt-1" onClick={load}><RefreshCw size={15} /> Retry</button>
      </div>
    );
  }

  const donutData = cats.categories.slice(0, 6);
  const donutRest = cats.categories.slice(6).reduce((s, c) => s + c.amount, 0);
  const chartCats = donutRest > 0 ? [...donutData, { category: 'Everything else', amount: donutRest, percentage: cats.total ? (donutRest / cats.total) * 100 : 0 }] : donutData;
  const maxMonthCat = monthCats.categories[0]?.amount ?? 1;

  return (
    <div className="space-y-6">
      {/* welcome row */}
      <div className="fade-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{greeting}, Aarav</h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-muted">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {summary?.month?.label ? ` · ${summary.month.label} so far` : ''}
          </p>
        </div>
        <Link to="/analytics" className="btn-secondary h-9 !px-3 text-xs">
          <TrendingUp size={14} /> Deep-dive analytics <ArrowRight size={13} />
        </Link>
      </div>

      {/* KPI row */}
      {loading && !summary ? <KpiSkeletonRow /> : (
        <div className="fade-up fade-up-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total balance" value={formatINR(summary?.totalBalance)} icon={Wallet} tone="sky" delta={null} footnote={`${summary?.transactionCount ?? 0} lifetime transactions`} />
          <KpiCard label="Income · this month" value={formatINR(summary?.month?.income ?? 0)} icon={ArrowDownLeft} tone="emerald" delta={summary?.month?.incomeChange ?? null} deltaLabel="vs last month" />
          <KpiCard label="Expenses · this month" value={formatINR(summary?.month?.expense ?? 0)} icon={ArrowUpRight} tone="rose" delta={summary?.month?.expenseChange ?? null} deltaLabel="vs last month" invert />
          <KpiCard label="Savings rate" value={`${(summary?.month?.savingsRate ?? 0).toFixed(1)}%`} icon={PiggyBank} tone="amber" delta={null} footnote={`${formatINR(summary?.month?.savings ?? 0)} saved in ${summary?.month?.label?.split(' ')[0] ?? 'this month'}`} />
        </div>
      )}

      {/* cash flow + category donut */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="card fade-up fade-up-2 p-5 sm:p-6 xl:col-span-2" aria-label="Cash flow chart">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-extrabold tracking-tight">Cash flow</h3>
              <p className="text-[11px] font-medium text-muted">Income vs expenses, month over month</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-3 text-[10.5px] font-semibold text-muted sm:flex">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Income</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Expenses</span>
              </span>
              <div className="flex rounded-xl border border-line bg-card2 p-1" role="tablist" aria-label="Chart range">
                {RANGES.map((r) => (
                  <button key={r.value} role="tab" aria-selected={range === r.value} onClick={() => setRange(r.value)}
                    className={cx('rounded-lg px-2.5 py-1 text-[11px] font-bold text-muted transition-colors', range === r.value && 'bg-card text-ink shadow-sm')}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && !monthly.length ? <Skeleton className="mt-4 h-64" /> : (
            <div className="mt-4 h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.34} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.32} /><stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11, fontWeight: 600 }} dy={6} />
                  <YAxis width={46} tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} tickFormatter={(v) => formatINR(v, { compact: true })} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.4} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4.5 }} />
                  <Area type="monotone" dataKey="expense" name="Expenses" stroke="#fb7185" strokeWidth={2.4} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4.5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* category donut */}
        <section className="card fade-up fade-up-3 p-5 sm:p-6" aria-label="Expenses by category">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-extrabold tracking-tight">Where money went</h3>
              <p className="text-[11px] font-medium text-muted">Top categories · last 6 months</p>
            </div>
            <span className="chip">{cats.categories.length} categories</span>
          </div>

          {loading && !cats.categories.length ? <Skeleton className="mt-4 h-64" /> : chartCats.length ? (
            <>
              <div className="relative mx-auto mt-2 h-44 w-44 sm:h-48 sm:w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartCats} dataKey="amount" nameKey="category" innerRadius="62%" outerRadius="90%" paddingAngle={3} strokeWidth={3} stroke="var(--card)">
                      {chartCats.map((entry, i) => <Cell key={entry.category} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-faint">Total</p>
                  <p className="text-base font-extrabold tracking-tight tnum">{formatINR(cats.total, { compact: true })}</p>
                </div>
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-y-1.5">
                {chartCats.slice(0, 5).map((c, i) => (
                  <li key={c.category} className="flex items-center gap-2 text-[12px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-medium text-muted">{c.category}</span>
                    <span className="font-bold tnum">{c.percentage.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted">No expenses recorded yet.</p>
          )}
        </section>
      </div>

      {/* recent + top categories this month */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2" aria-label="Recent transactions">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="text-[15px] font-extrabold tracking-tight">Recent activity</h3>
              <p className="text-[11px] font-medium text-muted">Latest 6 transactions</p>
            </div>
            <Link to="/transactions" className="btn-ghost h-8 !px-2 text-xs text-brand-strong">View all <ArrowRight size={13} /></Link>
          </div>
          <ul className="divide-y divide-line">
            {loading && !recent.length
              ? Array.from({ length: 6 }, (_, i) => <li key={i} className="px-5 py-4"><Skeleton className="h-9 w-full" /></li>)
              : recent.map((t) => {
                  const Meta = categoryMeta(t.category);
                  const income = t.type === 'income';
                  return (
                    <li key={txId(t)} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-card2/60">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${Meta.color}1f`, color: Meta.color }}>
                        <Meta.icon size={18} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold leading-5">{t.description}</p>
                        <p className="truncate text-[10.5px] font-medium text-faint">{t.merchant ? `${t.merchant} · ` : ''}{t.category} · {formatDate(t.date)}</p>
                      </div>
                      <p className={cx('shrink-0 text-[13px] font-extrabold tnum', income ? 'text-emerald-500 dark:text-emerald-400' : 'text-ink')}>
                        {formatSigned(t.amount, t.type)}
                      </p>
                    </li>
                  );
                })}
          </ul>
        </section>

        <section className="card p-5 sm:p-6" aria-label="Top spending categories this month">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-extrabold tracking-tight">Top categories</h3>
              <p className="text-[11px] font-medium text-muted">{summary?.month?.label ?? 'This month'} spend</p>
            </div>
            <span className="chip tnum">{formatINR(monthCats.total, { compact: true })}</span>
          </div>
          <ol className="mt-4 space-y-4">
            {(loading && !monthCats.categories.length ? Array.from({ length: 5 }, () => null) : monthCats.categories.slice(0, 5)).map((c, i) =>
              c === null ? (
                <Skeleton key={i} className="h-9" />
              ) : (
                <li key={c.category}>
                  <div className="flex items-baseline justify-between gap-2 text-[12px]">
                    <span className="truncate font-semibold">{c.category}</span>
                    <span className="shrink-0 font-bold text-muted tnum">{formatINR(c.amount, { compact: true })} · {c.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-card2">
                    <div className="bar-grow h-full rounded-full" style={{ width: `${Math.max(4, (c.amount / maxMonthCat) * 100)}%`, background: categoryMeta(c.category).color }} />
                  </div>
                </li>
              )
            )}
            {!loading && monthCats.categories.length === 0 && <p className="text-sm text-muted">Nothing spent yet this month.</p>}
          </ol>
          {summary?.topCategory && (
            <div className="mt-5 rounded-2xl border border-line bg-card2/60 p-3.5 text-[11.5px] leading-5 text-muted">
              <span className="font-bold text-ink">Heads up:</span> <span className="font-semibold text-ink">{summary.topCategory.category}</span> is your biggest drain this month at {formatINR(summary.topCategory.amount)} across {summary.topCategory.count} transaction{summary.topCategory.count === 1 ? '' : 's'}.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
