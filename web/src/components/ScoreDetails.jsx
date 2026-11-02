import React from 'react';
import { Check, AlertTriangle, X, Lightbulb } from 'lucide-react';
import { decompositionTips } from '@shared/score.js';

const STATUS = {
  pass: { icon: Check, cls: 'text-mint' },
  warn: { icon: AlertTriangle, cls: 'text-amber' },
  fail: { icon: X, cls: 'text-rose' }
};

/** Полный разбор оценки промпта — показывается внутри модального окна. */
export default function ScoreDetails({ score }) {
  const problems = score.checks.filter((c) => c.status !== 'pass');
  const passed = score.checks.filter((c) => c.status === 'pass');

  return (
    <div className="space-y-7">
      {problems.length > 0 && (
        <section>
          <h3 className="text-xs text-ink-400">
            Стоит поправить <span className="num text-ink-300">{problems.length}</span>
          </h3>
          <ul className="mt-2.5 divide-y divide-line-soft border-y border-line">
            {problems.map((c) => {
              const S = STATUS[c.status] ?? STATUS.warn;
              return (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <S.icon size={14} strokeWidth={2} className={`mt-[3px] shrink-0 ${S.cls}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] text-ink-100">{c.label}</span>
                      <span className="num text-2xs text-ink-500">вес {c.weight}</span>
                    </div>
                    {c.advice && <p className="mt-1 text-xs leading-relaxed text-ink-300">{c.advice}</p>}
                    {c.why && <p className="mt-0.5 text-2xs leading-relaxed text-ink-500">{c.why}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {passed.length > 0 && (
        <section>
          <h3 className="text-xs text-ink-400">
            Уже сделано <span className="num text-ink-300">{passed.length}</span>
          </h3>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {passed.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5 text-xs text-ink-300">
                <Check size={12} strokeWidth={2.25} className="text-mint" />
                {c.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-line-soft bg-sunken p-4">
        <h3 className="flex items-center gap-2 text-xs font-medium text-ink-200">
          <Lightbulb size={13} strokeWidth={1.75} className="text-marker" />
          Как работать с промптом дальше
        </h3>
        <ul className="mt-3 space-y-2.5">
          {decompositionTips().map((t, i) => (
            <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
              <span className="idx pt-[2px] text-ink-500">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-ink-300">
                <span className="block text-ink-200">{t.title}</span>
                <span className="mt-0.5 block">{t.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
