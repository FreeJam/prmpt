import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, FileText, CornerDownLeft } from 'lucide-react';
import { ProgressBar } from './kit.jsx';
import { STEPS } from './wizardSteps.jsx';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Оболочка визарда: рельса-оглавление слева, шаг справа, панель навигации снизу.
 * Идея: пользователь всегда видит, где он и сколько осталось.
 */
export default function Wizard({ project, step, setStep, maxReached, onJump, onFinish, onPeek }) {
  const current = STEPS[step];
  const Step = current.Component;
  const percent = Math.round(((step + 1) / STEPS.length) * 100);
  const isLast = step === STEPS.length - 1;
  const next = STEPS[step + 1];

  useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft') setStep(Math.max(0, step - 1));
      if (e.key === 'ArrowRight') setStep(Math.min(STEPS.length - 1, step + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, setStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  return (
    <div className="wrap pb-32 pt-6 sm:pt-9">
      <div className="grid gap-10 lg:grid-cols-[228px_minmax(0,1fr)] lg:gap-14">
        {/* ── оглавление ── */}
        <aside className="hidden lg:block" aria-label="Ход работы">
          <div className="sticky top-24">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-ink-400">Ход работы</span>
              <span className="num text-xs text-ink-200">{percent}%</span>
            </div>
            <ProgressBar value={percent} className="mt-2.5" />
            <ol className="mt-5 space-y-0.5">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const locked = i > maxReached;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => !locked && onJump(i)}
                      disabled={locked}
                      aria-current={active ? 'step' : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-left text-sm transition-colors duration-200 ${
                        active
                          ? 'bg-surface text-ink-100 shadow-soft'
                          : locked
                            ? 'text-ink-500/70'
                            : 'text-ink-400 hover:bg-hover hover:text-ink-200'
                      }`}
                    >
                      <span className={`num shrink-0 text-2xs ${active ? 'text-accent' : 'text-ink-500'}`}>
                        {done ? <Check size={12} strokeWidth={2.25} className="text-mint" /> : pad(i + 1)}
                      </span>
                      <span className="truncate">{s.short}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={onPeek}
              className="mt-6 flex w-full items-center gap-2 rounded-md border border-line-soft px-2.5 py-2 text-xs text-ink-400 transition-colors hover:border-line hover:text-ink-200"
            >
              <FileText size={13} strokeWidth={1.75} /> Посмотреть документы
            </button>
          </div>
        </aside>

        {/* ── шаг ── */}
        <div className="min-w-0">
          <header className="border-b border-line pb-6">
            <div className="flex items-center gap-3 text-xs text-ink-400">
              <span className="num text-ink-300">
                Шаг {pad(step + 1)} / {pad(STEPS.length)}
              </span>
              <span className="h-3 w-px bg-line" />
              <span className="truncate">{project.config.meta.projectName || 'Без названия'}</span>
              <span className="num ml-auto lg:hidden">{percent}%</span>
            </div>
            <h1 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-100 sm:text-[32px]">
              {current.title}
            </h1>
            <p className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-ink-400">{current.lead}</p>
            <div className="mt-4 lg:hidden">
              <ProgressBar value={percent} />
            </div>
          </header>

          <div key={step} className="animate-rise pt-8">
            <Step project={project} />
          </div>
        </div>
      </div>

      {/* ── панель навигации ── */}
      <div className="fixed inset-x-0 bottom-0 z-nav border-t border-line bg-canvas">
        <div className="wrap flex items-center gap-3 py-3">
          <button
            type="button"
            className="btn shrink-0"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ChevronLeft size={15} strokeWidth={2} />
            <span className="hidden sm:inline">Назад</span>
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs text-ink-500">
              {isLast ? (
                'Осталось собрать документы'
              ) : (
                <>
                  Далее: <span className="text-ink-300">{next.short}</span>
                </>
              )}
            </p>
          </div>

          <button type="button" className="btn btn-ghost hidden shrink-0 sm:inline-flex" onClick={onPeek}>
            Черновик
          </button>

          {isLast ? (
            <button type="button" className="btn btn-primary shrink-0" onClick={onFinish}>
              Собрать результат
              <CornerDownLeft size={15} strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary shrink-0"
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
            >
              Далее
              <ChevronRight size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
