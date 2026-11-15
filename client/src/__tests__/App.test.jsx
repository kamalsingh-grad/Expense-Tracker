import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ToastProvider } from '../context/ToastContext';

/* recharts needs measurable layout — stub it for jsdom */
vi.mock('recharts', () => {
  const Stub = ({ children }) => <div data-testid="chart-stub">{children}</div>;
  const Null = () => null;
  return {
    ResponsiveContainer: Stub, AreaChart: Stub, BarChart: Stub, LineChart: Stub, ComposedChart: Stub, PieChart: Stub,
    Area: Null, Bar: Null, Line: Null, Pie: Null, Cell: Null,
    XAxis: Null, YAxis: Null, CartesianGrid: Null, Tooltip: Null, ReferenceLine: Null,
  };
});

const summary = {
  totalBalance: 462692, totalIncome: 1237447, totalExpense: 774755, savingsRate: 37.4, transactionCount: 404,
  avgMonthlyExpense: 64563,
  month: { key: '2026-11', label: 'November 2026', income: 92022, expense: 55098, savings: 36924, savingsRate: 40.1, incomeChange: -23.2, expenseChange: -29.1, transactions: 18 },
  topCategory: { category: 'Rent & Housing', amount: 16500, count: 1 },
};

const fetchMock = vi.fn(async (url) => {
  const path = String(url);
  const respond = (body) => ({ ok: true, status: 200, json: async () => body });
  if (path.includes('/api/analytics/summary')) return respond(summary);
  if (path.includes('/api/analytics/monthly')) return respond([{ month: '2026-11', label: 'Nov', fullLabel: 'November 2026', income: 92022, expense: 55098, savings: 36924, transactions: 18 }]);
  if (path.includes('/api/analytics/categories')) return respond({ type: 'expense', total: 55098, categories: [{ category: 'Rent & Housing', amount: 16500, count: 1, percentage: 29.9 }] });
  if (path.includes('/api/analytics/recent')) return respond([{ id: 't1', type: 'expense', amount: 799, category: 'Utilities', description: 'JioFiber broadband', merchant: 'Jio', date: new Date().toISOString(), paymentMethod: 'Auto Debit', tags: [] }]);
  if (path.includes('/api/transactions')) return respond({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false } });
  return { ok: false, status: 404, json: async () => ({ message: 'not found' }) };
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockClear();
});

const renderApp = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MemoryRouter>
  );

describe('ExpenseFlow app shell', () => {
  it('renders the sidebar navigation and footer', async () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: /expenseflow home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Analytics$/i })).toBeInTheDocument();
    expect(await screen.findByText('Total balance')).toBeInTheDocument();
  });

  it('loads and displays the dashboard KPIs', async () => {
    renderApp('/');
    expect(await screen.findByText('Income · this month')).toBeInTheDocument();
    expect(screen.getByText('JioFiber broadband')).toBeInTheDocument();
  });

  it('renders the transactions route without crashing', async () => {
    renderApp('/transactions');
    expect(await screen.findByText('All transactions')).toBeInTheDocument();
    expect(screen.getByText(/No transactions match/i)).toBeInTheDocument();
  });
});
