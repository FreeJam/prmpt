/**
 * PRMPT — REST API: каталог, генерация, пресеты, экспорт ZIP.
 */
import { Router } from 'express';
import {
  ENGINES, GENRES, PLATFORMS, ART_STYLES, PATTERNS, STATE_MODES, GAME_SYSTEMS,
  DOD_OPTIONS, CONSTRAINTS_OPTIONS, FORBIDDEN_OPTIONS, STRATEGY_STEPS, ROLES, SCOPE_LEVELS
} from '../../shared/catalog.js';
import { TEMPLATES } from '../../shared/templates.js';
import { defaultConfig, normalizeConfig, validateConfig } from '../../shared/schema.js';
import { generateFiles, generateSingle, FILE_CATALOG } from '../../shared/generator.js';
import { scorePrompt, decompositionTips } from '../../shared/score.js';
import { createZip } from '../lib/zip.js';

const asList = (obj) => Object.values(obj).map(({ id, label }) => ({ id, label }));

export function createApiRouter(store, pkg) {
  const api = Router();
  const startedAt = Date.now();

  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  /* ── служебное ── */
  api.get('/health', (req, res) => {
    res.json({
      ok: true,
      service: 'prmpt-api',
      version: pkg.version,
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      node: process.version,
      presets: store.list().length,
      time: new Date().toISOString()
    });
  });

  /* ── каталог для UI ── */
  api.get('/catalog', (req, res) => {
    res.json({
      engines: Object.values(ENGINES).map(({ id, label, language, version, entry, runCmd }) => ({ id, label, language, version, entry, runCmd })),
      genres: GENRES,
      platforms: PLATFORMS,
      artStyles: ART_STYLES.map((label) => ({ id: label, label })),
      patterns: PATTERNS,
      stateModes: STATE_MODES,
      systems: GAME_SYSTEMS,
      scopeLevels: SCOPE_LEVELS,
      roles: ROLES.map((r) => ({ id: r, label: r })),
      dodOptions: DOD_OPTIONS,
      constraintOptions: CONSTRAINTS_OPTIONS,
      forbiddenOptions: FORBIDDEN_OPTIONS,
      strategySteps: STRATEGY_STEPS,
      templates: TEMPLATES.map(({ id, title, engine, description }) => ({ id, title, engine, description })),
      files: FILE_CATALOG,
      defaults: defaultConfig()
    });
  });

  api.get('/templates/:id', (req, res) => {
    const t = TEMPLATES.find((x) => x.id === req.params.id);
    if (!t) return res.status(404).json({ error: 'template_not_found' });
    res.json({ id: t.id, title: t.title, config: normalizeConfig(t.config) });
  });

  /* ── генерация ── */
  api.post('/generate', (req, res) => {
    const cfg = normalizeConfig(req.body?.config ?? req.body);
    const validation = validateConfig(cfg);
    const score = scorePrompt(cfg);
    const files = generateFiles(cfg, { withConfig: false });
    res.json({
      config: cfg,
      validation,
      score,
      files: Object.entries(files).map(([path, content]) => ({ path, content, lines: content.split('\n').length }))
    });
  });

  api.post('/score', (req, res) => {
    res.json({ score: scorePrompt(req.body?.config ?? req.body), tips: decompositionTips() });
  });

  api.get('/score/tips', (req, res) => res.json({ tips: decompositionTips() }));

  /* ── пресеты ── */
  api.get('/presets', (req, res) => res.json({ presets: store.list() }));

  api.get('/presets/:id', (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'preset_not_found' });
    res.json({ preset: p });
  });

  api.post('/presets', wrap(async (req, res) => {
    const { name, config, description } = req.body ?? {};
    if (!config) return res.status(400).json({ error: 'config_required' });
    const preset = await store.create({ name, config, description });
    res.status(201).json({ preset });
  }));

  api.put('/presets/:id', wrap(async (req, res) => {
    const preset = await store.update(req.params.id, req.body ?? {});
    if (!preset) return res.status(404).json({ error: 'preset_not_found' });
    res.json({ preset });
  }));

  api.delete('/presets/:id', wrap(async (req, res) => {
    const ok = await store.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'preset_not_found' });
    res.status(204).end();
  }));

  /* ── экспорт ── */
  api.post('/export/zip', (req, res) => {
    const cfg = normalizeConfig(req.body?.config ?? req.body);
    const files = generateFiles(cfg);
    const folder = cfg.meta.packageName || 'game-project';
    const entries = {};
    for (const [p, content] of Object.entries(files)) entries[`${folder}/${p}`] = content;
    entries[`${folder}/docs/PROMPT_QUALITY.md`] = qualityReport(cfg);

    const zip = createZip(entries, { comment: `PRMPT export — ${cfg.meta.projectName}` });
    const filename = `${folder}-prmpt.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', zip.length);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Cache-Control', 'no-store');
    res.end(zip);
  });

  api.post('/export/file', (req, res) => {
    const cfg = normalizeConfig(req.body?.config ?? req.body);
    const path = String(req.body?.path ?? '');
    try {
      const content = generateSingle(cfg, path);
      res.json({ path, content });
    } catch {
      res.status(404).json({ error: 'file_not_found' });
    }
  });

  api.post('/export/preview', (req, res) => {
    const cfg = normalizeConfig(req.body?.config ?? req.body);
    const files = generateFiles(cfg, { withConfig: false });
    res.json({
      tree: Object.keys(files).map((p) => `${cfg.meta.packageName}/${p}`).sort(),
      totalBytes: Object.values(files).reduce((s, c) => s + Buffer.byteLength(c, 'utf8'), 0)
    });
  });

  return api;
}

function qualityReport(cfg) {
  const s = scorePrompt(cfg);
  const icon = { pass: '✅', warn: '⚠️', fail: '❌' };
  return `# Отчёт о качестве промпта (Prompt Quality Score)

**Оценка: ${s.score}/100 — ${s.grade.label}**

Пройдено проверок: ${s.passed} из ${s.total}.

| Проверка | Вес | Статус | Комментарий |
|---|---|---|---|
${s.checks.map((c) => `| ${c.label} | ${c.weight} | ${icon[c.status]} | ${c.advice} |`).join('\n')}

## Рекомендации

${s.checks.filter((c) => c.status !== 'pass').map((c) => `### ${icon[c.status]} ${c.label}\n\n${c.advice}\n\n_Почему это важно:_ ${c.why}`).join('\n\n') || '_Все проверки пройдены._'}

## Как декомпозировать задачи для агента

${s.tips.map((t) => `### ${t.title}\n\n${t.text}`).join('\n\n')}

---
_Сгенерировано PRMPT • freejam.online/prmpt_
`;
}
