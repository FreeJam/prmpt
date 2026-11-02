/**
 * PRMPT — генератор Markdown-документации и промптов для ИИ-агентов.
 * Чистый ESM без зависимостей: используется и фронтендом, и бэкендом (ZIP-экспорт),
 * поэтому содержимое архива всегда совпадает с тем, что видно в превью.
 */
import { ENGINES, GENRES, PLATFORMS, PATTERNS, STATE_MODES, GAME_SYSTEMS, SCOPE_LEVELS } from './catalog.js';
import { normalizeConfig, slug } from './schema.js';

export const PRIMARY_FILES = ['docs/GDD.md', 'docs/TECH_SPEC.md', 'AGENT_PROMPT.md', 'TASK_1_SCAFFOLD.md'];

/* ─────────────────────────── helpers ─────────────────────────── */

const label = (list, id, fallback = id) => list.find((x) => x.id === id)?.label ?? fallback;
const clean = (s) => String(s ?? '').trim();
const bullets = (arr, indent = '') => (arr?.length ? arr.map((x) => `${indent}- ${clean(x)}`).join('\n') : `${indent}_Не задано_`);
const numbered = (arr, indent = '') => (arr?.length ? arr.map((x, i) => `${indent}${i + 1}. ${clean(x)}`).join('\n') : `${indent}_Не задано_`);
const table = (headers, rows) => {
  const head = `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|`;
  const body = rows.map((r) => `| ${r.map((c) => clean(c).replace(/\|/g, '\\|') || '—').join(' | ')} |`).join('\n');
  return `${head}\n${body}`;
};
const fence = (lang, code) => '```' + lang + '\n' + code.replace(/\s+$/, '') + '\n```';

function patternTitles(ids = []) {
  return ids.map((id) => PATTERNS.find((p) => p.id === id)).filter(Boolean);
}

function engineOf(cfg) {
  return ENGINES[cfg.meta.engine] ?? ENGINES.custom;
}

function folderTree(cfg) {
  if (cfg.tech.folderStructure === 'custom' && clean(cfg.tech.customFolders)) {
    return clean(cfg.tech.customFolders);
  }
  return engineOf(cfg).folders.join('\n');
}

function enabledSystems(cfg) {
  return GAME_SYSTEMS.filter((s) => cfg.gameplay.systems?.[s.id]);
}

const AGENT_LABELS = {
  opencode: 'OpenCode',
  cursor: 'Cursor',
  aider: 'Aider',
  'claude-code': 'Claude Code',
  codex: 'Codex CLI',
  chat: 'ChatGPT / Claude / Gemini в режиме чата'
};

export function agentLabel(cfg) {
  const id = clean(cfg.prompt.agent);
  return AGENT_LABELS[id] ?? (id || 'OpenCode');
}

/* ─────────────────────────── GDD ─────────────────────────── */

export function generateGDD(cfg) {
  const e = engineOf(cfg);
  const sys = enabledSystems(cfg);
  const scope = label(SCOPE_LEVELS, cfg.meta.scope);
  const genre = label(GENRES, cfg.meta.genre);
  const platform = label(PLATFORMS, cfg.meta.platform);
  const p = cfg.gameplay.player;

  return `# GDD — ${cfg.meta.projectName}

> Game Design Document. Источник правды по **что** мы делаем и **зачем**.
> Технические решения — в \`docs/TECH_SPEC.md\`. Промпт для агента — в \`AGENT_PROMPT.md\`.

${table(['Параметр', 'Значение'], [
  ['Название', cfg.meta.projectName],
  ['Пакет / папка', `\`${cfg.meta.packageName}\``],
  ['Жанр', genre],
  ['Движок', `${e.label} (${e.language} ${e.version})`],
  ['Платформа', platform],
  ['Арт-стиль', cfg.meta.artStyle],
  ['Объём', scope],
  ['Целевое число итераций', cfg.meta.targetIterations],
])}

## 1. Питч

${clean(cfg.meta.pitch) || '_Не задан_'}

## 2. Кор-механика

${clean(cfg.meta.coreMechanic) || '_Не задана_'}

**Референсы:** ${clean(cfg.meta.references) || '—'}

## 3. Кор-игровой цикл

${numbered(cfg.gameplay.coreLoop)}

## 4. Управление

| Действие | Клавиши / ввод |
|---|---|
| Основное управление | ${clean(p.controls) || '—'} |

**Способности игрока:**

${bullets(p.abilities)}

## 5. Игровые сущности

### 5.1 Игрок

${table(['Параметр', 'Значение'], [
  ['Имя', p.name],
  ['Здоровье (HP)', p.hp],
  ['Базовая скорость', p.speed],
  ['Способности', (p.abilities || []).join(', ')],
])}

### 5.2 Враги

${cfg.gameplay.enemies?.length
    ? table(['Имя', 'Поведение', 'HP', 'Урон', 'Заметки'], cfg.gameplay.enemies.map((x) => [x.name, x.behavior, x.hp, x.damage, x.notes]))
    : '_Не заданы_'}

### 5.3 Препятствия

