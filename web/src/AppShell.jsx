import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Palette, HelpCircle, ArrowLeft, Check, X, AlertTriangle, Info } from 'lucide-react';
import { useProject } from './state/useProject.js';
import Welcome from './components/Welcome.jsx';
import Wizard from './components/Wizard.jsx';
import Result from './components/Result.jsx';
import DocumentDrawer from './components/DocumentDrawer.jsx';
import Presets from './components/Presets.jsx';
import { Modal, Section } from './components/kit.jsx';
import { STEPS } from './components/wizardSteps.jsx';
import { api, copyText, downloadJson, readJsonFile } from './lib/api.js';

const LS_SCREEN = 'prmpt.screen.v1';
const LS_STEP = 'prmpt.step.v2';
const LS_THEME = 'prmpt.theme';
const pad = (n) => String(n).padStart(2, '0');

/* ─────────────── уведомления ─────────────── */
function useToasts() {
  const [items, setItems] = useState([]);
  const push = useCallback((text, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, text, tone }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);
  const remove = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  return { items, push, remove };
}

const TOAST_BAR = { ok: 'border-l-mint', err: 'border-l-rose', warn: 'border-l-amber', info: 'border-l-accent' };
const TOAST_ICON = { ok: Check, err: X, warn: AlertTriangle, info: Info };
const TOAST_ICON_CLS = { ok: 'text-mint', err: 'text-rose', warn: 'text-amber', info: 'text-accent' };

