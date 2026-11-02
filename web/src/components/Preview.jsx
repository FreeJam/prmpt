import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy, Download, FileCode2, Eye, Code2, Check, Package, WrapText, FileText,
  BookOpen, Cpu, TerminalSquare, ListChecks, Shield, Map, Maximize2, Minimize2
} from 'lucide-react';
import { renderMarkdown, highlightWithin } from '../lib/markdown.js';
import { copyText, saveBlob } from '../lib/api.js';
import { Badge } from './kit.jsx';

const ICONS = {
  'docs/GDD.md': BookOpen,
  'docs/TECH_SPEC.md': Cpu,
  'AGENT_PROMPT.md': TerminalSquare,
  'TASK_1_SCAFFOLD.md': ListChecks,
  'README.md': FileText,
  '.rules': Shield,
  'docs/PROMPT_ROADMAP.md': Map
};

function bytes(n) {
  return n < 1024 ? `${n} Б` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} КБ` : `${(n / 1048576).toFixed(2)} МБ`;
}

export default function Preview({ project, onExportZip, onToast, exporting, showZip = true }) {
  const { fileList, activeFile, setActiveTab, config, score } = project;
  const [raw, setRaw] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const bodyRef = useRef(null);

  const html = useMemo(
    () => (raw ? '' : renderMarkdown(activeFile?.content ?? '')),
    [activeFile?.content, raw]
  );

  useEffect(() => {
    if (!raw) highlightWithin(bodyRef.current);
  }, [html, raw, activeFile?.path]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [activeFile?.path]);

  const doCopy = async () => {
    const ok = await copyText(activeFile?.content ?? '');
    setCopied(ok);
    onToast(ok ? `Скопировано: ${activeFile.path}` : 'Браузер заблокировал буфер обмена', ok ? 'ok' : 'err');
    setTimeout(() => setCopied(false), 1600);
  };

  const doDownloadFile = () => {
    const name = activeFile.path.split('/').pop();
    saveBlob(new Blob([activeFile.content], { type: 'text/markdown;charset=utf-8' }), name);
    onToast(`Скачано: ${name}`, 'ok');
  };

  const lines = (activeFile?.content ?? '').split('\n').length;
  const size = new TextEncoder().encode(activeFile?.content ?? '').length;

  return (
    <div className={`panel flex min-h-0 flex-col overflow-hidden ${full ? 'fixed inset-3 z-40' : 'h-full'}`}>
      {/* Tabs */}
      <div className="flex items-stretch gap-1 overflow-x-auto border-b border-line-soft bg-bg-700/40 px-2 pt-2">
        {fileList.filter((f) => f.primary).map((f) => {
          const Icon = ICONS[f.path] ?? FileCode2;
          const active = f.path === activeFile?.path;
          return (
            <button
              key={f.path}
              type="button"
              onClick={() => setActiveTab(f.path)}
              title={f.hint}
              className={`group relative flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-[12px] transition-colors
                ${active
                  ? 'border-accent bg-bg-800 text-ink-100'
                  : 'border-transparent text-ink-400 hover:bg-bg-600/50 hover:text-ink-200'}`}
            >
              <Icon size={13} className={active ? 'text-accent-soft' : ''} />
              <span className="font-mono">{f.title}</span>
            </button>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center gap-1 pb-1.5 pl-2">
          {fileList.length > 4 && (
            <div className="relative">
              <select
                className="cursor-pointer rounded-md border border-line bg-bg-600/60 px-2 py-1 text-[11px] text-ink-300"
                value={fileList.some((f) => f.path === activeFile?.path && !f.primary) ? activeFile.path : ''}
                onChange={(e) => e.target.value && setActiveTab(e.target.value)}
              >
                <option value="">ещё файлы…</option>
                {fileList.filter((f) => !f.primary).map((f) => (
                  <option key={f.path} value={f.path}>{f.path}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-soft bg-bg-800/60 px-2.5 py-2">
        <span className="mr-1 font-mono text-[11px] text-ink-400">{config.meta.packageName}/{activeFile?.path}</span>
        <Badge>{lines} строк</Badge>
        <Badge>{bytes(size)}</Badge>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" className="btn btn-sm" onClick={() => setRaw((v) => !v)} title="Показать исходный Markdown">
            {raw ? <Eye size={13} /> : <Code2 size={13} />}
            {raw ? 'Превью' : 'Исходник'}
          </button>
          {!raw && (
            <button type="button" className="btn btn-sm" onClick={() => setWrap((v) => !v)} title="Перенос длинных строк" >
              <WrapText size={13} className={wrap ? 'text-accent-soft' : ''} />
            </button>
          )}
          <button type="button" className="btn btn-sm" onClick={() => setFull((v) => !v)} title="Развернуть на весь экран">
            {full ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button type="button" className="btn btn-sm" onClick={doCopy}>
            {copied ? <Check size={13} className="text-mint" /> : <Copy size={13} />} Копировать
          </button>
          <button type="button" className="btn btn-sm" onClick={doDownloadFile}>
            <Download size={13} /> .md
          </button>
          {showZip && (
            <button type="button" className="btn btn-sm btn-primary" onClick={onExportZip} disabled={exporting}>
              <Package size={13} /> {exporting ? 'Сборка…' : 'Скачать ZIP'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto bg-bg-800/20 p-4 sm:p-5">
        {raw ? (
          <pre className={`whitespace-pre font-mono text-[12.5px] leading-[1.65] text-ink-200 ${wrap ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto'}`}>
            {activeFile?.content}
          </pre>
        ) : (
          <article
            className={`md mx-auto max-w-3xl animate-fade-in ${wrap ? '' : 'min-w-max max-w-none'}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-bg-800/60 px-3 py-2 text-[11px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${score.score >= 75 ? 'bg-mint' : score.score >= 55 ? 'bg-amber' : 'bg-rose'}`} />
          Живой пересчёт при каждом изменении формы
        </span>
        <span className="ml-auto">ZIP содержит: README.md · AGENT_PROMPT.md · TASK_1_SCAFFOLD.md · .rules · docs/{'{GDD,TECH_SPEC,PROMPT_ROADMAP,PROMPT_QUALITY}.md'} · prmpt.config.json</span>
      </div>
    </div>
  );
}