${cfg.gameplay.obstacles?.length
    ? table(['Имя', 'Поведение', 'Значение'], cfg.gameplay.obstacles.map((x) => [x.name, x.behavior, x.value]))
    : '_Не заданы_'}

### 5.4 Подбираемые предметы

${cfg.gameplay.pickups?.length
    ? table(['Имя', 'Эффект', 'Значение'], cfg.gameplay.pickups.map((x) => [x.name, x.effect, x.value]))
    : '_Не заданы_'}

## 6. Системы игры

${sys.length
    ? table(['Система', 'Что входит'], sys.map((s) => [s.label, s.detail]))
    : '_Не выбрано_'}

## 7. Прогрессия и сложность

- **Модель прогрессии:** ${clean(cfg.gameplay.progression)}
- **Кривая сложности:** ${clean(cfg.gameplay.difficulty)}

### Контент / уровни

${cfg.gameplay.levels?.length
    ? table(['Название', 'Цель'], cfg.gameplay.levels.map((l) => [l.name, l.goal]))
    : '_Не задано_'}

## 8. Условия победы и поражения

- **Победа:** ${clean(cfg.gameplay.winCondition)}
- **Поражение:** ${clean(cfg.gameplay.loseCondition)}

## 9. Арт и звук

- **Стиль:** ${cfg.meta.artStyle}
- **Правило ассетов:** только плейсхолдеры, генерируемые кодом (цветные примитивы, простые полигоны). Внешние ассеты не подключаем.
- **Звук:** ${cfg.gameplay.systems?.audio ? 'процедурные/pickup-звуки через встроенные средства движка; при отсутствии — заглушка с пометкой `PLACEHOLDER`' : 'не входит в объём'}

## 10. Границы объёма (Scope Guard)

**Входит в текущий объём (${scope}):**

${numbered(cfg.gameplay.coreLoop)}

**НЕ входит в объём (не делать, пока не попросят явно):**

- Сетевая игра, мультиплеер, серверная логика
- Покупки, аккаунты, база данных
- Внешние ассеты и платные SDK
- Полировка, не влияющая на игровой цикл

## 11. Критерии готовности (Definition of Done)

${bullets(cfg.prompt.dod)}

---
_Сгенерировано PRMPT • freejam.online/prmpt • schema v${cfg.schema}_
`;
}

/* ─────────────────────────── TECH SPEC ─────────────────────────── */

export function generateTechSpec(cfg) {
  const e = engineOf(cfg);
  const pats = patternTitles(cfg.tech.patterns);
  const stateMode = label(STATE_MODES, cfg.tech.stateMode);
  const sys = enabledSystems(cfg);
  const pkg = cfg.meta.packageName;

  const entryBlock = {
    godot: `project.godot → autoload (EventBus, GameState) → scenes/Main.tscn`,
    unity: `Assets/Scenes/Main.unity → MainBootstrap.cs (Awake) → сервисы-синглтоны → игровые сцены`,
    phaser: `src/main.ts (Phaser.Game config) → BootScene → PreloadScene → MenuScene → GameScene (+ UIScene параллельно)`,
    three: `src/main.ts → Game (bootstrap) → SceneManager → системный update(dt) в requestAnimationFrame`,
    pygame: `main.py → pygame.init() → GameLoop → активная Scene.handle_events()/update()/draw()`,
    custom: `точка входа: ${e.entry}`
  }[e.id];

  const dataModel = {
    godot: `Ресурсы \`.tres\` (EnemyData, LevelData) + словари состояния в GameState (autoload).`,
    unity: `ScriptableObject для контента (EnemyConfig, LevelConfig), обычные классы для рантайм-состояния.`,
    phaser: `Интерфейсы в \`src/types/\`, конфиги в \`src/config/balance.ts\`. Сущности — классы-обёртки над Phaser.GameObjects.`,
    three: `Классы-сущности поверх Object3D; данные — plain-объекты; конфиг в \`src/config/balance.ts\`.`,
    pygame: `dataclasses в \`src/entities/\`, константы в \`src/config.py\`; спрайты — pygame.sprite.Sprite.`,
    custom: `описать в этом разделе`
  }[e.id];

  return `# TECH_SPEC — ${cfg.meta.projectName}

> Архитектурное ТЗ. Источник правды по **как** мы это делаем.
> Дизайн — в \`docs/GDD.md\`. Промпт для агента — в \`AGENT_PROMPT.md\`.

## 1. Стек и версии

${table(['Слой', 'Технология', 'Версия', 'Примечание'], [
  ['Движок / фреймворк', e.label, e.version, 'Менять запрещено'],
  ['Язык', e.language, '—', 'Строгий режим / аннотации обязательны'],
  ['Пакетный менеджер', e.pkgManager, '—', '—'],
  ['Тесты', e.testFramework, '—', 'Только на чистую логику'],
])}

**Команда запуска:** \`${e.runCmd}\`
**Команда тестов:** \`${e.testCmd}\`
**Точка входа:** \`${e.entry}\`

## 2. Архитектурные паттерны

${pats.length
    ? pats.map((x) => `### ${x.label}\n\n${x.why}\n\n_Обязательно к применению в соответствующих подсистемах._`).join('\n\n')
    : '_Паттерны не выбраны. Минимум: FSM для состояний + Event-driven для связи систем._'}

