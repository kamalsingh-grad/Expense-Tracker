/** Currency & date formatting helpers (en-IN / INR) */

const inr = (opts) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', ...opts });

const whole = inr({ maximumFractionDigits: 0 });
const precise = inr({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });

export const formatINR = (n, { decimals = false, compact: c = false } = {}) => {
  const value = Number(n) || 0;
  if (c) return compact.format(value);
  return decimals ? precise.format(value) : whole.format(Math.round(value));
};

/** +₹1,20,000 / −₹8,499 — explicit sign for ledgers */
export const formatSigned = (n, type) => {
  const value = Math.abs(Number(n) || 0);
  const s = whole.format(value);
  return type === 'expense' ? `−${s}` : `+${s}`;
};

export const formatPct = (n, { signed = false, digits = 1 } = {}) => {
  const v = Number(n) || 0;
  const sign = signed && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(digits)}%`;
};

export const formatDate = (d, opts) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts });

export const formatDateShort = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const formatDateLong = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** ISO yyyy-mm-dd for <input type="date"> and API filters */
export const toISODate = (d) => {
  const date = new Date(d);
  const pad = (x) => String(x).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'EF';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

export const txId = (t) => t?.id ?? t?._id;
