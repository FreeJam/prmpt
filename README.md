# PRMPT — GameDev Prompt & Markdown Architect

Интерактивный конструктор системных промптов и Markdown-документации (GDD, Tech Spec, TASK) для создания игр
с помощью ИИ-агентов: **OpenCode, Cursor, Aider, Claude Code**.

**Прод:** https://freejam.online/prmpt/

## Что делает

1. **Визард из 4 шагов** — Концепт → Сущности и механики → Техническая архитектура → Промпт для агента.
2. **Split-screen live preview** — слева форма, справа готовые файлы с мгновенным пересчётом:
   `GDD.md`, `TECH_SPEC.md`, `AGENT_PROMPT.md`, `TASK_1_SCAFFOLD.md` (+ `README.md`, `.rules`, `PROMPT_ROADMAP.md`).
3. **Prompt Quality Score** — эвристическая оценка промпта (0–100) с разбором каждой проверки и
   обучающим блоком о декомпозиции задач для агентов.
4. **Пресеты и шаблоны** — 4 встроенных шаблона (2D Platformer, Top-Down Arena, Endless Runner, Grid Puzzle),
   сохранение своих пресетов на сервере, импорт/экспорт конфигурации в `.json`.
5. **Экспорт** — копирование любого файла в буфер в один клик и скачивание ZIP со всей структурой проекта.

Генерация документации адаптируется под движок: для Unity/Godot/Phaser/Three.js/Pygame меняются
структура папок, команды запуска и тестов, соглашения по коду, подводные камни, файлы и шаги
первой итерации в `TASK_1_SCAFFOLD.md`.

## Стек

| Слой | Технология |
|---|---|
| Фронтенд | React 18 + Vite 5 + Tailwind CSS 3, lucide-react, marked + DOMPurify + highlight.js |
| Бэкенд | Node.js 20+ / Express 4 (ESM), без native-зависимостей |
| Хранилище | JSON-файл с атомарной записью (`data/presets.json`) |
| Экспорт | собственный ZIP-writer на `node:zlib` (deflate + CRC-32) |
| Деплой | systemd (`prmpt-api.service`) + Nginx; альтернативно Dockerfile / docker-compose |

## Структура

```
prmpt/
├── shared/              # код, общий для фронта и бэка — единый источник правды
│   ├── catalog.js       # движки, жанры, паттерны, системы, варианты DoD/запретов
│   ├── schema.js        # схема конфигурации, дефолты, нормализация, валидация
│   ├── templates.js     # 4 встроенных шаблона проектов
│   ├── generator.js     # генерация всех Markdown-документов и промптов
│   └── score.js         # Prompt Quality Score + обучающие материалы
├── server/              # Express API + раздача SPA
│   ├── index.js
│   ├── routes/api.js    # /api/{health,catalog,generate,score,presets,export}
│   └── lib/{store,zip}.js
├── web/                 # SPA: src/{components,state,lib}, сборка в web/dist
├── data/presets.json    # хранилище пресетов
├── deploy/              # unit systemd, фрагмент nginx, инструкции
├── scripts/             # тесты API и установка nginx-локации
├── Dockerfile, docker-compose.yml
└── prmpt.md             # исходное ТЗ
```

Ключевое решение: **`shared/` используется и браузером, и сервером**. Поэтому превью в UI и содержимое
ZIP-архива совпадают побайтово, а Prompt Quality Score считается мгновенно, без обращения к серверу.

## Локальная разработка

```bash
npm install
npm run build              # сборка SPA в web/dist
npm start                  # http://127.0.0.1:8030  (SPA + API)

npm --prefix web run dev   # dev-сервер Vite на :5140 с проксированием /api
```

## API

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | состояние сервиса |
| GET | `/api/catalog` | движки, жанры, паттерны, шаблоны, дефолтная конфигурация |
| GET | `/api/templates/:id` | конфигурация встроенного шаблона |
| POST | `/api/generate` | сгенерировать все документы + оценка промпта |
| POST | `/api/score` | Prompt Quality Score для конфигурации |
| GET/POST/PUT/DELETE | `/api/presets[/:id]` | CRUD пресетов |
| POST | `/api/export/zip` | ZIP со структурой проекта |
| POST | `/api/export/file` | один файл документа |

## Тесты

```bash
node scripts/test-api.mjs                       # против локального сервера
node scripts/test-api.mjs https://freejam.online/prmpt
```

Сквозной набор проверяет API, генерацию всех документов, оценку промпта, CRUD пресетов,
ZIP (целостность через `python3 zipfile.testzip`, UTF-8, имена путей) и обработку ошибок.