## 3. Структура папок

${fence('text', folderTree(cfg))}

Правила:
- Новые файлы создавать **только** внутри этой структуры.
- Один файл — одна ответственность. Файл > 400 строк — сигнал к декомпозиции.
- Тестовые файлы — рядом с тестируемым кодом (суффикс \`.test\`/\`_test\`).

## 4. Точка входа и поток выполнения

\`\`\`
${entryBlock}
\`\`\`

Игровой цикл (референсная реализация):

${fence(e.language === 'Python' ? 'python' : 'ts', loopSnippet(cfg))}

## 5. Модель данных

${dataModel}

**Ключевые сущности:**

${table(['Сущность', 'Поля', 'Ответственность'], [
  ['Player', 'hp, speed, state, position, velocity', 'Чтение ввода, FSM-состояния, применение урона'],
  ['Enemy', 'hp, damage, behavior, position', 'Собственный FSM, патруль/атака, выдача событий'],
  ['Pickup', 'effect, value', 'Реакция на коллизию, публикация события подбора'],
  ['GameState', 'score, multiplier, hp, distance, isPaused, isGameOver', 'Единая точка правды о прогрессе'],
  ...(cfg.gameplay.systems?.save ? [['SaveData', 'bestScore, settings, unlocked', 'Сериализация в ' + cfg.tech.saveFormat]] : []),
])}

## 6. Управление состоянием

**Модель:** ${stateMode}

${cfg.tech.stateMode === 'singleton-services'
      ? '- Сервисы-синглтоны: `EventBus`, `GameState`, `ScoreService`, `AudioService`. Доступ только через них, не через поиск по дереву сцены.'
      : ''}${cfg.tech.stateMode === 'event-driven' || cfg.tech.stateMode === 'store'
      ? '- События — единственный канал уведомлений. UI подписывается на изменения, а не опрашивает состояние каждый кадр.'
      : ''}${cfg.tech.stateMode === 'local'
      ? '- Состояние живёт внутри сцены; передача между сценами — через явные параметры инициализации.'
      : ''}${cfg.tech.stateMode === 'scriptable'
      ? '- Контент — в ресурсах/ScriptableObject; рантайм-состояние отдельно от контента.'
      : ''}

**Обязательные события шины:**

${table(['Событие', 'Издатель', 'Подписчики'], [
  ['player:damaged', 'Player', 'UI (HP-бар), AudioService, GameState'],
  ['pickup:collected', 'Pickup', 'ScoreService, AudioService, UI'],
  ['score:changed', 'ScoreService', 'UI, SaveService'],
  ['game:over', 'GameState', 'UI, AudioService, SceneManager'],
  ['game:paused', 'InputManager', 'все системы (заморозка update)'],
])}

## 7. Конфигурация и баланс

${cfg.tech.dataDriven
      ? `Все числовые значения баланса — в одном конфиг-файле. Код не содержит магических чисел.\n\n${fence(e.language === 'Python' ? 'python' : 'ts', balanceSnippet(e))}`
      : 'Баланс допускается в коде, но с именованными константами и комментарием.'}

## 8. Производительность

- **Бюджет:** ${clean(cfg.tech.perfTarget)}
- **Разрешение/канвас:** ${clean(cfg.tech.resolution)}
- Никаких аллокаций объектов в игровом цикле — переиспользование через пул.
- Отладочный оверлей (FPS + число активных сущностей) включается флагом \`DEBUG\`.

## 9. Сохранение и загрузка

${cfg.gameplay.systems?.save
      ? `- Формат: ${clean(cfg.tech.saveFormat)}
- Версионирование: поле \`version\` в SaveData, миграции при несовпадении.
- Ошибку чтения не глушить: логировать и стартовать с дефолтными значениями.
- Сохранять при \`game:over\` и изменении настроек, не каждый кадр.`
      : '- Сохранение прогресса не входит в объём.'}

## 10. Тестирование

- **Инструмент:** ${e.testFramework}
- **Команда:** \`${e.testCmd}\`
- **Обязательный минимум тестов (чистая логика, без рендера):**
  1. Начисление очков и множителя при подборе.
  2. Сброс множителя при уроне.
  3. Применение урона и переход в состояние смерти при HP = 0.
  4. Классификация результата (победа / поражение).
  5. Сериализация и чтение SaveData.

## 11. Соглашения по коду

${bullets(e.conventions)}

- Имена — на английском, комментарии — на русском.
- Никаких закомментированных блоков «на память».
- Публичные функции снабжать кратким контрактом (вход/выход/побочные эффекты).

## 12. Известные подводные камни движка

${bullets(e.gotchas?.length ? e.gotchas : ['—'])}

## 13. Риски

${table(['Риск', 'Оценка', 'Митигация'], [
  ['Агент выдумает несуществующее API движка', 'Высокий', 'Запрет на галлюцинации в AGENT_PROMPT + требование проверять существование метода перед использованием'],
  ['Разрастание объёма задачи', 'Высокий', 'Scope Guard в GDD §10 + атомарные итерации в TASK_*.md'],
  ['Связный код, сложно менять', 'Средний', 'Шина событий, никаких прямых вызовов между подсистемами'],
  ['Отсутствие ассетов', 'Средний', 'Плейсхолдеры, генерируемые кодом'],
])}

---
_Сгенерировано PRMPT • \`${pkg}\` • schema v${cfg.schema}_
`;
}

