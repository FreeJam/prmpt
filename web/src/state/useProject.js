import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultConfig, normalizeConfig, validateConfig } from '@shared/schema.js';
import { TEMPLATES } from '@shared/templates.js';
import { generateFiles, FILE_CATALOG } from '@shared/generator.js';
import { scorePrompt } from '@shared/score.js';

const LS_KEY = 'prmpt.project.v1';
const LS_UI = 'prmpt.ui.v1';

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Иммутабельная установка значения по пути-массиву. */
function setIn(obj, path, value) {
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head] = rest.length ? setIn(copy[head] ?? {}, rest, value) : value;
    return copy;
  }
  const copy = { ...(obj ?? {}) };
  copy[head] = rest.length ? setIn(copy[head] ?? {}, rest, value) : value;
  return copy;
}

function getIn(obj, path) {
  return path.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

export function useProject() {
  const [config, setConfig] = useState(() => normalizeConfig(loadLocal(LS_KEY, undefined) ?? defaultConfig()));
  const [ui, setUi] = useState(() => ({
    activeTab: 'docs/GDD.md',
    ...loadLocal(LS_UI, {})
  }));

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(config)); } catch { /* quota */ }
    }, 250);
    return () => clearTimeout(t);
  }, [config]);

  useEffect(() => {
    try { localStorage.setItem(LS_UI, JSON.stringify(ui)); } catch { /* quota */ }
  }, [ui]);

  const set = useCallback((path, value) => {
    setConfig((c) => setIn(c, Array.isArray(path) ? path : String(path).split('.'), value));
  }, []);

  const patchProject = useCallback((partial) => {
    setConfig((c) => normalizeConfig({ ...structuredClone(c), ...partial }));
  }, []);

  const toggleIn = useCallback((path, value) => {
    setConfig((c) => {
      const arr = getIn(c, path) ?? [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return setIn(c, path, next);
    });
  }, []);

  const listOp = useCallback((path, op) => {
    setConfig((c) => {
      const arr = (getIn(c, path) ?? []).slice();
      const res = op(arr);
      return setIn(c, path, res ?? arr);
    });
  }, []);

  const applyConfig = useCallback((cfg, { reset = true } = {}) => {
    setConfig(normalizeConfig(reset ? { ...defaultConfig(), ...cfg } : cfg));
  }, []);

  const applyTemplate = useCallback((id) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return false;
    setConfig(normalizeConfig(t.config));
    return true;
  }, []);

  const reset = useCallback(() => setConfig(normalizeConfig(defaultConfig())), []);

  const files = useMemo(() => generateFiles(config, { withConfig: false }), [config]);
  const score = useMemo(() => scorePrompt(config), [config]);
  const validation = useMemo(() => validateConfig(config), [config]);

  const selectors = useMemo(() => ({
    engine: config.meta.engine,
    genre: config.meta.genre,
    packageName: config.meta.packageName,
    projectName: config.meta.projectName
  }), [config]);

  const fileList = useMemo(() => FILE_CATALOG.map((f) => ({ ...f, content: files[f.path] ?? '' })), [files]);
  const activeFile = fileList.find((f) => f.path === ui.activeTab) ?? fileList[0];

  return {
    config, set, patch: patchProject, toggleIn, listOp, applyConfig, applyTemplate, reset,
    files, fileList, activeFile, score, validation, selectors,
    ui, setUi,
    setActiveTab: (tab) => setUi((u) => ({ ...u, activeTab: tab }))
  };
}
