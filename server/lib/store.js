/**
 * Хранилище пользовательских пресетов: JSON-файл с атомарной записью.
 * Плюс: нет native-зависимостей (better-sqlite3), данные видно глазами и легко бэкапить.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { normalizeConfig } from '../../shared/schema.js';

export class PresetStore {
  constructor(file) {
    this.file = file;
    this.data = { version: 1, presets: [] };
    this.queue = Promise.resolve();
  }

  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.presets)) this.data = parsed;
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('[store] повреждён файл пресетов, начинаем с пустого:', err.message);
        await this.#backupBroken();
      }
      await this.#persist();
    }
    return this;
  }

  async #backupBroken() {
    try {
      await fs.rename(this.file, `${this.file}.broken-${Date.now()}`);
    } catch { /* ignore */ }
  }

  #persist() {
    const tmp = `${this.file}.tmp-${process.pid}`;
    const body = JSON.stringify(this.data, null, 2);
    this.queue = this.queue.then(async () => {
      await fs.writeFile(tmp, body, 'utf8');
      await fs.rename(tmp, this.file);
    });
    return this.queue;
  }

  list() {
    return this.data.presets
      .map(({ config, ...meta }) => ({ ...meta, meta: { projectName: config.meta?.projectName, engine: config.meta?.engine, genre: config.meta?.genre } }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id) {
    return this.data.presets.find((p) => p.id === id) ?? null;
  }

  async create({ name, config, description = '' }) {
    const now = new Date().toISOString();
    const preset = {
      id: crypto.randomUUID(),
      name: String(name || 'Без названия').slice(0, 120),
      description: String(description).slice(0, 400),
      createdAt: now,
      updatedAt: now,
      config: normalizeConfig(config)
    };
    this.data.presets.push(preset);
    await this.#persist();
    return preset;
  }

  async update(id, patch) {
    const idx = this.data.presets.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const cur = this.data.presets[idx];
    const next = {
      ...cur,
      name: patch.name !== undefined ? String(patch.name).slice(0, 120) : cur.name,
      description: patch.description !== undefined ? String(patch.description).slice(0, 400) : cur.description,
      config: patch.config ? normalizeConfig(patch.config) : cur.config,
      updatedAt: new Date().toISOString()
    };
    this.data.presets[idx] = next;
    await this.#persist();
    return next;
  }

  async remove(id) {
    const before = this.data.presets.length;
    this.data.presets = this.data.presets.filter((p) => p.id !== id);
    if (this.data.presets.length === before) return false;
    await this.#persist();
    return true;
  }
}