/* ─────────────────────────── AGENT PROMPT ─────────────────────────── */

export function generateAgentPrompt(cfg) {
  const e = engineOf(cfg);
  const pats = patternTitles(cfg.tech.patterns).map((x) => x.label);
  const sys = enabledSystems(cfg);
  const genre = label(GENRES, cfg.meta.genre);

  return `# AGENT_PROMPT.md — вводный промпт для ИИ-агента

> Скопируйте содержимое целиком и вставьте первым сообщением в ${agentLabel(cfg)}.
> Файлы \`docs/GDD.md\` и \`docs/TECH_SPEC.md\` должны лежать в корне проекта **до** первого запуска.

---

## РОЛЬ

Ты — **${clean(cfg.prompt.role) || 'Senior Game Developer'}**. Ты работаешь над проектом «${cfg.meta.projectName}» (${genre}).
${clean(cfg.prompt.experience) || 'Уровень Senior: код должен быть чистым, типизированным и сопровождаемым.'}

Ты не дизайнер-мечтатель, а инженер: сначала запускаемый скелет, потом фичи, потом полировка. Красота кода важна ровно настолько, насколько она ускоряет следующую итерацию.

## КОНТЕКСТ ПРОЕКТА

Перед любым действием прочитай и считай источником правды:

1. \`docs/GDD.md\` — что за игра, механики, сущности, условия победы/поражения.
2. \`docs/TECH_SPEC.md\` — стек, архитектура, структура папок, соглашения.
3. \`TASK_1_SCAFFOLD.md\` — твоя **первая** задача. Начинаешь именно с неё.

Если документы противоречат друг другу — сообщи об этом и запроси решение, не выбирай молча.

## СТЕК (НЕ МЕНЯТЬ)

- Движок: **${e.label}** (${e.version})
- Язык: **${e.language}**
- Пакетный менеджер: ${e.pkgManager}
- Тесты: ${e.testFramework}
- Запуск: \`${e.runCmd}\`

## АРХИТЕКТУРА (ОБЯЗАТЕЛЬНА)

${bullets(pats.length ? pats : ['FSM для состояний сущностей', 'Шина событий для связи систем', 'Fixed-timestep игровой цикл'])}

Структура папок — строго из \`docs/TECH_SPEC.md\` §3. Новые файлы вне неё не создавать.

## ОБЯЗАТЕЛЬНЫЕ СИСТЕМЫ

${sys.length ? bullets(sys.map((s) => `${s.label} — ${s.detail}`)) : bullets(['Игровой цикл', 'Управление', 'Счёт'])} 

Все числовые значения баланса — в конфиг-файле. Магических чисел в логике нет.

## ОГРАНИЧЕНИЯ

${numbered(cfg.prompt.constraints)}

${cfg.prompt.iterationSize ? `**Размер шага:** ${clean(cfg.prompt.iterationSize)}.` : ''}
**Разрешено менять по умолчанию:** файлы, созданные в текущей итерации. Всё остальное — только с явного подтверждения.

## ЗАПРЕЩЕНО

${numbered(cfg.prompt.forbidden)}

${cfg.prompt.askQuestions
      ? `## КОГДА ЗАДАВАТЬ ВОПРОСЫ

Задай **один** вопрос и остановись, если:
- требование в задаче допускает два взаимоисключающих прочтения;
- нужного API нет в документации движка;
- постановка требует трогать файлы вне разрешённого списка;
- обнаружено расхождение между GDD и TECH_SPEC.

В остальных случаях принимай разумное инженерное решение и **помечай** его в отчёте как «Решение по умолчанию».`
      : `## САМОСТОЯТЕЛЬНОСТЬ

Вопросы не задавать: принимать разумное инженерное решение и фиксировать его в отчёте как «Решение по умолчанию».`}

## ПОШАГОВАЯ СТРАТЕГИЯ РАБОТЫ

${numbered(cfg.prompt.strategy)}

**Правило атомарности:** одна итерация = одна проверяемая фича. Проект после каждой итерации обязан запускаться. Сломанный проект в конце итерации — это провал, а не «промежуточное состояние».

## КРИТЕРИИ ПРИЁМКИ (Definition of Done)

Итерация не считается выполненной, пока **все** пункты не подтверждены:

${cfg.prompt.dod.map((x) => `- [ ] ${clean(x)}`).join('\n')}

## ФОРМАТ ОТЧЁТА ПОСЛЕ КАЖДОЙ ИТЕРАЦИИ

${fence('markdown', reportSnippet(cfg))}

Отчёт должен быть честным: если что-то не реализовано или не проверено — писать прямо, а не приукрашивать.

## НАЧАЛО РАБОТЫ

1. Прочитай \`docs/GDD.md\`, \`docs/TECH_SPEC.md\`, \`TASK_1_SCAFFOLD.md\`.
2. Выполни \`TASK_1_SCAFFOLD.md\` целиком (и только её).
3. Отчитайся по формату выше и остановись. Следующую задачу возьмёшь из ответа пользователя.

${cfg.prompt.includeRoadmap ? '> Очередность следующих итераций — в `docs/PROMPT_ROADMAP.md`.' : ''}

---
_Сгенерировано PRMPT • freejam.online/prmpt • schema v${cfg.schema}_
`;
}

