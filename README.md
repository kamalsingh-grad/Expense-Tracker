# ExpenseFlow — Full-Stack Expense Tracker

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss&logoColor=black" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-76%20passing-10b981" />
</p>

A **production-grade, single-user expense tracker** with a modern React dashboard, a hardened Express REST API on MongoDB, full CRUD for financial transactions, and responsive data-visualisation with filtering, sorting, searching and CSV export — all wrapped in a polished dark/light design system.

## Highlights

- **Full-stack CRUD** — create, read, update, delete & bulk-delete financial transactions via a validated REST API (express-validator, consistent JSON errors, enums, indexes).
- **Responsive dashboard** — KPI cards with month-over-month deltas, 12-month cash-flow area chart, category donut, recent-activity feed, top-spend categories with animated bars.
- **Transactions workbench** — debounced search across description/merchant/tags, type & category filters, date and amount ranges, quick-range chips, **8 sortable dimensions**, server-side pagination (10/25/50), row selection with bulk delete, **CSV export of the filtered view**.
- **Analytics page** — income vs expense bars, savings-rate trend line with 20% target reference, expense/income category breakdown with donut + share bars, 30-day net cash-flow chart, auto-generated insights (peak-spend month, top category, average savings rate) and a month-by-month ledger table.
- **Professional UX** — dark & light themes (persisted), ₹/en-IN formatting, ⌘K global search, toast notifications, skeleton loaders, empty states, focus-visible rings, `prefers-reduced-motion` support, mobile drawer navigation + horizontally scrollable tables.
- **76 automated tests** — 45 backend API/integration tests (Jest + Supertest + in-memory MongoDB) and 31 frontend tests (Vitest + Testing Library).
- **Zero-config demo** — boots with 404 realistic transactions spanning 12 months (seeded deterministically) when no database is configured; point `MONGODB_URI` at MongoDB Atlas for production.

## Feature checklist (resume-aligned)

| Requirement | Status |
|---|---|
| React.js dashboard | ✅ Dashboard + Analytics pages |
| Node.js / Express.js REST APIs | ✅ `/api/transactions`, `/api/analytics/*` |
| MongoDB persistence | ✅ Mongoose models + indexes; in-memory fallback |
| CRUD for transactions | ✅ Full lifecycle + bulk delete |
| Responsive data-visualisation | ✅ Recharts (area, bar, line, donut, composed) |
| Filtering & sorting | ✅ Server-side: search, type, category, date/amount range, sort by date/amount/description/category |
| Professional & modern design | ✅ Token-based design system, dark/light |
| Full responsiveness | ✅ Mobile drawer, fluid grids, scrollable tables, `clamp()` typography |
| Tested | ✅ 45 + 31 tests, all passing |

## Tech stack

**Client:** React 18, Vite 5, Tailwind CSS 3 (CSS-variable design tokens), Recharts, React Router 6, Lucide icons, Vitest + Testing Library.
**Server:** Node 20, Express 4, Mongoose 8, helmet, cors, morgan, express-rate-limit, express-validator, dotenv; MongoDB (Atlas in prod, `mongodb-memory-server` for demo/tests).
**Testing:** Jest + Supertest (API contract & integration), Vitest + jsdom (components).

## Project structure

```
expense-tracker/
├── client/                    # React SPA (Vite)
│   └── src/
│       ├── components/        # Layout (sidebar+topbar), KpiCard, Pagination,
│       │                      # TransactionModal, ConfirmDialog, ChartTooltip …
│       ├── pages/             # Dashboard.jsx · Transactions.jsx · Analytics.jsx
│       ├── lib/               # api client, formatting (en-IN/INR), CSV, categories
│       ├── context/           # ToastContext
│       └── __tests__/         # 31 Vitest tests
└── server/                    # Express + MongoDB API
    ├── src/
    │   ├── models/Transaction.js      # schema, indexes, toJSON transform
    │   ├── routes/transactions.js     # CRUD + filter/sort/paginate/search
    │   ├── routes/analytics.js        # summary, monthly, categories, daily, recent
    │   ├── config/db.js               # Atlas (prod) or in-memory (demo/test)
    │   ├── utils/seed.js              # deterministic 12-month demo dataset
    │   └── app.js / server.js         # security middleware, static SPA hosting
    └── tests/                         # 45 Jest + Supertest integration tests
```

