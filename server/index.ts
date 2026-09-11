import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Routes
import incidentsRouter    from './routes/incidents.js';
import assetsRouter       from './routes/assets.js';
import equityRouter       from './routes/equity.js';
import syncRouter         from './routes/sync.js';
import simulateRouter     from './routes/simulate.js';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));  // Tighten in production
app.use(express.json({ limit: '2mb' }));  // 2mb covers batch sync payloads
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Serve DOM Console UI at root ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

const handleHealth = (_req: express.Request, res: express.Response) => {
  res.json({ ok: true, service: 'ResQ API', env: config.NODE_ENV, ts: new Date().toISOString() });
};
app.get('/health', handleHealth);
app.get('/api/health', handleHealth);

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/incidents',  incidentsRouter);
app.use('/api/assets',     assetsRouter);
app.use('/api/equity',     equityRouter);
app.use('/api/sync',       syncRouter);
app.use('/api/simulate',   simulateRouter);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

// ── Start ──────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`\n🚨  ResQ API running on http://localhost:${config.PORT}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Health:      http://localhost:${config.PORT}/health\n`);
  });
}

export default app;