/* ─────────────────────────── TASK 1 ─────────────────────────── */

export function generateTask1(cfg) {
  const e = engineOf(cfg);
  const task1 = {
    godot: {
      files: [
        'project.godot',
        'scenes/Main.tscn',
        'scripts/game.gd',
        'scripts/player.gd',
        'autoload/event_bus.gd',
        'autoload/game_state.gd'
      ],
      steps: [
        'Создать `project.godot` с настройками: главная сцена `scenes/Main.tscn`, разрешение viewport по TECH_SPEC §8, автозагрузка `autoload/event_bus.gd` и `autoload/game_state.gd`.',
        '`autoload/event_bus.gd`: синглтон `EventBus` с сигналом `player_damaged(amount: int)`. Реализация — через `signal`.',
        '`autoload/game_state.gd`: поля `hp`, `score`, `is_game_over`; метод `reset()`.',
        '`scenes/Main.tscn`: корневой `Node2D` + экземпляр игрока + `CanvasLayer` для UI-заглушки (Label с HP).',
        '`scripts/player.gd`: движение по вводу (`Input.get_axis`), реальные клавиши из GDD §4, ограничение по границам экрана.',
        '`scripts/game.gd`: обработка `ui_cancel` (Esc) — переключение `get_tree().paused`.'
      ],
      verify: [
        '`godot --path . --editor` открывает проект без ошибок в отладчике.',
        'F5 запускает Main.tscn: игрок двигается по клавишам из GDD.',
        'Esc ставит и снимает паузу (проверить по отладочному выводу).'
      ]
    },
    unity: {
      files: [
        'Assets/Scenes/Main.unity',
        'Assets/Scripts/Core/GameBootstrap.cs',
        'Assets/Scripts/Core/EventBus.cs',
        'Assets/Scripts/Core/GameState.cs',
        'Assets/Scripts/Player/PlayerController.cs'
      ],
      steps: [
        'Создать сцену `Assets/Scenes/Main.unity` с камерой (ортографическая) и пустым `GameBootstrap`.',
        '`EventBus.cs`: статический класс-синглтон с событием `PlayerDamaged(int amount)`.',
        '`GameState.cs`: сервис с `HP`, `Score`, `IsGameOver`, метод `Reset()`.',
        '`PlayerController.cs`: чтение ввода (новая Input System или `Input.GetAxisRaw`), перемещение в `Update`, ограничение по границам камеры.',
        '`GameBootstrap.cs`: инициализация сервисов в `Awake`, создание игрока, подключение паузы по Escape.'
      ],
      verify: [
        'Проект открывается без ошибок компиляции (Console чистая).',
        'Press Play: объект игрока двигается по клавишам из GDD §4.',
        'Escape ставит `Time.timeScale = 0` и возвращает обратно.'
      ]
    },
    phaser: {
      files: [
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
        'index.html',
        'src/main.ts',
        'src/config/balance.ts',
        'src/types/index.ts',
        'src/scenes/BootScene.ts',
        'src/scenes/GameScene.ts',
        'src/entities/Player.ts'
      ],
      steps: [
        '`package.json`: зависимости `phaser` (версия из TECH_SPEC §1) и dev-зависимости `vite`, `typescript`, `vitest`; скрипты `dev`, `build`, `test`.',
        '`tsconfig.json` со `strict: true`. `vite.config.ts` — базовый статический сервер.',
        '`index.html`: контейнер `#game`, подключение `src/main.ts`.',
        '`src/main.ts`: конфиг `Phaser.Game` (ширина/высота из TECH_SPEC §8, `parent: "game"`, физика arcade) со списком сцен.',
        '`src/config/balance.ts`: все числа (скорость игрока, размеры, HP) — экспортируемые константы.',
        '`src/types/index.ts`: интерфейс `GameStateData { hp, score, isGameOver }`.',
        '`src/scenes/BootScene.ts`: мгновенный переход в GameScene (ассеты не грузим — плейсхолдеры рисуем кодом).',
        '`src/entities/Player.ts`: класс с `update(dt)`; движение по стрелкам/WASD через `scene.input.keyboard`, удержание в границах мира.',
        '`src/scenes/GameScene.ts`: создание игрока, чтение `balance`, клавиша Escape — пауза сцены.'
      ],
      verify: [
        '`npm install && npm run dev` — сервер стартует без ошибок.',
        'Страница открывается, есть белый/цветной прямоугольник — игрок.',
        'Игрок двигается стрелками/WASD, не выходит за границы канваса, Escape ставит паузу.',
        '`npm run build` собирается без ошибок TypeScript.'
      ]
    },
    three: {
      files: [
        'package.json', 'tsconfig.json', 'vite.config.ts', 'index.html',
        'src/main.ts', 'src/core/Game.ts', 'src/core/InputManager.ts', 'src/config/balance.ts'
      ],
      steps: [
        'Настроить Vite + TypeScript проект (strict), зависимости `three`.',
        '`src/main.ts`: создать канвас, инстанцировать `Game`.',
        '`src/core/Game.ts`: сцена, перспективная камера, `WebGLRenderer`, `THREE.Clock`, единственный `requestAnimationFrame`-цикл с `update(dt)`.',
        '`src/core/InputManager.ts`: подписка на keydown/keyup, карта действий из GDD §4.',
        'Плейсхолдер игрока — `THREE.Mesh` с `BoxGeometry` и `MeshBasicMaterial`; движение в плоскости, зажатие в границах.'
      ],
      verify: [
        '`npm run dev` — сцена рендерится, в консоли нет ошибок.',
        'Куб двигается по клавишам, кадр ограничен.',
        'FPS-счётчик в консоли/оверлее держит 60.'
      ]
    },
    pygame: {
      files: [
        'requirements.txt',
        'main.py',
        'src/config.py',
        'src/game.py',
        'src/scenes/scene_play.py',
        'src/entities/player.py'
      ],
      steps: [
        '`requirements.txt`: `pygame>=2.5`, `pytest` (как dev-зависимость).',
        '`src/config.py`: WIDTH, HEIGHT, FPS, PLAYER_SPEED, цвета — все константы.',
        '`main.py`: `pygame.init()`, создание окна из config, запуск `Game().run()`, корректный `pygame.quit()`.',
        '`src/game.py`: фиксированный цикл с `clock.tick(FPS)`, обработка `QUIT`, делегирование активной сцене.',
        '`src/entities/player.py`: `pygame.sprite.Sprite`, `update(dt)` с `dt` в секундах; движение по клавишам из GDD §4, ограничение по экрану.',
        '`src/scenes/scene_play.py`: `handle_events/update/draw`, отрисовка игрока как `pygame.Surface`-плейсхолдер.'
      ],
      verify: [
        '`python main.py` открывает окно без traceback.',
        'Игрок двигается стрелками/WASD, не выходит за границы окна.',
        'Замер: счётчик FPS в заголовке окна держит 60.',
        '`pytest -q` не падает (тестов может быть 0, но команда должна работать).'
      ]
    },
    custom: {
      files: ['описать по структуре из TECH_SPEC §3'],
      steps: ['Создать скелет проекта по структуре из TECH_SPEC §3.', 'Реализовать игровой цикл и управление игроком.', 'Добавить заглушку UI с HP.'],
      verify: ['Проект запускается одной командой.', 'Игрок реагирует на ввод из GDD §4.']
    }
  }[e.id];

  return `# TASK_1_SCAFFOLD — итерация 1: скелет проекта и управление игроком

> Это **первая и единственная** задача для агента на текущий шаг.
> Не начинай следующие фичи, пока эта не будет проверена запуском.

## Цель итерации

Получить **запускаемый** проект «${cfg.meta.projectName}»: окно/канвас открывается, игрок существует как объект, реагирует на управление из GDD §4 и не выходит за границы игрового поля. Никакой боевой механики, врагов и очков в этой итерации **нет**.

## Файлы к созданию

${fence('text', task1.files.join('\n'))}

Файлы вне этого списка создавать **нельзя**. Изменять существующие файлы нельзя, кроме прямо перечисленных выше.

## Пошаговые требования

${numbered(task1.steps)}

## Критерии приёмки

- [ ] Проект запускается командой \`${e.runCmd}\` — без ошибок и предупреждений в консоли.
- [ ] Игровой цикл работает, кадры не «залипают» (визуально 60 FPS).
- [ ] Игрок управляется клавишами: ${clean(cfg.gameplay.player.controls)}
- [ ] Игрок не выходит за границы игрового поля.
- [ ] Все числовые значения взяты из конфиг-файла, магических чисел в логике нет.
- [ ] Нет \`TODO\`, нет функций-заглушек без пометки \`PLACEHOLDER:\`.

## Как проверить (выполнить и приложить вывод)

${numbered(task1.verify)}

## ЗАПРЕЩЕНО в этой итерации

- Добавлять врагов, очки, здоровье, звуки, меню, сохранения.
- Подключать внешние ассеты и библиотеки.
- Рефакторить что-либо за пределами списка файлов.
- Делать «на будущее»: абстракции, интерфейсы под несуществующие фичи.

## Отчёт по завершении

${fence('markdown', reportSnippet(cfg, true))}

---
_Сгенерировано PRMPT • \`${cfg.meta.packageName}\` • schema v${cfg.schema}_
`;
}

