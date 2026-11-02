import React from 'react';
import { ArrowRight, Sparkles, FileCode2, ListOrdered } from 'lucide-react';
import { TEMPLATES } from '@shared/templates.js';
import { STEPS } from './wizardSteps.jsx';

const pad = (n) => String(n).padStart(2, '0');

const FILES = [
  ['AGENT_PROMPT.md', 'системный промпт: роль, запреты, критерии приёмки'],
  ['TASK_1_SCAFFOLD.md', 'первая задача — каркас проекта целиком'],
  ['docs/GDD.md', 'что за игра, как в неё играют, чем заканчивается'],
  ['docs/TECH_SPEC.md', 'движок, структура кода, состояние, тесты'],
  ['.rules', 'короткий свод правил, который агент читает первым'],
  ['docs/PROMPT_ROADMAP.md', 'план итераций с шаблоном постановки задачи'],
  ['README.md и др.', 'конфиг проекта, чек-лист качества, порядок работы']
];

const HOW = [
  ['Отвечаете на вопросы', 'Восемь шагов, по одному решению на экран. Ответы сохраняются в браузере.'],
  ['Смотрите черновик', 'Файлы собираются на лету: видно, что именно уйдёт агенту.'],
  ['Забираете архив', 'Девять файлов кладёте в папку проекта и отправляете промпт агенту.']
];

export default function Welcome({ onStart, onTemplate, hasSaved, onContinue, filled }) {
  return (
    <div className="wrap py-10 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-16">
        {/* ── левая колонка: смысл и вход ── */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-line-soft bg-surface px-2.5 py-1 text-2xs text-ink-400">
            <Sparkles size={12} strokeWidth={1.75} className="text-accent" />
            Конструктор документации для игр · {STEPS.length} шагов
          </p>

          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] text-ink-100 sm:text-[46px]">
            Промпт, по которому агент действительно соберёт вашу игру
          </h1>

          <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-300">
            Отвечаете на {STEPS.length} коротких вопросов про свою игру — на выходе готовый пакет документов: GDD,
            техническое ТЗ, системный промпт и первая задача. Агенту не придётся додумывать правила за вас.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
              Начать
              <ArrowRight size={16} strokeWidth={2} />
            </button>
            {hasSaved && (
              <button type="button" className="btn btn-lg" onClick={onContinue}>
                Продолжить прежний проект
                <span className="num text-2xs text-ink-400">{filled}/{STEPS.length}</span>
              </button>
            )}
          </div>

          <dl className="mt-12 border-t border-line">
            {FILES.map(([name, desc]) => (
              <div key={name} className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 border-b border-line-soft py-2.5">
                <dt className="num w-[190px] shrink-0 text-2xs text-ink-200">{name}</dt>
                <dd className="min-w-0 flex-1 text-xs text-ink-400">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── правая колонка: шаблоны и порядок работы ── */}
        <div className="lg:pt-14">
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-ink-100">
              <FileCode2 size={15} strokeWidth={1.75} className="text-ink-400" />
              Начать с шаблона
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
              Черновик для четырёх жанров. Любой ответ потом правится на своём шаге.
            </p>
            <ul className="mt-4 border-t border-line-soft">
              {TEMPLATES.map((t, i) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onTemplate(t.id)}
                    className="group flex w-full items-start gap-3 border-b border-line-soft py-3 text-left transition-colors hover:bg-hover/60"
                  >
                    <span className="idx pt-[3px] text-ink-500">{pad(i + 1)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink-100">
                        {t.title}
                        <span className="ml-2 text-2xs text-ink-400">{t.engine}</span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">{t.description}</span>
                    </span>
                    <ArrowRight
                      size={14}
                      strokeWidth={1.75}
                      className="mt-1 shrink-0 text-ink-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <ol className="mt-8">
            <li className="flex items-center gap-2 text-xs text-ink-500">
              <ListOrdered size={13} strokeWidth={1.75} /> Порядок работы
            </li>
            {HOW.map(([title, desc], i) => (
              <li key={title} className="mt-3.5 flex gap-3">
                <span className="idx pt-[2px] text-ink-500">{pad(i + 1)}</span>
                <span>
                  <span className="block text-[13px] text-ink-200">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">{desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
