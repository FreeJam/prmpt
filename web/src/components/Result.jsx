import React, { useMemo, useState } from 'react';
import { Download, Copy, Save, FileJson, Upload, ChevronRight, AlertTriangle, AlertOctagon, RotateCcw } from 'lucide-react';
import Preview from './Preview.jsx';
import ScoreDetails from './ScoreDetails.jsx';
import { ScoreRing, Badge, Modal, Meter } from './kit.jsx';
import { STEPS } from './wizardSteps.jsx';

const FIELD_TO_STEP = { 'meta.': 0, 'gameplay.': 3, 'tech.': 6, 'prompt.': 7 };
const FIELD_LABELS = {
  'meta.projectName': 'название игры',
  'meta.coreMechanic': 'главную механику',
  'tech.patterns': 'архитектурные паттерны',
  'prompt.dod': 'критерии приёмки',
  'prompt.forbidden': 'запреты для агента'
};

const GRADE_TONE = { excellent: 'mint', good: 'accent', fair: 'amber', poor: 'rose' };

export default function Result({
  project, onEdit, onExportZip, onCopyPrompt, onSavePreset, onExportJson, onImportJson,
  onReset, onToast, exporting
}) {
  const { score, validation, files, config } = project;
  const [detailsOpen, setDetailsOpen] = useState(false);

  const totalBytes = useMemo(
    () => Object.values(files).reduce((s, c) => s + new TextEncoder().encode(c).length, 0),
    [files]
  );
  const issues = [
    ...validation.errors.map((e) => ({ ...e, level: 'error' })),
    ...validation.warnings.map((w) => ({ ...w, level: 'warn' }))
  ];
  const fileCount = Object.keys(files).length;
  const stepOf = (field) => FIELD_TO_STEP[Object.keys(FIELD_TO_STEP).find((p) => field?.startsWith(p))] ?? 0;

  return (
    <div className="wrap pb-20 pt-7 sm:pt-10">
      {/* ── итог ── */}
      <section className="grid gap-9 border-b border-line pb-9 lg:grid-cols-[minmax(0,1fr)_272px] lg:gap-14">
        <div className="min-w-0">
          <p className="num text-xs text-ink-400">
            Результат · {fileCount} файлов · {(totalBytes / 1024).toFixed(1)} КБ
          </p>
          <h1 className="mt-2.5 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink-100 sm:text-[34px]">
            {config.meta.projectName || 'Проект'}
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-300">
            Документы собраны из ваших ответов. Промпт лежит в{' '}
            <span className="num text-ink-200">AGENT_PROMPT.md</span> — его отправляют агенту первым сообщением, файлы
            проекта кладут рядом.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button type="button" className="btn btn-primary" onClick={onExportZip} disabled={exporting}>
              <Download size={15} strokeWidth={2} />
              {exporting ? 'Собираю архив…' : 'Скачать ZIP'}
            </button>
            <button type="button" className="btn" onClick={onCopyPrompt}>
              <Copy size={15} strokeWidth={1.75} />
              Скопировать промпт
            </button>
            <button type="button" className="btn" onClick={onSavePreset}>
              <Save size={15} strokeWidth={1.75} />
              Сохранить пресет
            </button>
            <button type="button" className="btn btn-ghost" onClick={onExportJson} title="Скачать конфигурацию проекта в .json">
              <FileJson size={15} strokeWidth={1.75} />
              .json
            </button>
            <button type="button" className="btn btn-ghost" onClick={onImportJson} title="Загрузить конфигурацию из .json">
              <Upload size={15} strokeWidth={1.75} />
              Импорт
            </button>
          </div>
        </div>

        {/* ── оценка промпта ── */}
        <aside className="panel h-fit p-4">
          <div className="flex items-center gap-4">
            <ScoreRing value={score.score} size={72} stroke={5} />
            <div className="min-w-0">
              <p className="text-sm text-ink-100">{score.grade.label}</p>
              <p className="num mt-0.5 text-2xs text-ink-400">
                {score.passed} из {score.total} проверок
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Meter value={score.score} />
          </div>
          <button type="button" className="btn btn-sm mt-4 w-full" onClick={() => setDetailsOpen(true)}>
            Разбор по критериям
            <ChevronRight size={13} strokeWidth={2} />
          </button>
        </aside>
      </section>

      {/* ── замечания ── */}
      {issues.length > 0 && (
        <section className="py-8">
          <h2 className="flex items-baseline gap-2.5 text-sm font-medium text-ink-100">
            Что стоит поправить
            <span className="num text-2xs text-ink-400">{issues.length}</span>
          </h2>
          <p className="mt-1.5 text-xs text-ink-400">
            Состав документов уже рабочий, но эти места агент может понять не так, как вы задумали.
          </p>
          <ul className="mt-4 border-t border-line">
            {issues.map((i, k) => {
              const step = stepOf(i.field);
              return (
                <li key={`${i.field}-${k}`}>
                  <button
                    type="button"
                    onClick={() => onEdit(step)}
                    className="group flex w-full items-start gap-3 border-b border-line-soft py-3 text-left transition-colors hover:bg-hover/60"
                  >
                    {i.level === 'error' ? (
                      <AlertOctagon size={14} strokeWidth={1.75} className="mt-[3px] shrink-0 text-rose" />
                    ) : (
                      <AlertTriangle size={14} strokeWidth={1.75} className="mt-[3px] shrink-0 text-amber" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-relaxed text-ink-200">{i.message}</span>
                      <span className="mt-1 block text-2xs text-ink-500">
                        {FIELD_LABELS[i.field] ? `Править: ${FIELD_LABELS[i.field]}` : 'Открыть конструктор'}
                      </span>
                    </span>
                    <span className="idx shrink-0 pt-[3px] text-ink-500 transition-colors group-hover:text-accent">
                      {String(step + 1).padStart(2, '0')} · {STEPS[step]?.short}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── документы ── */}
      <section className="pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-ink-100">Документы</h2>
          <span className="text-2xs text-ink-500">пересобираются сразу после правок в конструкторе</span>
        </div>
        <div className="mt-4">
          <Preview project={project} onExportZip={onExportZip} onToast={onToast} exporting={exporting} showZip={false} />
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="max-w-[52ch] text-xs leading-relaxed text-ink-500">
          Черновик хранится только в этом браузере. Перед переходом на другое устройство сохраните пресет или .json.
        </p>
        <button type="button" className="btn btn-sm btn-danger" onClick={onReset}>
          <RotateCcw size={13} strokeWidth={1.75} />
          Начать заново
        </button>
      </div>

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Разбор оценки промпта"
        width="max-w-2xl"
        footer={
          <button type="button" className="btn" onClick={() => setDetailsOpen(false)}>
            Понятно
          </button>
        }
      >
        <ScoreDetails score={score} />
      </Modal>
    </div>
  );
}
