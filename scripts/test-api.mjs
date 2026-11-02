/**
 * PRMPT — сквозной тест API и ZIP-экспорта.
 * Требует запущенного сервера: node scripts/test-api.mjs [baseUrl]
 */
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE = process.argv[2] || 'http://127.0.0.1:8030';
let pass = 0;
let fail = 0;

function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ''}`); }
}

async function json(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not json */ }
  return { res, data, text };
}

console.log(`\nPRMPT API tests → ${BASE}\n`);

/* 1. health */
console.log('1) Служебные');
const h = await json('/api/health');
ok('GET /api/health отвечает 200', h.res.status === 200);
ok('ok:true и имя сервиса', h.data?.ok === true && h.data?.service === 'prmpt-api', `v${h.data?.version} node ${h.data?.node}`);

/* 2. статика SPA */
const page = await fetch(`${BASE}/`);
const pageHtml = await page.text();
ok('GET / отдаёт SPA', page.status === 200 && pageHtml.includes('<div id="root">'));
ok('index.html ссылается на /prmpt/assets', pageHtml.includes('/prmpt/assets/'), pageHtml.match(/\/prmpt\/assets\/[^"]+/)?.[0]);

/* 3. каталог */
console.log('\n2) Каталог');
const cat = await json('/api/catalog');
ok('GET /api/catalog', cat.res.status === 200);
ok('движки, жанры, паттерны, шаблоны присутствуют',
  cat.data?.engines?.length >= 5 && cat.data?.genres?.length >= 5 && cat.data?.patterns?.length >= 5 && cat.data?.templates?.length === 4,
  `движков ${cat.data?.engines?.length}, паттернов ${cat.data?.patterns?.length}, шаблонов ${cat.data?.templates?.length}`);

/* 4. шаблоны */
console.log('\n3) Шаблоны');
for (const id of ['platformer', 'arena', 'runner', 'puzzle']) {
  const t = await json(`/api/templates/${id}`);
  ok(`шаблон ${id}`, t.res.status === 200 && !!t.data?.config?.meta?.projectName, t.data?.config?.meta?.projectName);
}
const t404 = await json('/api/templates/nope');
ok('неизвестный шаблон → 404', t404.res.status === 404);

/* 5. генерация */
console.log('\n4) Генерация документов');
const gen = await json('/api/generate', { method: 'POST', body: { config: { meta: { engine: 'godot', projectName: 'Test Game' } } } });
ok('POST /api/generate', gen.res.status === 200);
const paths = (gen.data?.files ?? []).map((f) => f.path);
const required = ['docs/GDD.md', 'docs/TECH_SPEC.md', 'AGENT_PROMPT.md', 'TASK_1_SCAFFOLD.md'];
ok('все 4 основных файла сгенерированы', required.every((p) => paths.includes(p)), paths.length + ' файлов');
const empty = (gen.data?.files ?? []).filter((f) => !f.content || f.content.length < 200);
ok('нет пустых/огрызочных файлов', empty.length === 0, empty.map((f) => f.path).join(', ') || 'все содержательны');
const gdd = (gen.data?.files ?? []).find((f) => f.path === 'docs/GDD.md')?.content ?? '';
ok('GDD содержит движок Godot', /Godot/.test(gdd));
const task = (gen.data?.files ?? []).find((f) => f.path === 'TASK_1_SCAFFOLD.md')?.content ?? '';
ok('TASK_1 адаптирован под Godot (project.godot)', /project\.godot/.test(task));
const prompt = (gen.data?.files ?? []).find((f) => f.path === 'AGENT_PROMPT.md')?.content ?? '';
ok('в промпте есть DoD-чекбоксы', /- \[ \]/.test(prompt));
ok('в промпте есть раздел запретов', /ЗАПРЕЩЕНО/.test(prompt));

/* 6. оценка */
console.log('\n5) Prompt Quality Score');
const sc = await json('/api/score', { method: 'POST', body: { config: {} } });
ok('POST /api/score', sc.res.status === 200);
ok('оценка в диапазоне 0..100', sc.data?.score?.score >= 0 && sc.data?.score?.score <= 100, `${sc.data?.score?.score}/100 — ${sc.data?.score?.grade?.label}`);
const poor = await json('/api/score', { method: 'POST', body: { config: { prompt: { role: '', dod: [], forbidden: [], strategy: [] }, meta: { coreMechanic: 'игра' } } } });
ok('пустой промпт получает низкую оценку', poor.data?.score?.score < 60, `${poor.data?.score?.score}/100`);

/* 7. пресеты */
console.log('\n6) Пресеты (CRUD)');
const created = await json('/api/presets', { method: 'POST', body: { name: 'Тестовый пресет', config: { meta: { projectName: 'Preset Test' } } } });
ok('POST /api/presets → 201', created.res.status === 201 && !!created.data?.preset?.id);
const pid = created.data?.preset?.id;
const list = await json('/api/presets');
ok('GET /api/presets содержит созданный', (list.data?.presets ?? []).some((p) => p.id === pid), `всего ${list.data?.presets?.length}`);
ok('список не раскрывает полный config (лёгкий ответ)', !(list.data?.presets ?? []).find((p) => p.id === pid)?.config);
const one = await json(`/api/presets/${pid}`);
ok('GET /api/presets/:id возвращает config', one.data?.preset?.config?.meta?.projectName === 'Preset Test');
const upd = await json(`/api/presets/${pid}`, { method: 'PUT', body: { name: 'Переименован' } });
ok('PUT /api/presets/:id', upd.data?.preset?.name === 'Переименован');
const del = await json(`/api/presets/${pid}`, { method: 'DELETE' });
ok('DELETE /api/presets/:id → 204', del.res.status === 204);
const gone = await json(`/api/presets/${pid}`);
ok('удалённый пресет → 404', gone.res.status === 404);

/* 8. ZIP */
console.log('\n7) Экспорт ZIP');
const zipRes = await fetch(`${BASE}/api/export/zip`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ config: { meta: { projectName: 'Zip Test', packageName: 'zip_test', engine: 'phaser' } } })
});
const zipBuf = Buffer.from(await zipRes.arrayBuffer());
ok('POST /api/export/zip → 200', zipRes.status === 200);
ok('Content-Type: application/zip', zipRes.headers.get('content-type') === 'application/zip');
ok('Content-Disposition с именем файла', /attachment; filename="zip_test-prmpt\.zip"/.test(zipRes.headers.get('content-disposition') || ''), zipRes.headers.get('content-disposition'));
ok('PK-сигнатура архива', zipBuf.subarray(0, 2).toString('latin1') === 'PK', `${zipBuf.length} байт`);

const tmp = '/tmp/prmpt-test-export.zip';
writeFileSync(tmp, zipBuf);
let listing = '';
try {
  listing = execFileSync('python3', ['-c', `