## Getting started

```bash
# 1. Install dependencies
npm install --prefix server
npm install --prefix client

# 2a. One-command dev (API :5000 with proxy + Vite dev server :5173)
npm run dev

# 2b. …or production-style single process (Express serves the built SPA on :5000)
npm run build
npm start
```

Open **http://localhost:5000** (or Vite's http://localhost:5173 during dev). No database setup is required for the demo — a real MongoDB binary is downloaded automatically and seeded with 12 months of realistic data (salary, rent, SIP, Swiggy/Zomato, BigBasket, PSPCL, Jio, festive shopping…).

### Environment variables (`server/.env`)

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | HTTP port | `5000` |
| `MONGODB_URI` | Atlas/external MongoDB (omit for in-memory demo) | _unset_ |
| `SEED_ON_START` | Seed demo data when DB is empty | `true` |
| `TZ` | Month/week math timezone | `Asia/Kolkata` |

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness + env info |
| `GET` | `/api/transactions?page=1&limit=10&search=&type=&category=&startDate=&endDate=&minAmount=&maxAmount=&sortBy=date&sortOrder=desc` | Filtered, sorted, paginated ledger (returns `{ data, meta }`) |
| `POST` | `/api/transactions` | Create (validated) → `201` |
| `GET` | `/api/transactions/:id` | Single record (`400` malformed id, `404` missing) |
| `PUT` | `/api/transactions/:id` | Update (validated) |
| `DELETE` | `/api/transactions/:id` | Delete one |
| `DELETE` | `/api/transactions` `{ ids: [] }` | Bulk delete (≤500 ids) |
| `GET` | `/api/analytics/summary` | Balance, savings rate, month-over-month deltas, top category |
| `GET` | `/api/analytics/monthly?months=12` | Income vs expense per month (zero-filled) |
| `GET` | `/api/analytics/categories?type=expense&months=6` | Category share with percentages |
| `GET` | `/api/analytics/daily?days=30` | Daily income/expense/net series |
| `GET` | `/api/analytics/recent?limit=6` | Latest transactions |

Error format is always `{ "message": string, "details"?: [{ field, message }] }` with the right status code (400/404/409/500).

## Testing

```bash
npm test                 # both suites
npm run test:server      # 45 Jest + Supertest integration tests (real in-memory MongoDB)
npm run test:client      # 31 Vitest + Testing Library component tests
```

Backend coverage includes: validation matrices, pagination boundaries & non-overlap, search regex-escaping, date/amount filters, all sort orders, 400/404/409 paths, analytics aggregation correctness, and empty-database edge cases. Frontend coverage includes: INR/en-IN formatting, CSV escaping, query-string builder, pagination window logic, the full transaction-modal flow (validation → submit → edit hydration), and app-shell rendering across routes.

## Design decisions

- **In-memory MongoDB for demo/tests** — uses a real `mongod` binary, so behaviour matches Atlas; swap via one env var.
- **Aggregates in Mongo, not JS** — `$group`/`$cond` pipelines for summary, monthly, category and daily series; compound indexes `{date:-1}`, `{type:1, category:1, date:-1}`.
- **CSS variables + Tailwind** — one token set (`--card`, `--line`, `--brand`…) powers both themes; no utility soup in JSX.
- **No external runtime CDN deps** (fonts degrade gracefully) — the built app is fully self-contained.

## Resume bullet

> **Expense Tracker Application** · React.js, Node.js, Express.js, MongoDB — Built a full-stack expense tracker with a React.js dashboard and Node.js/Express.js REST APIs on MongoDB. Implemented CRUD for financial transactions and responsive data-visualisation with filtering and sorting.

MIT © 2026 Aarav Sharma
