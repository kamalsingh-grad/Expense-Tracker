import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight, CheckSquare, ChevronsUpDown, Download, Loader2,
  Pencil, Plus, Receipt, Search, Trash2, X,
} from 'lucide-react';
import { bulkDeleteTransactions, deleteTransaction, getAllTransactionsMatching, getTransactions } from '../lib/api';
import { ALL_EXPORT_CATEGORIES } from '../lib/categoryOptions';
import { categoryMeta } from '../lib/categories';
import { cx, formatDate, formatSigned, toISODate, txId } from '../lib/format';
import { transactionsToCSV, downloadCSV } from '../lib/csv';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import TransactionModal from '../components/TransactionModal';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

const SORT_ICONS = { asc: ArrowUp, desc: ArrowDown };

function SortButton({ label, field, sortBy, sortOrder, onSort, className }) {
  const active = sortBy === field;
  const Icon = active ? SORT_ICONS[sortOrder] : ChevronsUpDown;
  return (
    <button type="button" onClick={() => onSort(field)} className={cx('th-sort', active && 'text-ink', className)} aria-label={`Sort by ${label}${active ? ` (${sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}>
      {label}
      <Icon size={13} strokeWidth={2.4} className={active ? 'text-brand-strong' : 'text-faint'} />
    </button>
  );
}

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const filters = useMemo(() => {
    const g = (k, d = '') => searchParams.get(k) ?? d;
    return {
      search: g('search'), type: g('type'), category: g('category'),
      from: g('from'), to: g('to'), min: g('min'), max: g('max'),
      sortBy: g('sortBy', 'date'), sortOrder: g('sortOrder', 'desc'),
      page: Math.max(1, Number(g('page', '1')) || 1),
      limit: Math.min(50, Math.max(10, Number(g('limit', '10')) || 10)),
    };
  }, [searchParams]);
  const queryKey = JSON.stringify(filters);

  const setFilters = useCallback((patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    }
    if (resetPage) next.delete('page');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const resetFilters = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  /* debounced search */
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef(null);
  useEffect(() => { setSearchInput(filters.search); }, [filters.search]);
  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearchInput(v);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setFilters({ search: v }), 350);
  };

  /* data loading */
  const [data, setData] = useState({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const refetch = useCallback(() => setRefresh((r) => r + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTransactions({
      search: filters.search || undefined,
      type: filters.type || undefined,
      category: filters.category || undefined,
      startDate: filters.from || undefined,
      endDate: filters.to || undefined,
      minAmount: filters.min || undefined,
      maxAmount: filters.max || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit,
    })
      .then((res) => { if (alive) { setData(res); setLoading(false); } })
      .catch((err) => { if (alive) { toast.error('Failed to load transactions', err.message); setLoading(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, refresh]);

  /* selection */
  const [selected, setSelected] = useState(() => new Set());
  useEffect(() => { setSelected(new Set()); }, [queryKey, refresh]);
  const pageIds = data.data.map(txId);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allChecked) pageIds.forEach((id) => next.delete(id)); else pageIds.forEach((id) => next.add(id));
    return next;
  });
  const toggleOne = (id) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  /* modal + delete dialogs */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setEditing(null);
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (tx) => { setEditing(tx); setModalOpen(true); };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteTarget) await deleteTransaction(txId(deleteTarget));
      else await bulkDeleteTransactions([...selected]);
      toast.success(deleteTarget ? 'Transaction deleted' : `Deleted ${selected.size} transaction${selected.size === 1 ? '' : 's'}`, deleteTarget?.description);
      setDeleteTarget(null);
      setBulkConfirm(false);
      refetch();
    } catch (err) {
      toast.error('Delete failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  /* CSV export respects the active filters */
  const [exporting, setExporting] = useState(false);
  const exportCSV = async () => {
    setExporting(true);
    try {
      const rows = await getAllTransactionsMatching({
        search: filters.search || undefined, type: filters.type || undefined, category: filters.category || undefined,
        startDate: filters.from || undefined, endDate: filters.to || undefined,
        minAmount: filters.min || undefined, maxAmount: filters.max || undefined,
        sortBy: filters.sortBy, sortOrder: filters.sortOrder,
      });
      downloadCSV(`expenseflow-transactions-${toISODate(new Date())}.csv`, transactionsToCSV(rows));
      toast.success('Export ready', `${rows.length} transaction${rows.length === 1 ? '' : 's'} downloaded as CSV`);
    } catch (err) {
      toast.error('Export failed', err.message);
    } finally {
      setExporting(false);
    }
  };

  const toggleSort = (field) => {
    if (filters.sortBy === field) setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    else setFilters({ sortBy: field, sortOrder: 'desc' });
  };

  const applyQuickRange = (kind) => {
    const now = new Date();
    if (kind === 'all') return setFilters({ from: '', to: '' });
    if (kind === 'month') return setFilters({ from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) });
    if (kind === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); return setFilters({ from: toISODate(d), to: toISODate(now) }); }
    if (kind === '6m') return setFilters({ from: toISODate(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to: toISODate(now) });
    return undefined;
  };

  const activeFilterCount = [filters.search, filters.type, filters.category, filters.from, filters.to, filters.min, filters.max].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">All transactions</h2>
          <span className="chip tnum">{loading && data.meta.total === 0 ? '…' : `${data.meta.total} total`}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary h-9 !px-3 text-xs" onClick={exportCSV} disabled={exporting}>
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden xs:inline">Export CSV</span>
          </button>
          <button type="button" className="btn-primary h-9 !px-3 sm:!px-4" onClick={openAdd}>
            <Plus size={15} strokeWidth={2.5} /> Add transaction
          </button>
        </div>
      </div>

      {/* filter bar */}
      <section className="card p-4" aria-label="Filters">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-12">
          {/* search */}
          <div className="relative col-span-2 md:col-span-3">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input value={searchInput} onChange={onSearchChange} placeholder="Search description, merchant, tag…" aria-label="Search transactions" className="input h-9 !pl-9 text-[13px]" />
          </div>

          {/* type segmented */}
          <div className="col-span-2 flex h-9 items-center rounded-xl border border-line bg-card2 p-1 md:col-span-3" role="group" aria-label="Filter by type">
            {[['', 'All'], ['income', 'Income'], ['expense', 'Expense']].map(([value, label]) => (
              <button key={label} type="button" onClick={() => setFilters({ type: value })} aria-pressed={filters.type === value}
                className={cx('h-full flex-1 rounded-lg text-[12px] font-semibold text-muted transition-all', filters.type === value && 'bg-card text-ink shadow-sm')}>
                {label}
              </button>
            ))}
          </div>

          {/* category */}
          <select value={filters.category} onChange={(e) => setFilters({ category: e.target.value })} className="input h-9 text-[13px] md:col-span-2" aria-label="Filter by category">
            <option value="">All categories</option>
            {ALL_EXPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* date range */}
          <input type="date" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} className="input h-9 text-[13px]" aria-label="From date" max={filters.to || undefined} />
          <input type="date" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} className="input h-9 text-[13px]" aria-label="To date" min={filters.from || undefined} />

          {/* amount range */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-faint">₹≥</span>
            <input type="number" min="0" value={filters.min} onChange={(e) => setFilters({ min: e.target.value })} placeholder="Min" aria-label="Minimum amount" className="input h-9 !pl-8 text-[13px] tnum" />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-faint">₹≤</span>
            <input type="number" min="0" value={filters.max} onChange={(e) => setFilters({ max: e.target.value })} placeholder="Max" aria-label="Maximum amount" className="input h-9 !pl-8 text-[13px] tnum" />
          </div>
        </div>

        {/* quick ranges + reset */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <span className="mr-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">Quick</span>
          {[['all', 'All time'], ['month', 'This month'], ['30d', 'Last 30 days'], ['6m', 'Last 6 months']].map(([kind, label]) => {
            const active = kind === 'all' ? !filters.from && !filters.to : kind === 'month' && filters.from === toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
            return <button key={kind} type="button" onClick={() => applyQuickRange(kind)} className={cx('chip transition-colors', active && 'chip-active')}>{label}</button>;
          })}
          <div className="flex-1" />
          {activeFilterCount > 0 && (
            <button type="button" className="btn-ghost h-8 !px-2.5 text-[11px] text-danger" onClick={resetFilters}>
              <X size={13} /> Reset filters ({activeFilterCount})
            </button>
          )}
        </div>
      </section>

      {/* bulk selection bar */}
      {selected.size > 0 && (
        <div className="fade-up flex flex-wrap items-center gap-3 rounded-2xl border border-brand/40 bg-brand-soft px-4 py-2.5">
          <CheckSquare size={16} className="text-brand-strong" />
          <p className="text-[13px] font-bold text-ink"><span className="tnum">{selected.size}</span> selected</p>
          <div className="flex-1" />
          <button type="button" className="btn-secondary h-8 !px-3 text-xs !border-danger/40 !text-danger hover:!bg-danger-soft" onClick={() => setBulkConfirm(true)}>
            <Trash2 size={13} /> Delete selected
          </button>
          <button type="button" className="btn-ghost h-8 !px-3 text-xs" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* table */}
      <section className="card overflow-hidden" aria-label="Transactions list">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all on this page" className="h-4 w-4 cursor-pointer accent-emerald-500" />
                </th>
                <th className="px-3 py-3"><SortButton label="Date" field="date" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={toggleSort} /></th>
                <th className="px-3 py-3"><SortButton label="Description" field="description" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={toggleSort} /></th>
                <th className="px-3 py-3"><SortButton label="Category" field="category" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={toggleSort} /></th>
                <th className="hidden px-3 py-3 xl:table-cell">Method</th>
                <th className="px-3 py-3 text-right"><SortButton label="Amount" field="amount" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={toggleSort} className="ml-auto" /></th>
                <th className="w-24 px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: Math.min(filters.limit, 10) }, (_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-2.5"><Skeleton className="h-9 w-full" /></td></tr>
                ))
              ) : data.data.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={Receipt} title="No transactions match" description="Try widening the date range, clearing the search, or removing a filter."
                    action={activeFilterCount > 0 && <button type="button" className="btn-secondary" onClick={resetFilters}><X size={14} /> Clear all filters</button>} />
                </td></tr>
              ) : (
                data.data.map((t) => {
                  const id = txId(t);
                  const Meta = categoryMeta(t.category);
                  const income = t.type === 'income';
                  const TypeIcon = income ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <tr key={id} className={cx('transition-colors hover:bg-card2/70', selected.has(id) && 'bg-brand-soft/40')}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(id)} onChange={() => toggleOne(id)} aria-label={`Select ${t.description}`} className="h-4 w-4 cursor-pointer accent-emerald-500" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="font-semibold leading-5">{formatDate(t.date)}</p>
                        <p className="text-[10.5px] font-medium uppercase text-faint">{new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                      </td>
                      <td className="max-w-[260px] px-3 py-3">
                        <p className="truncate font-semibold leading-5">{t.description}</p>
                        <p className="truncate text-[10.5px] font-medium text-faint">{t.merchant || '—'}{Array.isArray(t.tags) && t.tags.length ? ` · #${t.tags.join(' #')}` : ''}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card2 px-2.5 py-1 text-[10.5px] font-bold text-muted">
                          <span className="h-2 w-2 rounded-full" style={{ background: Meta.color }} aria-hidden="true" />
                          {t.category}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-[12px] font-medium text-muted xl:table-cell">{t.paymentMethod}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <span className={cx('inline-flex items-center gap-1 font-extrabold tnum', income ? 'text-emerald-500 dark:text-emerald-400' : 'text-ink')}>
                          <TypeIcon size={14} strokeWidth={2.6} className={income ? '' : 'text-rose-400'} aria-hidden="true" />
                          {formatSigned(t.amount, t.type)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" className="btn-icon h-8 w-8" onClick={() => openEdit(t)} aria-label={`Edit ${t.description}`}><Pencil size={15} /></button>
                          <button type="button" className="btn-icon h-8 w-8 hover:!text-danger" onClick={() => setDeleteTarget(t)} aria-label={`Delete ${t.description}`}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          limit={filters.limit}
          onPageChange={(p) => setFilters({ page: p }, { resetPage: false })}
          onLimitChange={(limit) => setFilters({ limit })}
        />
      </section>

      {/* add / edit modal */}
      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={refetch} editing={editing} defaultType={filters.type === 'income' ? 'income' : 'expense'} />

      {/* delete confirmations */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete transaction?"
        description={deleteTarget ? `“${deleteTarget.description}” (${formatSigned(deleteTarget.amount, deleteTarget.type)}) will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Delete transaction"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={bulkConfirm}
        title={`Delete ${selected.size} transaction${selected.size === 1 ? '' : 's'}?`}
        description="Every selected transaction will be permanently removed. This cannot be undone."
        confirmLabel="Delete all selected"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setBulkConfirm(false)}
      />
    </div>
  );
}