/* ─────────────────────────── extras ─────────────────────────── */

export function generateReadme(cfg) {
  const e = engineOf(cfg);
  return `# ${cfg.meta.projectName}

${clean(cfg.meta.pitch)}

- **Жанр:** ${label(GENRES, cfg.meta.genre)} · **Движок:** ${e.label} · **Платформа:** ${label(PLATFORMS, cfg.meta.platform)}
- **Объём:** ${label(SCOPE_LEVELS, cfg.meta.scope)}

## Быстрый старт

${fence('bash', `${e.runCmd}`)}

## Разработка с ИИ-агентом

Целевой агент: **${agentLabel(cfg)}**.

1. Открой проект в агенте — убедись, что он видит папку \`docs/\`.
2. Первым сообщением вставь содержимое \`AGENT_PROMPT.md\`.
3. Выполняй задачи по одной: \`TASK_1_SCAFFOLD.md\`, затем итерации из \`docs/PROMPT_ROADMAP.md\`.
4. После каждой итерации принимай результат по чеклисту «Критерии приёмки».

## Документация

| Файл | Назначение |
|---|---|
| \`docs/GDD.md\` | Что делаем: механики, сущности, условия победы |
| \`docs/TECH_SPEC.md\` | Как делаем: стек, архитектура, соглашения |
| \`AGENT_PROMPT.md\` | Вводный промпт для агента |
| \`TASK_1_SCAFFOLD.md\` | Первая атомарная итерация |
| \`docs/PROMPT_ROADMAP.md\` | Очередность следующих итераций |

---
Проект сгенерирован в **PRMPT** — freejam.online/prmpt
`;
}

