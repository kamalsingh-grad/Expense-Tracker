import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Loader2, X } from 'lucide-react';
import { createTransaction, updateTransaction } from '../lib/api';
import { cx, toISODate, txId } from '../lib/format';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../lib/categories';
import { useToast } from '../context/ToastContext';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense', icon: ArrowUpRight, active: 'border-rose-400/60 bg-rose-400/10 text-rose-400' },
  { value: 'income', label: 'Income', icon: ArrowDownLeft, active: 'border-emerald-400/60 bg-emerald-400/10 text-emerald-400' },
];

const emptyForm = (defaultType) => ({
  type: defaultType,
  amount: '',
  description: '',
  merchant: '',
  category: defaultType === 'income' ? 'Salary' : 'Food & Dining',
  date: toISODate(new Date()),
  paymentMethod: 'UPI',
  tags: '',
  notes: '',
});

export default function TransactionModal({ open, onClose, onSaved, editing, defaultType = 'expense' }) {
  const [form, setForm] = useState(() => emptyForm(defaultType));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const categories = useMemo(() => (form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES), [form.type]);

  /* Reset whenever the dialog is (re)opened; hydrate when editing */
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        type: editing.type,
        amount: String(editing.amount),
        description: editing.description ?? '',
        merchant: editing.merchant ?? '',
        category: editing.category,
        date: toISODate(editing.date),
        paymentMethod: editing.paymentMethod ?? 'UPI',
        tags: Array.isArray(editing.tags) ? editing.tags.join(', ') : '',
        notes: editing.notes ?? '',
      });
    } else {
      setForm(emptyForm(defaultType));
    }
    setErrors({});
    setSaving(false);
  }, [open, editing, defaultType]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      if (field === 'type') {
        /* keep category coherent with type */
        const list = value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        return { ...f, type: value, category: list.includes(f.category) ? f.category : list[0] };
      }
      return { ...f, [field]: value };
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    const amount = Number(form.amount);
    if (form.amount === '' || Number.isNaN(amount)) next.amount = 'Amount is required';
    else if (amount <= 0) next.amount = 'Must be greater than 0';
    else if (amount > 100000000) next.amount = 'Too large';
    if (!form.description.trim()) next.description = 'Description is required';
    else if (form.description.trim().length > 120) next.description = 'Max 120 characters';
    if (!form.date || Number.isNaN(new Date(form.date).getTime())) next.date = 'Pick a valid date';
    if (!categories.includes(form.category)) next.category = 'Choose a category';
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length > 5) next.tags = 'At most 5 tags';
    else if (tags.some((t) => t.length > 24)) next.tags = 'Each tag ≤ 24 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    const payload = {
      type: form.type,
      amount: Number(form.amount),
      description: form.description.trim(),
      merchant: form.merchant.trim(),
      category: form.category,
      date: new Date(`${form.date}T12:00:00`).toISOString(),
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editing) await updateTransaction(txId(editing), payload);
      else await createTransaction(payload);
      toast.success(editing ? 'Transaction updated' : 'Transaction added', payload.description);
      onSaved?.();
      onClose();
    } catch (err) {
      if (Array.isArray(err.details) && err.details.length) {
        const mapped = {};
        for (const d of err.details) mapped[d.field] = d.message;
        setErrors((prev) => ({ ...prev, ...mapped }));
        toast.error('Please fix the highlighted fields', err.details[0]?.message);
      } else {
        toast.error('Could not save transaction', err.message);
      }
      setSaving(false);
    }
  };

  const errorText = (field) => errors[field] && <p className="mt-1 text-[11px] font-semibold text-danger" role="alert">{errors[field]}</p>;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="tx-modal-title">
      <button type="button" aria-label="Close" className="overlay-in absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" onClick={() => !saving && onClose()} />

      <form onSubmit={submit} noValidate className="modal-in relative flex max-h-[96vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-card shadow-lift sm:m-4 sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h2 id="tx-modal-title" className="text-[15px] font-extrabold tracking-tight">{editing ? 'Edit transaction' : 'Add transaction'}</h2>
          <button type="button" className="btn-icon h-8 w-8" onClick={onClose} disabled={saving} aria-label="Close dialog"><X size={17} /></button>
        </div>

        {/* body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {/* type toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-card2 p-1.5" role="tablist" aria-label="Transaction type">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon, active }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={form.type === value}
                onClick={() => set('type')({ target: { value } })}
                className={cx('flex items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-[13px] font-bold text-muted transition-all', form.type === value && active)}
              >
                <Icon size={15} strokeWidth={2.5} /> {label}
              </button>
            ))}
          </div>

          {/* amount */}
          <div>
            <label className="label" htmlFor="tx-amount">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-faint">₹</span>
              <input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={set('amount')}
                placeholder="0"
                aria-invalid={Boolean(errors.amount)}
                className={cx('input h-14 !rounded-2xl !pl-9 text-xl font-extrabold tracking-tight tnum', errors.amount && '!border-danger')}
              />
            </div>
            {errorText('amount')}
          </div>

          {/* description + merchant */}
          <div className="grid gap-4 sm:grid-cols-5">
            <div className="sm:col-span-3">
              <label className="label" htmlFor="tx-description">Description *</label>
              <input id="tx-description" className={cx('input', errors.description && '!border-danger')} value={form.description} onChange={set('description')} placeholder="e.g. Dinner at Swiggy" maxLength={120} aria-invalid={Boolean(errors.description)} />
              {errorText('description')}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="tx-merchant">Merchant</label>
              <input id="tx-merchant" className="input" value={form.merchant} onChange={set('merchant')} placeholder="e.g. Swiggy" maxLength={80} />
            </div>
          </div>

          {/* category + date + method */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
            <div className="col-span-2 sm:col-span-2">
              <label className="label" htmlFor="tx-category">Category *</label>
              <select id="tx-category" className={cx('input', errors.category && '!border-danger')} value={form.category} onChange={set('category')}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errorText('category')}
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label" htmlFor="tx-date">Date *</label>
              <input id="tx-date" type="date" className={cx('input', errors.date && '!border-danger')} value={form.date} onChange={set('date')} aria-invalid={Boolean(errors.date)} />
              {errorText('date')}
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label" htmlFor="tx-method">Method</label>
              <select id="tx-method" className="input" value={form.paymentMethod} onChange={set('paymentMethod')}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* tags + notes */}
          <div className="grid gap-4">
            <div>
              <label className="label" htmlFor="tx-tags">Tags <span className="normal-case text-faint">(comma separated, max 5)</span></label>
              <input id="tx-tags" className={cx('input', errors.tags && '!border-danger')} value={form.tags} onChange={set('tags')} placeholder="food, weekend" />
              {errorText('tags')}
            </div>
            <div>
              <label className="label" htmlFor="tx-notes">Notes</label>
              <textarea id="tx-notes" className="input min-h-[64px] resize-y" value={form.notes} onChange={set('notes')} placeholder="Optional note…" maxLength={300} />
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary min-w-[8.5rem]" disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : editing ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
