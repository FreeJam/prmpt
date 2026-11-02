/**
 * Клиент REST API. База формируется из import.meta.env.BASE_URL ('/prmpt/'),
 * поэтому и в проде под nginx, и в dev-режиме запросы идут по одному пути.
 */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).error || ''; } catch { /* ignore */ }
    throw new Error(`${method} ${path} → ${res.status} ${detail}`);
  }
  if (raw) return res;
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  base: BASE,
  health: () => request('/health'),
  catalog: () => request('/catalog'),
  generate: (config) => request('/generate', { method: 'POST', body: { config } }),
  score: (config) => request('/score', { method: 'POST', body: { config } }),
  tips: () => request('/score/tips'),
  template: (id) => request(`/templates/${id}`),
  presets: {
    list: () => request('/presets'),
    get: (id) => request(`/presets/${id}`),
    create: (payload) => request('/presets', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/presets/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/presets/${id}`, { method: 'DELETE' })
  },
  async downloadZip(config, filename) {
    const res = await request('/export/zip', { method: 'POST', body: { config }, raw: true });
    const blob = await res.blob();
    saveBlob(blob, filename || 'game-project-prmpt.zip');
    return blob.size;
  }
};

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadJson(obj, filename) {
  saveBlob(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }), filename);
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Не удалось прочитать файл'));
    fr.onload = () => {
      try { resolve(JSON.parse(String(fr.result))); }
      catch { reject(new Error('Файл не является корректным JSON')); }
    };
    fr.readAsText(file);
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback для http и старых браузеров
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