function Toasts({ items, remove }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(92vw,368px)] flex-col gap-2">
      {items.map((t) => {
        const Icon = TOAST_ICON[t.tone] ?? Check;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => remove(t.id)}
            className={`pointer-events-auto flex animate-slide items-start gap-2.5 rounded-lg border border-l-2 border-line bg-surface px-3.5 py-2.5 text-left shadow-lift ${
              TOAST_BAR[t.tone] ?? TOAST_BAR.ok
            }`}
          >
            <Icon size={14} strokeWidth={2} className={`mt-[3px] shrink-0 ${TOAST_ICON_CLS[t.tone] ?? 'text-mint'}`} />
            <span className="text-xs leading-relaxed text-ink-200">{t.text}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── приложение ─────────────── */
export default function AppShell() {
  const project = useProject();
  const { items, push, remove } = useToasts();

  const [screen, setScreen] = useState(() => localStorage.getItem(LS_SCREEN) || 'welcome');
  const [step, setStep] = useState(() => {
    const n = Number(localStorage.getItem(LS_STEP));
    return Number.isFinite(n) && n >= 0 && n < STEPS.length ? n : 0;
  });
  const [maxReached, setMaxReached] = useState(step);
  const [online, setOnline] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const fileRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(LS_SCREEN, screen);
  }, [screen]);
  useEffect(() => {
    localStorage.setItem(LS_STEP, String(step));
  }, [step]);
  useEffect(() => {
    setMaxReached((m) => Math.max(m, step));
  }, [step]);

  /* тема: класс на <html>, запоминаем выбор, синхронизируем цвет адресной строки */
  useEffect(() => {
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(LS_THEME, theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#16181C' : '#F6F5F2');
  }, [theme]);

  useEffect(() => {
    let alive = true;
    api
      .health()
      .then(() => alive && setOnline(true))
      .catch(() => alive && setOnline(false));
    return () => {
      alive = false;
    };
  }, []);

  /* насколько заполнен визард — для кнопки «Продолжить» */
  const filled = useMemo(() => {
    const c = project.config;
    return [
      c.meta.projectName?.trim().length > 1,
      !!c.meta.engine,
      c.meta.coreMechanic?.trim().length > 20,
      !!c.gameplay.player?.controls?.trim(),
      (c.gameplay.enemies?.length ?? 0) > 0 || (c.gameplay.pickups?.length ?? 0) > 0,
      !!c.gameplay.winCondition?.trim(),
      (c.tech.patterns?.length ?? 0) > 0,
      (c.prompt.dod?.length ?? 0) > 0
    ].filter(Boolean).length;
  }, [project.config]);

  const goStep = useCallback((i) => setStep(Math.max(0, Math.min(STEPS.length - 1, i))), []);
  const startWizard = useCallback(
    (atStep = 0) => {
      goStep(atStep);
      setScreen('wizard');
    },
    [goStep]
  );

  /* горячие клавиши */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.altKey && e.key === 'ArrowRight' && screen === 'wizard') goStep(step + 1);
      else if (e.altKey && e.key === 'ArrowLeft' && screen === 'wizard') goStep(step - 1);
      else if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && screen !== 'result') setDrawerOpen((v) => !v);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [screen, step, goStep]);

  const exportZip = useCallback(async () => {
    setExporting(true);
    try {
      const size = await api.downloadZip(project.config, `${project.config.meta.packageName}-prmpt.zip`);
      push(`Архив собран: ${(size / 1024).toFixed(1)} КБ — кладите файлы в папку проекта`, 'ok');
    } catch {
      push('Для ZIP нужен запущенный сервер приложения', 'err');
    } finally {
      setExporting(false);
    }
  }, [project.config, push]);

  const copyPrompt = useCallback(async () => {
    const ok = await copyText(project.files['AGENT_PROMPT.md'] ?? '');
    push(
      ok ? 'AGENT_PROMPT.md скопирован — вставляйте первым сообщением в агент' : 'Браузер заблокировал буфер обмена',
      ok ? 'ok' : 'err'
    );
  }, [project.files, push]);

  const exportJson = useCallback(() => {
    downloadJson({ ...project.config, generator: 'PRMPT 1.0' }, `${project.config.meta.packageName}-prmpt-config.json`);
    push('Конфигурация скачана в .json', 'ok');
  }, [project.config, push]);

  const onImportFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const json = await readJsonFile(file);
        const cfg = json.config ?? json;
        if (!cfg?.meta) throw new Error('нет поля meta');
        project.applyConfig(cfg);
        push(`Загружена конфигурация «${cfg.meta.projectName ?? file.name}»`, 'ok');
        setScreen('result');
      } catch (err) {
        push(`Импорт не удался: ${err.message}`, 'err');
      }
    },
    [project, push]
  );

  const crumb = screen === 'result' ? 'результат' : screen === 'wizard' ? `${pad(step + 1)} · ${STEPS[step].short}` : 'начало';

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* ─────────── шапка ─────────── */}
      <header className="sticky top-0 z-nav border-b border-line bg-canvas">
        <div className="wrap flex h-14 items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen('welcome')}
            className="flex shrink-0 items-center gap-2.5 rounded-md py-1 pr-1 transition-opacity hover:opacity-75"
            title="На главный экран"
          >
            <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-ink-100 font-mono text-[13px] font-semibold leading-none text-canvas">
              P
            </span>
            <span className="hidden text-sm font-semibold tracking-[-0.01em] text-ink-100 sm:block">PRMPT</span>
          </button>

          <span className="hidden h-4 w-px bg-line sm:block" />
          <span className="num truncate text-xs text-ink-300">{crumb}</span>
          {screen !== 'welcome' && (
            <span className="num hidden truncate text-2xs text-ink-500 lg:block">{project.config.meta.packageName}</span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn btn-sm"
              title={theme === 'dark' ? 'Сейчас тёмная тема' : 'Сейчас светлая тема'}
            >
              <Palette size={13} strokeWidth={1.75} />
              <span className="hidden md:inline">{theme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
            </button>

            <span
              className="hidden items-center gap-1.5 px-1 text-2xs text-ink-500 sm:flex"
              title={online === false ? 'Сервер недоступен: пресеты и ZIP требуют запущенного API' : 'Связь с сервером приложения'}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  online === true ? 'bg-mint' : online === false ? 'bg-amber' : 'bg-ink-500'
                }`}
              />
              {online === true ? 'сервер' : online === false ? 'оффлайн' : '…'}
            </span>

            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setHelpOpen(true)} title="Как этим пользоваться">
              <HelpCircle size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">Справка</span>
            </button>

            {screen !== 'result' ? (
              <button type="button" className="btn btn-sm" onClick={() => setDrawerOpen(true)} title="Посмотреть документы (P)">
                <Eye size={14} strokeWidth={1.75} />
                <span className="hidden sm:inline">Документы</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => startWizard(STEPS.length - 1)}
                title="Вернуться к последнему шагу"
              >
                <ArrowLeft size={14} strokeWidth={1.75} />
                <span className="hidden sm:inline">К правкам</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─────────── контент ─────────── */}
      <main className="flex-1">
        {screen === 'welcome' && (
          <Welcome
            filled={filled}
            hasSaved={filled >= 3}
            onStart={() => {
              project.reset();
              startWizard(0);
            }}
            onContinue={() => startWizard(step)}
            onTemplate={(id) => {
              project.applyTemplate(id);
              push('Шаблон применён — проверьте детали на шагах', 'ok');
              startWizard(1);
            }}
          />
        )}

        {screen === 'wizard' && (
          <Wizard
            project={project}
            step={step}
            setStep={goStep}
            maxReached={maxReached}
            onJump={goStep}
            onFinish={() => setScreen('result')}
            onPeek={() => setDrawerOpen(true)}
          />
        )}

        {screen === 'result' && (
          <Result
            project={project}
            exporting={exporting}
            onToast={push}
            onEdit={(i) => startWizard(i)}
            onExportZip={exportZip}
            onCopyPrompt={copyPrompt}
            onSavePreset={() => setPresetsOpen(true)}
            onExportJson={exportJson}
            onImportJson={() => fileRef.current?.click()}
            onReset={() => {
              if (window.confirm('Сбросить проект и начать заново?')) {
                project.reset();
                setScreen('welcome');
                goStep(0);
                setMaxReached(0);
                push('Начинаем заново', 'info');
              }
            }}
          />
        )}
      </main>

      <footer className="mt-4 border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-4 text-2xs text-ink-500">
          <span>PRMPT · freejam.online/prmpt — документация и промпты для GameDev с ИИ-агентами</span>
          <span>Черновик хранится только в этом браузере</span>
        </div>
      </footer>

      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />

      <DocumentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} project={project} onToast={push} />

      <Presets
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        config={project.config}
        onLoad={(cfg) => {
          project.applyConfig(cfg);
          setScreen('result');
        }}
        onToast={push}
      />

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Как это работает"
        width="max-w-xl"
        footer={
          <button type="button" className="btn" onClick={() => setHelpOpen(false)}>
            Понятно
          </button>
        }
      >
        <div className="space-y-8">
          <Section title="Три шага к результату">
            <ol className="space-y-2.5 text-xs leading-relaxed text-ink-300">
              <li className="flex gap-2.5">
                <span className="idx pt-[1px] text-ink-500">01</span>
                <span>
                  Отвечаете на {STEPS.length} коротких вопросов о своей игре — по одной теме на экран, с черновиком
                  документов под рукой.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="idx pt-[1px] text-ink-500">02</span>
                <span>PRMPT собирает GDD, техническое ТЗ, системный промпт для агента и первую задачу.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="idx pt-[1px] text-ink-500">03</span>
                <span>Скачиваете ZIP, кладёте файлы в папку проекта и отправляете промпт агенту первым сообщением.</span>
              </li>
            </ol>
          </Section>
          <Section title="Почему это работает лучше одного большого промпта">
            <p className="text-xs leading-relaxed text-ink-300">
              Каждая итерация агента должна заканчиваться работающим проектом. Документы задают рамку («что не входит»),
              запреты отсекают выдуманные API и самовольный рефакторинг, а критерии приёмки превращают «вроде готово» в
              проверяемый список.
            </p>
          </Section>
          <Section title="Горячие клавиши">
            <ul className="space-y-2 text-xs text-ink-300">
              <li>
                <span className="kbd">Alt</span> + <span className="kbd">←</span> / <span className="kbd">→</span> —
                предыдущий и следующий шаг
              </li>
              <li>
                <span className="kbd">P</span> — документы, <span className="kbd">Esc</span> — закрыть панель
              </li>
            </ul>
          </Section>
        </div>
      </Modal>

      <Toasts items={items} remove={remove} />
    </div>
  );
}
