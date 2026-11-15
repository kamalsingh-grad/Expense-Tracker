const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const transactionsRouter = require('./routes/transactions');
const analyticsRouter = require('./routes/analytics');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

/* ---- security & plumbing ---- */
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false })); // SPA serves its own bundle; keep other helmet protections
app.use(
  cors({
    origin: isProd ? false : ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173'],
    credentials: false,
  })
);
app.use(express.json({ limit: '1mb' }));
if (!isTest) app.use(morgan(isProd ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

/* ---- API routes ---- */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV ?? 'development', time: new Date().toISOString() });
});
app.use('/api/transactions', transactionsRouter);
app.use('/api/analytics', analyticsRouter);

/* ---- static client (production build) with SPA fallback ---- */
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h', index: 'index.html' }));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.get('/', (_req, res) =>
    res.json({ name: 'ExpenseFlow API', docs: '/api/health', hint: 'Build the client (npm run build --prefix client) to serve the UI from this server.' })
  );
}

/* ---- 404 + error handling ---- */
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