import zipfile, sys
z = zipfile.ZipFile('${tmp}')
bad = z.testzip()
names = sorted(z.namelist())
print('BAD:', bad)
print('COUNT:', len(names))
for n in names: print(name if False else n)
`], { encoding: 'utf8' });
} catch (e) {
  listing = `ERROR ${e.message}`;
}
const bad = /BAD: None/.test(listing);
const count = Number((/COUNT: (\d+)/.exec(listing) || [])[1] || 0);
const names = listing.split('\n').slice(2).filter(Boolean);
ok('архив проходит проверку целостности (python zipfile)', bad, 'testzip → None');
ok('9 файлов в архиве', count === 9, `${count} записей`);
ok('все пути внутри папки zip_test/', names.every((n) => n.startsWith('zip_test/')));
for (const f of ['README.md', 'AGENT_PROMPT.md', 'TASK_1_SCAFFOLD.md', '.rules', 'docs/GDD.md', 'docs/TECH_SPEC.md', 'docs/PROMPT_ROADMAP.md', 'docs/PROMPT_QUALITY.md', 'prmpt.config.json']) {
  ok(`архив содержит ${f}`, names.includes(`zip_test/${f}`));
}

/* 9. UTF-8 в архиве */
const zipUtf = await fetch(`${BASE}/api/export/zip`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ config: { meta: { projectName: 'Игра «Тест»', packageName: 'test_ru' } } })
});
writeFileSync('/tmp/prmpt-test-utf.zip', Buffer.from(await zipUtf.arrayBuffer()));
const utfCheck = (() => {
  try {
    return execFileSync('python3', ['-c', `
import zipfile
z = zipfile.ZipFile('/tmp/prmpt-test-utf.zip')
gdd = z.read('test_ru/docs/GDD.md').decode('utf-8')
print('OK' if 'Игра' in gdd else 'FAIL')
print(len(gdd))
`], { encoding: 'utf8' });
  } catch (e) {
    return `ERROR ${e.message.split('\n')[0]}`;
  }
})();
ok('UTF-8 русский текст читается из архива', utfCheck.startsWith('OK'), utfCheck.trim().split('\n')[0]);

/* 10. Ошибки */
console.log('\n8) Обработка ошибок');
const nf = await json('/api/nope');
ok('несуществующий API-путь → 404 JSON', nf.res.status === 404 && nf.data?.error === 'not_found');
const badBody = await fetch(`${BASE}/api/presets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{ broken' });
ok('битый JSON → 4xx, сервер жив', badBody.status >= 400 && badBody.status < 500, String(badBody.status));
const alive = await json('/api/health');
ok('сервер не упал после битого запроса', alive.res.status === 200);
const expFile = await json('/api/export/file', { method: 'POST', body: { config: {}, path: '../../etc/passwd' } });
ok('запрос файла вне каталога → 404', expFile.res.status === 404);

console.log(`\n──────────────\nПройдено: ${pass}   Провалено: ${fail}\n`);
process.exit(fail === 0 ? 0 : 1);
