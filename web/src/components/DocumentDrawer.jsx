import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { renderMarkdown, highlightWithin } from '../lib/markdown.js';
import { copyText } from '../lib/api.js';

/**
 * Боковая панель «Посмотреть документы» — заглянуть в результат, не покидая визард.
 */
export default function DocumentDrawer({ open, onClose, project, onToast }) {
  const { fileList, activeFile, setActiveTab } = project;
  const bodyRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => (open ? renderMarkdown(activeFile?.content ?? '') : ''), [open, activeFile?.content]);

  useEffect(() => {
    if (open) highlightWithin(bodyRef.current);
  }, [html, open, activeFile?.path]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-drawer bg-black/35 transition-opacity duration-300 dark:bg-black/60 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-drawer flex w-full max-w-2xl flex-col border-l border-line bg-surface transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] text-ink-100">Документы проекта</p>
            <p className="num truncate text-2xs text-ink-500">{activeFile?.path}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="btn btn-sm"
              onClick={async () => {
                const ok = await copyText(activeFile?.content ?? '');
                setCopied(ok);
                onToast(ok ? `Скопировано: ${activeFile.path}` : 'Браузер заблокировал буфер обмена', ok ? 'ok' : 'err');
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check size={13} strokeWidth={2.25} className="text-mint" /> : <Copy size={13} strokeWidth={1.75} />}
              Копировать
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Закрыть предпросмотр">
              <X size={15} strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-line bg-sunken px-3 py-2">
          {fileList
            .filter((f) => f.primary)
            .map((f) => {
              const on = f.path === activeFile?.path;
              return (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setActiveTab(f.path)}
                  aria-current={on ? 'true' : undefined}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-2xs transition-colors duration-200 ${
                    on ? 'bg-surface text-ink-100 shadow-soft' : 'text-ink-400 hover:bg-hover hover:text-ink-200'
                  }`}
                >
                  <span className="num">{f.title}</span>
                </button>
              );
            })}
        </div>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-6">
          <article className="md mx-auto max-w-2xl" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </aside>
    </>
  );
}