export function generateRules(cfg) {
  const e = engineOf(cfg);
  return `# .rules — правила проекта «${cfg.meta.projectName}» для ИИ-агентов (OpenCode / Cursor / Aider)

Движок: ${e.label} (${e.language}). Стек менять запрещено.

## Источник правды
- Дизайн: docs/GDD.md
- Техника: docs/TECH_SPEC.md
- Порядок работ: TASK_1_SCAFFOLD.md, затем docs/PROMPT_ROADMAP.md

## Правила
1. Перед кодом прочитать docs/GDD.md и docs/TECH_SPEC.md.
2. Одна итерация = одна проверяемая фича. Проект после итерации обязан запускаться.
3. Новые файлы — только по структуре из docs/TECH_SPEC.md §3.
4. Все балансовые числа — в конфиг-файле, не в логике.
5. Никаких внешних ассетов и новых зависимостей без разрешения.
6. Не рефакторить код вне рамок текущей задачи.
7. Не выдумывать API: если метода нет в документации движка — сообщить, а не изобретать.
8. Имена — на английском, комментарии — на русском.
9. В конце итерации — отчёт: Что сделано / Файлы / Как проверить / Ограничения / Дальше.

## Ограничения
${bullets(cfg.prompt.constraints)}

## Запрещено
${bullets(cfg.prompt.forbidden)}
`;
}

export function generateRoadmap(cfg) {
  const n = Number(cfg.meta.targetIterations) || 6;
  const base = [
    'Скелет проекта и управление игроком (TASK_1_SCAFFOLD.md)',
    'Игровое поле, границы, камера и фон',
    'Основная кор-механика: ' + (clean(cfg.meta.coreMechanic).slice(0, 90) || '—'),
    cfg.gameplay.enemies?.length ? `Первый враг: ${cfg.gameplay.enemies[0].name}` : 'Первое препятствие',
    'Система очков и множитель',
    'Здоровье/урон и состояние Game Over',
    'Подбираемые предметы и бонусы',
    'UI: HUD, экран проигрыша, пауза',
    'Звук и звуковые события',
    'Сохранение рекорда',
    'Полировка: эффекты, тряска камеры, fade-переходы',
    'Балансировка по замерам'
  ];
  const list = base.slice(0, Math.max(3, Math.min(n + 1, base.length)));
  return `# PROMPT_ROADMAP — порядок итераций для ИИ-агента

Выполнять **по одной** итерации. После каждой — отчёт и остановка до подтверждения пользователя.
Не перескакивать: каждая итерация опирается на запускаемое состояние предыдущей.

${table(['#', 'Итерация', 'Результат (проверяемый)'], list.map((x, i) => [i + 1, x, `Проект запускается, ${x.toLowerCase()} работает`]))}

## Шаблон постановки задачи для агента (для итераций 2+)

${fence('markdown', `## TASK_N — <название фичи>

**Цель:** <одно предложение, что должно работать после этой итерации>

**Файлы, разрешённые к созданию/изменению:**
- путь/файл
- путь/файл

**Требования:**
1. ...
2. ...

**Критерии приёмки:**
- [ ] ...
- [ ] ...

**Команда проверки:** \`${engineOf(cfg).runCmd}\`

**Запрещено:** <что не делать в этой итерации>

**Отчёт:** по формату из AGENT_PROMPT.md`)}

---
_Сгенерировано PRMPT • schema v${cfg.schema}_
`;
}

/* ─────────────────────────── snippets ─────────────────────────── */

function loopSnippet(cfg) {
  const e = engineOf(cfg);
  if (e.id === 'pygame') {
    return `FPS = 60           # из src/config.py
