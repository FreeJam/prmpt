import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Save, FolderOpen, Trash2, Download, Upload, RefreshCw, CloudOff, HardDriveDownload } from 'lucide-react';
import { api, downloadJson, readJsonFile } from '../lib/api.js';
import { Modal, Badge, Field, TextInput } from './kit.jsx';
import { ENGINES } from '@shared/catalog.js';

export default function Presets({ open, onClose, config, onLoad, onToast }) {
  const [presets, setPresets] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | offline
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await api.presets.list();
      setPresets(data.presets ?? []);
      setStatus('ready');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (open) {
      refresh();
      setName(config.meta.projectName ? `${config.meta.projectName} — ${new Date().toLocaleDateString('ru-RU')}` : '');
    }
  }, [open, refresh, config.meta.projectName]);

  const save = async () => {
    if (!name.trim()) return onToast('Введите имя пресета', 'err');
    setBusy(true);
    try {
      await api.presets.create({ name: name.trim(), config, description: config.meta.coreMechanic?.slice(0, 160) });
      onToast('Пресет сохранён на сервере', 'ok');
      await refresh();
    } catch (e) {
      // Сервер недоступен — не теряем работу пользователя: отдаём файл
      downloadJson({ name: name.trim(), config, exportedAt: new Date().toISOString() }, `${config.meta.packageName}.json`);
      onToast('Сервер недоступен — конфигурация скачана файлом', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const load = async (id) => {
    try {
      const { preset } = await api.presets.get(id);
      onLoad(preset.config);
      onToast(`Загружен пресет «${preset.name}»`, 'ok');
      onClose();
    } catch {
      onToast('Не удалось загрузить пресет', 'err');
    }
  };

  const remove = async (id, presetName) => {
    if (!window.confirm(`Удалить пресет «${presetName}»?`)) return;
    try {
      await api.presets.remove(id);
      setPresets((p) => p.filter((x) => x.id !== id));
      onToast('Пресет удалён', 'ok');
    } catch {
      onToast('Не удалось удалить пресет', 'err');
    }
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = await readJsonFile(file);
      const cfg = json.config ?? json;
      if (!cfg?.meta) throw new Error('Нет поля meta');
      onLoad(cfg);
      onToast(`Импортирована конфигурация «${cfg.meta.projectName ?? file.name}»`, 'ok');
      onClose();
    } catch (err) {
      onToast(`Импорт не удался: ${err.message}`, 'err');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Пресеты и конфигурация" width="max-w-2xl"
      footer={<button type="button" className="btn" onClick={onClose}>Закрыть</button>}>
      <div className="space-y-5">
        <section>
          <Field label="Сохранить текущий проект как пресет" hint="Хранится на сервере (JSON). Если сервер недоступен — конфигурация скачается файлом.">
            <div className="flex gap-2">
              <TextInput value={name} onChange={setName} placeholder="Название пресета" />
              <button type="button" className="btn btn-primary shrink-0" onClick={save} disabled={busy}>
                {busy ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Сохранить
              </button>
            </div>
          </Field>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="field-label mb-0">Мои пресеты</span>
            {status === 'ready' && <Badge tone="good">{presets.length}</Badge>}
            {status === 'loading' && <Badge>загрузка…</Badge>}
            {status === 'offline' && (
              <Badge tone="warn" title="API недоступен: список пресетов и ZIP-экспорт работают только при запущенном сервере">
                <CloudOff size={11} /> сервер недоступен
              </Badge>
            )}
            <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={refresh} title="Обновить список">
              <RefreshCw size={12} /> Обновить
            </button>
          </div>

          {status === 'offline' ? (
            <p className="rounded-lg border border-amber/25 bg-amber/[0.06] px-3 py-2 text-[12px] text-ink-300">
              Не удалось связаться с API. Всё остальное работает: генерация документов, оценка промпта и экспорт файлов.
              Сервер нужен для сохранения пресетов в облако и скачивания ZIP.
            </p>
          ) : presets.length === 0 && status === 'ready' ? (
            <p className="rounded-lg border border-dashed border-line-soft px-3 py-3 text-center text-[12px] text-ink-500">
              Пока пусто. Сохраните текущую конфигурацию — она появится здесь и станет доступна с любого устройства.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {presets.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-bg-700/40 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-ink-100">{p.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-ink-500">
                      <Badge>{ENGINES[p.meta?.engine]?.label ?? p.meta?.engine ?? '—'}</Badge>
                      <span className="font-mono">{p.meta?.genre}</span>
                      <span>· {new Date(p.updatedAt).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm" onClick={() => load(p.id)}>
                    <FolderOpen size={12} /> Открыть
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost hover:text-rose" onClick={() => remove(p.id, p.name)} title="Удалить">
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-line-soft pt-4">
          <span className="field-label">Импорт / экспорт конфигурации (.json)</span>
          <p className="mb-2 text-2xs leading-snug text-ink-400">
            Файл <code className="font-mono text-mint">prmpt.config.json</code> лежит внутри ZIP-архива проекта — его достаточно
            перетащить сюда, чтобы вернуться к этой конфигурации через неделю.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => downloadJson({ ...config, generator: 'PRMPT 1.0' }, `${config.meta.packageName}-prmpt-config.json`)}>
              <Download size={14} /> Экспорт .json
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Импорт .json
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
          </div>
        </section>

        <section className="rounded-lg border border-line-soft bg-bg-700/30 p-3 text-2xs leading-relaxed text-ink-400">
          <div className="mb-1 flex items-center gap-1.5 text-ink-200"><HardDriveDownload size={13} /> Что попадает в ZIP-архив</div>
          <code className="font-mono text-[11px] text-ink-300">
            {config.meta.packageName}/README.md · AGENT_PROMPT.md · TASK_1_SCAFFOLD.md · .rules · docs/GDD.md ·
            docs/TECH_SPEC.md · docs/PROMPT_ROADMAP.md · docs/PROMPT_QUALITY.md · prmpt.config.json
          </code>
        </section>
      </div>
    </Modal>
  );
}
