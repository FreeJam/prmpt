/**
 * PRMPT — сервер приложения: REST API + раздача собранного SPA.
 * Запуск: node server/index.js   (PORT=8030 по умолчанию)
 */
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './routes/api.js';
import { PresetStore } from './lib/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const PORT = Number(process.env.PORT || 8030);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.PRMPT_DATA_DIR || path.join(ROOT, 'data');
const DIST = process.env.PRMPT_DIST || path.join(ROOT, 'web', 'dist');

const store = await new PresetStore(path.join(DATA_DIR, 'presets.json')).init();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '768kb' }));

/* ── API: /api и /prmpt/api (на случай проксирования без срезания префикса) ── */
const api = createApiRouter(store, pkg);
app.use('/api', api);
app.use('/prmpt/api', api);

/* ── Валидация запросов и ошибки ── */
app.use(['/api', '/prmpt/api'], (req, res) => res.status(404).json({ error: 'not_found', path: req.originalUrl }));

/* ── Статика SPA ── */
const indexHtml = path.join(DIST, 'index.html');
const hasDist = fs.existsSync(indexHtml);

if (hasDist) {
  const staticOpts = {
    index: false,
    etag: true,
    maxAge: '7d',
    setHeaders(res, filePath) {
      if (path.basename(filePath) === 'index.html') res.setHeader('Cache-Control', 'no-store');
      else if (/\.(js|css|woff2?|svg|png|jpg|webp)$/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  };
  // Прод-адрес — /prmpt/, поэтому раздаём и корень, и префикс:
  // работает и при proxy_pass со срезанием, и без.
  app.use(express.static(DIST, staticOpts));
  app.use('/prmpt', express.static(DIST, staticOpts));

  const sendIndex = (req, res) => res.sendFile(indexHtml);
  app.get('/prmpt', (req, res, next) => {
    if (req.path === '/prmpt') return res.redirect(301, '/prmpt/');
    next(); // /prmpt/ обрабатывается SPA-фолбэком ниже
  });
  app.get(/^\/(?!api|prmpt\/api).*/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    sendIndex(req, res);
  });
} else {
  app.get('/', (req, res) => {
    res.status(503).type('html').send(`<!doctype html><meta charset="utf-8">
<title>PRMPT — сборка не найдена</title>
<style>body{background:#0b0e14;color:#e6edf3;font:16px/1.6 ui-monospace,monospace;padding:8vh 6vw}
code{background:#161b22;padding:2px 6px;border-radius:4px;color:#7ee787}</style>
<h1>PRMPT API работает, SPA не собран</h1>
<p>Каталог <code>${DIST}</code> не найден. Соберите фронтенд:</p>
<p><code>npm run build</code></p>
<p>API доступен: <code>/api/health</code></p>`);
  });
}

/* ── Error handler ── */
app.use((err, req, res, _next) => {
  console.error('[prmpt] error:', err);
  if (res.headersSent) return res.end();
  res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[prmpt] listening on http://${HOST}:${PORT}  (static: ${hasDist ? DIST : 'not built'})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`[prmpt] ${sig} — shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