dt_target = 1.0 / FPS

running = True
while running:
    dt = clock.tick(FPS) / 1000.0
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        else:
            scene.handle_events(event)

    if not paused:
        scene.update(dt)      # логика не зависит от FPS
    scene.draw(screen)
    pygame.display.flip()`;
  }
  if (e.id === 'godot') {
    return `# scripts/game.gd (фрагмент)
extends Node2D

@export var max_delta: float = 0.05

func _process(delta: float) -> void:
    var dt := minf(delta, max_delta)   # защита от «скачка» после паузы
    if GameState.is_paused:
        return
    _update_systems(dt)

func _update_systems(dt: float) -> void:
    for node in get_tree().get_nodes_in_group("tickable"):
        node.tick(dt)`;
  }
  return `// Фиксированный шаг логики, переменный шаг рендера
const STEP = 1 / 60;
let acc = 0;

function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1); // защита от скачка
  last = now;
  if (paused || isGameOver) { render(); return; }

  acc += dt;
  while (acc >= STEP) { update(STEP); acc -= STEP; } // детерминированная логика
  render();
}`;
}

function balanceSnippet(e) {
  if (e.id === 'pygame') {
    return `# src/config.py — единственный источник числового баланса
WIDTH, HEIGHT = 960, 540
FPS = 60
PLAYER_SPEED = 220      # px/sec
PLAYER_HP = 3
SCORE_PER_PICKUP = 10
MULTIPLIER_MAX = 5`;
  }
  if (e.id === 'godot') {
    return `# scripts/config.gd (autoload Config)
extends Node

const PLAYER_SPEED := 220.0
const PLAYER_HP := 3
const SCORE_PER_PICKUP := 10
const MULTIPLIER_MAX := 5`;
  }
  if (e.id === 'unity') {
    return `// Assets/Scripts/Config/Balance.cs
public static class Balance {
    public const float PlayerSpeed = 6f;
    public const int PlayerHp      = 3;
    public const int ScorePerChip  = 10;
    public const int MultiplierMax = 5;
}`;
  }
  return `// src/config/balance.ts — единственный источник числового баланса
export const BALANCE = {
  playerSpeed: 220,      // px/sec
  playerHp: 3,
  scorePerPickup: 10,
  multiplierMax: 5,
} as const;`;
}

function reportSnippet(cfg, task1 = false) {
  return `## Отчёт об итерации${task1 ? ' 1' : ' N'}

**Что сделано:**
- ...

**Созданные/изменённые файлы:**
- \`путь/файл\` — назначение

**Как проверить:**
1. \`${engineOf(cfg).runCmd}\`
2. <шаги>

**Вывод проверки (фактический):**
\`\`\`text
<вставить реальный вывод консоли — не пересказ>
\`\`\`

**Известные ограничения / что не сделано:**
- ...

**Решение по умолчанию (если принимал):**
- ...

**Следующий шаг (не выполнять без подтверждения):**
- ...`;
}

/* ─────────────────────────── public API ─────────────────────────── */

export function generateFiles(rawCfg, opts = {}) {
  const cfg = normalizeConfig(rawCfg);
  const files = {
    'README.md': generateReadme(cfg),
    'AGENT_PROMPT.md': generateAgentPrompt(cfg),
    'TASK_1_SCAFFOLD.md': generateTask1(cfg),
    '.rules': generateRules(cfg),
    'docs/GDD.md': generateGDD(cfg),
    'docs/TECH_SPEC.md': generateTechSpec(cfg),
    'docs/PROMPT_ROADMAP.md': generateRoadmap(cfg)
  };
  if (opts.withConfig !== false) {
    files['prmpt.config.json'] = JSON.stringify({ ...cfg, generator: 'PRMPT 1.0' }, null, 2) + '\n';
  }
  return files;
}

export function generateSingle(rawCfg, path) {
  const files = generateFiles(rawCfg, { withConfig: false });
  if (!(path in files)) throw new Error(`Unknown file: ${path}`);
  return files[path];
}

export const FILE_CATALOG = [
  { path: 'docs/GDD.md', title: 'GDD.md', hint: 'Game Design Document', primary: true, icon: 'book' },
  { path: 'docs/TECH_SPEC.md', title: 'TECH_SPEC.md', hint: 'Архитектурное ТЗ', primary: true, icon: 'cpu' },
  { path: 'AGENT_PROMPT.md', title: 'AGENT_PROMPT.md', hint: 'Вводный промпт для агента', primary: true, icon: 'terminal' },
  { path: 'TASK_1_SCAFFOLD.md', title: 'TASK_1_SCAFFOLD.md', hint: 'Первая итерация', primary: true, icon: 'list-checks' },
  { path: 'README.md', title: 'README.md', hint: 'Описание репозитория', icon: 'file-text' },
  { path: '.rules', title: '.rules', hint: 'Правила для OpenCode/Cursor/Aider', icon: 'shield' },
  { path: 'docs/PROMPT_ROADMAP.md', title: 'PROMPT_ROADMAP.md', hint: 'План итераций', icon: 'map' }
];
