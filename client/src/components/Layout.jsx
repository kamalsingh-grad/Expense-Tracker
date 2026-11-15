import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowRightLeft, ChartPie, Search, Plus, Sun, Moon, Bell, Menu, X, Target,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/format';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { to: '/analytics', label: 'Analytics', icon: ChartPie },
];

const PAGE_META = [
  { match: (p) => p === '/', title: 'Dashboard', subtitle: 'Your money at a glance' },
  { match: (p) => p.startsWith('/transactions'), title: 'Transactions', subtitle: 'Search, filter, sort and export every entry' },
  { match: (p) => p.startsWith('/analytics'), title: 'Analytics', subtitle: 'Trends, breakdowns and auto-generated insights' },
];

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="ExpenseFlow home">
      <svg width="38" height="38" viewBox="0 0 64 64" className="shrink-0 transition-transform duration-200 group-hover:scale-105" aria-hidden="true">
        <defs>
          <linearGradient id="ef-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#10b981" /><stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#ef-logo)" />
        <path d="M14 40 L24 29 L32 36 L48 19" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M38 19 h10 v10" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[17px] font-extrabold tracking-tight text-white">ExpenseFlow</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400/80">Personal Finance</span>
      </span>
    </Link>
  );
}

function Sidebar({ open, onClose }) {
  const savings = { current: 310000, goal: 500000 };
  const pct = Math.round((savings.current / savings.goal) * 100);

  return (
    <>
      {/* mobile overlay */}
      <div
        className={cx('fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="sidebar"
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-white/5 bg-gradient-to-b from-[#0c1425] via-[#0b1220] to-[#080d18] transition-transform duration-300 ease-in-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <Logo />
          <button type="button" className="btn-icon h-8 w-8 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Primary navigation">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Menu</p>
          <ul className="mt-2 space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cx(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-emerald-400/10 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg transition-colors', isActive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.03] text-slate-500 group-hover:text-slate-200')}>
                        <Icon size={17} strokeWidth={2} />
                      </span>
                      <span className="flex-1">{label}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* savings goal card */}
          <div className="mt-7 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <Target size={13} className="text-emerald-400" /> Savings goal
              </p>
              <span className="text-[11px] font-bold text-emerald-300 tnum">{pct}%</span>
            </div>
            <p className="mt-2.5 text-lg font-extrabold text-white tnum">₹3,10,000 <span className="text-xs font-semibold text-slate-500">/ ₹5,00,000</span></p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Savings goal progress">
              <div className="bar-grow h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[10.5px] leading-4 text-slate-500">On track — ₹1,90,000 to go. Keep the streak alive.</p>
          </div>
        </nav>

        {/* workspace footer */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-[13px] font-extrabold text-[#03120c]">AS</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-white">Aarav Sharma</p>
              <p className="truncate text-[10.5px] font-medium text-slate-500">Demo workspace · In-memory data</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return document.documentElement.classList.contains('dark') ? 'dark' : 'light'; } catch { return 'dark'; }
  });
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const meta = useMemo(() => PAGE_META.find((m) => m.match(location.pathname)) ?? PAGE_META[0], [location.pathname]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('ef-theme', next); } catch { /* private mode */ }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/transactions?search=${encodeURIComponent(q)}` : '/transactions');
  };

  return (
    <div className="app-ambient min-h-screen text-ink">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-[276px]">
        {/* top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-app/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-content items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
            <button type="button" className="btn-icon lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu" aria-controls="sidebar">
              <Menu size={20} />
            </button>

            <div className="hidden min-w-0 md:block">
              <h1 className="text-[15px] font-extrabold leading-5 tracking-tight">{meta.title}</h1>
              <p className="truncate text-[11px] font-medium text-muted">{meta.subtitle}</p>
            </div>

            <div className="flex-1" />

            {/* global search */}
            <form onSubmit={submitSearch} role="search" className="relative hidden sm:block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transactions…"
                aria-label="Search transactions"
                className="h-9 w-44 rounded-xl border border-line bg-card2 pl-9 pr-14 text-[13px] outline-none transition-all placeholder:text-faint focus:w-64 focus:border-brand focus:ring-2 lg:w-52 lg:focus:w-72"
                style={{ '--tw-ring-color': 'var(--ring)' }}
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <kbd className="kbd">⌘</kbd><kbd className="kbd">K</kbd>
              </span>
            </form>

            <button
              type="button"
              className="btn-icon relative"
              aria-label="Notifications"
              onClick={() => toast.info('You are all caught up', 'No new alerts. New spend insights appear every Monday.')}
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-app" aria-hidden="true" />
            </button>

            <button type="button" className="btn-icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button type="button" className="btn-primary h-9 !px-3 sm:!px-4" onClick={() => navigate('/transactions?add=1')}>
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Add transaction</span>
            </button>
          </div>
        </header>

        {/* page content */}
        <main className="mx-auto w-full max-w-content flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Outlet />
        </main>

        <footer className="border-t border-line py-4">
          <p className="mx-auto max-w-content px-4 text-center text-[11px] font-medium text-faint sm:px-6 lg:px-8">
            ExpenseFlow · Built with React, Express & MongoDB · <span className="text-muted">Demo data resets on redeploy</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
