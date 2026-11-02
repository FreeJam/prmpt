import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import csharp from 'highlight.js/lib/languages/csharp';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';

const LANGS = { javascript, typescript, python, csharp, bash, json, markdown, plaintext };
for (const [name, def] of Object.entries(LANGS)) hljs.registerLanguage(name, def);
// алиасы
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('py', python);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('text', plaintext);
hljs.registerLanguage('plaintext', plaintext);

marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

/**
 * Markdown → безопасный HTML. gdscript/другие неизвестные языки рендерим как plaintext.
 */
export function renderMarkdown(md) {
  const raw = marked.parse(String(md ?? ''));
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target', 'rel', 'class'],
    FORBID_TAGS: ['style', 'iframe', 'form', 'script', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  });
}

/** Подсветка кода внутри уже отрендеренного контейнера. */
export function highlightWithin(container) {
  if (!container) return;
  container.querySelectorAll('pre code').forEach((el) => {
    if (el.dataset.hl === '1') return;
    const m = /language-([\w-]+)/.exec(el.className || '');
    const lang = m ? m[1].toLowerCase() : 'plaintext';
    el.dataset.hl = '1';
    try {
      const res = hljs.getLanguage(lang)
        ? hljs.highlight(el.textContent, { language: lang })
        : hljs.highlight(el.textContent, { language: 'plaintext' });
      el.innerHTML = res.value;
      el.classList.add('hljs');
    } catch {
      /* оставляем как есть */
    }
  });
}
