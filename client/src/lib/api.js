/** Thin, typed-ish API client. Same-origin in production; Vite proxy in dev. */

const BASE = '/api';

/** Build a query string, skipping empty values. Exported for testing. */
export const toQueryString = (params = {}) => {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
};

async function request(path, { method = 'GET', params, body } = {}) {
  const res = await fetch(`${BASE}${path}${toQueryString(params)}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const err = new Error(data?.message ?? `Request failed with status ${res.status}`);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

/* ---- transactions ---- */
export const getTransactions = (params) => request('/transactions', { params });
export const getTransaction = (id) => request(`/transactions/${id}`);
export const createTransaction = (body) => request('/transactions', { method: 'POST', body });
export const updateTransaction = (id, body) => request(`/transactions/${id}`, { method: 'PUT', body });
export const deleteTransaction = (id) => request(`/transactions/${id}`, { method: 'DELETE' });
export const bulkDeleteTransactions = (ids) => request('/transactions', { method: 'DELETE', body: { ids } });

/** Fetch every transaction matching filters (≤100/page) for CSV export — hard-capped at 1000 rows */
export const getAllTransactionsMatching = async (params) => {
  const first = await getTransactions({ ...params, page: 1, limit: 100 });
  const rows = [...first.data];
  const totalPages = first.meta?.totalPages ?? 1;
  for (let page = 2; page <= Math.min(totalPages, 10); page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const next = await getTransactions({ ...params, page, limit: 100 });
    rows.push(...next.data);
  }
  return rows;
};

/* ---- analytics ---- */
export const getSummary = () => request('/analytics/summary');
export const getMonthly = (months = 12) => request('/analytics/monthly', { params: { months } });
export const getCategoryBreakdown = ({ type = 'expense', months = 6 } = {}) =>
  request('/analytics/categories', { params: { type, months } });
export const getDailyFlow = (days = 30) => request('/analytics/daily', { params: { days } });
export const getRecentTransactions = (limit = 6) => request('/analytics/recent', { params: { limit } });
