/**
 * PRMPT — встроенные шаблоны проектов (пресеты).
 * Полные конфигурации: выбрал шаблон → получил осмысленный набор документов сразу.
 */
import { defaultConfig } from './schema.js';

function base() {
  return defaultConfig();
}

function merge(baseObj, patch) {
  const out = structuredClone(baseObj);
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = merge(out[k] ?? {}, v);
    else out[k] = v;
  }
  return out;
}

/* ── 1. 2D Platformer ─────────────────────────────── */
const platformer = merge(base(), {
  meta: {
    projectName: 'Prism Leap',
    packageName: 'prism_leap',
    genre: 'platformer',
    engine: 'godot',
    platform: 'web-desktop',
    artStyle: 'Векторная / flat-графика',
    references: 'Super Meat Boy, Celeste, Hollow Knight',
    pitch: 'Платформер о прыжках между призмами: каждый прыжок заряжается и меняет цвет платформы, открывая путь.',
    coreMechanic: 'Прыжок с зарядкой: чем дольше удерживаешь кнопку, тем выше прыжок; приземление на призму своего цвета даёт ускорение, чужого — отбрасывает.',
    scope: 'mvp',
    targetIterations: 8
  },
  gameplay: {
    player: {
      name: 'Лис',
      controls: 'A/D — движение, Space (удержание) — прыжок с зарядкой, S — быстрый спуск, Shift — рывок (1 заряд до приземления)',
      abilities: ['Прыжок с зарядкой', 'Рывок в воздухе', 'Wall-slide'],
      hp: 3,
      speed: 5
    },
    coreLoop: [
      'Войти на уровень, оценить расположение призм',
      'Перемещаться и заряжать прыжки под платформы',
      'Приземляться на призмы своего цвета для ускорения',
      'Избегать шипов и патрулирующих врагов',
      'Дойти до флага, получить оценку по времени и собранным осколкам'
    ],
    enemies: [
      { name: 'Слизень-патруль', behavior: 'Ходит между двумя точками, разворачивается на краю', hp: 1, damage: 1, notes: 'Убивается прыжком сверху' },
      { name: 'Летун', behavior: 'Синусоидальный полёт по горизонтали', hp: 1, damage: 1, notes: 'Неуязвим сверху, только рывок' }
    ],
    obstacles: [
      { name: 'Шипы', behavior: 'Статичные, мгновенный урон', value: 1 },
      { name: 'Движущаяся пила', behavior: 'Циклично ездит по рельсу', value: 1 },
      { name: 'Обрушающаяся платформа', behavior: 'Исчезает через 0.5 с после касания', value: 0 }
    ],
    pickups: [
      { name: 'Осколок призмы', effect: 'Очки + счётчик уровня', value: 50 },
      { name: 'Кристалл здоровья', effect: '+1 HP (редкий)', value: 0 }
    ],
    systems: { score: true, health: true, lives: true, timer: true, combos: false, powerups: true, save: true, levels: true, audio: true, settings: true, achievements: true, leaderboard: false },
    difficulty: 'Плавная кривая: уровни 1–3 обучают прыжку и рывку, 4–5 добавляют движущиеся препятствия, 6 — комбинации.',
    progression: 'Последовательные уровни с разблокировкой; оценка S/A/B по времени и осколкам',
    levels: [
      { name: 'Уровень 1 — Обучение', goal: 'Пройти уровень, собрать 3 осколка, ни разу не умереть' },
      { name: 'Уровень 2 — Рывок', goal: 'Пройти, используя рывок минимум 4 раза' },
      { name: 'Уровень 3 — Пилы', goal: 'Пройти без получения урона' }
    ],
    winCondition: 'Дойти до флага в конце уровня',
    loseCondition: 'HP = 0 или падение в пропасть; жизни кончились → экран рестарта уровня'
  },
  tech: {
    patterns: ['fsm', 'event-driven', 'command', 'state-machine-scene', 'object-pool'],
    stateMode: 'singleton-services',
    saveFormat: 'JSON в user://save.json (Godot)',
    perfTarget: '60 FPS, физика — в _physics_process, без аллокаций в кадре',
    resolution: '480x270 viewport, масштаб на весь экран (pixel-perfect)',
    testing: 'GUT: тесты на логику зарядки прыжка, урона и подсчёта осколков'
  },
  prompt: {
    role: 'Godot 4 Gameplay Engineer',
    constraints: [
      'Не менять стек и версии зависимостей без явного разрешения',
      'Не добавлять плагины и аддоны без обоснования',
      'Не рефакторить существующий код вне рамок текущей задачи',
      'Строгая типизация GDScript (аннотации типов обязательны)',
      'Сцены собирать в редакторе, скрипты держать тонкими'
    ],
    forbidden: [
      'Придумывать несуществующие API движка (галлюцинации)',
      'Писать «примерный» код с многоточиями вместо реализации',
      'Оставлять нереализованные функции-заглушки без пометки',
      'Молча расширять объём задачи за пределы постановки',
      'Использовать get_node с длинными относительными путями между сценами'
    ],
    dod: [
      'Проект запускается в редакторе без ошибок в отладчике',
      'Все шаги проверки воспроизведены агентом и описаны в отчёте',
      'Числовой баланс вынесен в resources/ и @export, а не размазан по коду',
      'Юнит-тесты GUT на логику прыжка и урона проходят',
      'Нет // TODO и заглушек без пометки PLACEHOLDER:'
    ],
    iterationSize: 'Одна атомарная фича за итерацию'
  }
});

/* ── 2. Top-Down Arena ────────────────────────────── */
const arena = merge(base(), {
  meta: {
    projectName: 'Void Arena',
    packageName: 'void_arena',
    genre: 'topdown-arena',
    engine: 'phaser',
    platform: 'web-desktop',
    artStyle: 'Минимализм, монохром + акцент',
    references: 'Vampire Survivors, Brotato, Crimsonland',
    pitch: 'Волновая арена: игрок выживает в замкнутом пространстве, враги растут волнами, между волнами выбираются апгрейды.',
    coreMechanic: 'Автоатака по ближайшему врагу + ручное позиционирование: победа зависит от движения и сборки билда, а не от точности кликов.',
    scope: 'vertical-slice',
    targetIterations: 10
  },
  gameplay: {
    player: {
      name: 'Оператор',
      controls: 'WASD/стрелки — движение, Space — рывок, 1/2/3 — выбор апгрейда между волнами, Esc — пауза',
      abilities: ['Рывок (кулдаун 2 с, i-frames 0.3 с)', 'Автоатака по ближайшей цели', 'Импульс отталкивания'],
      hp: 100,
      speed: 4
    },
    coreLoop: [
      'Волна: враги появляются по краям и сходятся к центру',
      'Игрок движется, автоатака бьёт по ближайшему врагу',
      'Убитые враги роняют опыт',
      'Опыт заполняет шкалу — уровень, выбор одного из трёх апгрейдов',
      'Выжить до конца волны, затем следующая сложнее'
    ],
    enemies: [
      { name: 'Бегун', behavior: 'Прямолинейно движется к игроку', hp: 10, damage: 5, notes: 'Быстрый, слабый' },
      { name: 'Танк', behavior: 'Медленно идёт, наносит контактный урон', hp: 60, damage: 15, notes: 'Много HP' },
      { name: 'Стрелок', behavior: 'Держит дистанцию, стреляет одиночными снарядами', hp: 20, damage: 8, notes: 'Снаряды летят по прямой' },
      { name: 'Сплиттер', behavior: 'При смерти делится на двух мелких', hp: 30, damage: 5, notes: 'Проверка пула объектов' }
    ],
    obstacles: [
      { name: 'Колонна', behavior: 'Блокирует движение, урон при зажатии', value: 0 }
    ],
    pickups: [
      { name: 'Опыт-сфера', effect: 'Прогресс уровня', value: 1 },
      { name: 'Аптечка', effect: '+20 HP', value: 20 },
      { name: 'Ящик', effect: 'Случайный апгрейд', value: 0 }
    ],
    systems: { score: true, health: true, lives: false, timer: true, combos: true, powerups: true, save: true, levels: false, audio: true, settings: true, achievements: true, leaderboard: true },
    difficulty: 'Плотность волны растёт линейно, HP врагов — по формуле волна × 1.15. Каждые 5 волн — «элита».',
    progression: 'Wave-based, между волнами — выбор апгрейда из трёх случайных',
    levels: [{ name: 'Арена «Пустота»', goal: 'Выжить как можно больше волн' }],
    winCondition: 'Нет финальной победы; достижение 20-й волны = победа среза',
    loseCondition: 'HP игрока ≤ 0'
  },
  tech: {
    patterns: ['ecs', 'object-pool', 'event-driven', 'fsm', 'observer', 'game-loop-fixed'],
    stateMode: 'store',
    saveFormat: 'JSON в localStorage (рекорд волны, открытые апгрейды)',
    perfTarget: '60 FPS при 300+ активных снарядах — обязателен пул объектов',
    resolution: '1280x720, масштабирование по контейнеру',
    testing: 'Vitest: пул объектов, расчёт урона, выбор апгрейдов, формула волны'
  },
  prompt: {
    role: 'Senior Frontend Game Developer (TypeScript)',
    constraints: [
      'Строгая типизация (strict TypeScript), без any',
      'Не добавлять новые внешние библиотеки без обоснования',
      'Никаких ассетов из интернета: только плейсхолдеры, которые агент генерирует сам',
      'Не менять стек и версии зависимостей без явного разрешения',
      'Запрещено создавать объекты в игровом цикле — только пул'
    ],
    forbidden: [
      'Придумывать несуществующие API Phaser (галлюцинации)',
      'Писать «примерный» код с многоточиями вместо реализации',
      'Оставлять нереализованные функции-заглушки без пометки',
      'Молча расширять объём задачи за пределы постановки',
      'Считать урон или движение во втором месте (двойная логика)'
    ],
    dod: [
      'npm run dev стартует, npm run build собирается без ошибок TypeScript',
      'Все шаги проверки воспроизведены агентом и описаны в отчёте',
      'Vitest-тесты на пул, урон и волны проходят',
      'Игра держит 60 FPS при 200+ активных снарядах (замер через performance overlay)',
      'Числовой баланс вынесен в src/config/balance.ts'
    ]
  }
});

/* ── 3. Endless Runner (дефолт) ───────────────────── */
const runner = merge(base(), {
  meta: { projectName: 'Neon Runner', packageName: 'neon_runner', genre: 'endless-runner', engine: 'phaser' },
  prompt: { role: 'Senior Frontend Game Developer (TypeScript)' }
});

/* ── 4. Grid Puzzle ───────────────────────────────── */
const puzzle = merge(base(), {
  meta: {
    projectName: 'Hexshift',
    packageName: 'hexshift',
    genre: 'grid-puzzle',
    engine: 'pygame',
    platform: 'windows',
    artStyle: 'Минимализм, монохром + акцент',
    references: 'Threes!, 2048, Hexcells, Sokoban',
    pitch: 'Пошаговая головоломка на сетке: сдвиг строк меняет узор, цель — собрать линии одного цвета до нуля ходов.',
    coreMechanic: 'Сдвиг строки/столбца сдвигает все плитки и заполняет пустоты из «магазина»; совпадение трёх и более плиток одного цвета их уничтожает.',
    scope: 'mvp',
    targetIterations: 7
  },
  gameplay: {
    player: {
      name: 'Курсор',
      controls: 'Стрелки — выбор строки/столбца и направления сдвига, Enter — подтвердить сдвиг, U — отменить ход, Esc — меню',
      abilities: ['Отмена хода (Undo)', 'Подсказка (1 раз за уровень)'],
      hp: 0,
      speed: 0
    },
    coreLoop: [
      'Уровень стартует с заданным узором и лимитом ходов',
      'Игрок выбирает строку/столбец и направление сдвига',
      'Плитки смещаются, появившиеся линии 3+ исчезают, очки растут',
      'Ходы расходуются; цель уровня — очистить заданные ячейки',
      'Уровень пройден → следующий, сложнее'
    ],
    enemies: [],
    obstacles: [
      { name: 'Заблокированная плитка', behavior: 'Не двигается сдвигом, требует сдвига соседей', value: 0 },
      { name: 'Плитка-таймер', behavior: 'Обратный отсчёт: исчезает через N ходов', value: 3 }
    ],
    pickups: [
      { name: 'Бонусный ход', effect: '+3 хода', value: 3 }
    ],
    systems: { score: true, health: false, lives: false, timer: false, combos: true, powerups: false, save: true, levels: true, audio: false, settings: true, achievements: true, leaderboard: false },
    difficulty: 'Рост числа цветов и заблокированных плиток; лимит ходов снижается относительно оптимума (оптимум + 2 на уровнях 1–5, +0 далее).',
    progression: 'Линейные уровни из JSON-файла данных, разблокировка последовательная',
    levels: [
      { name: 'Уровень 1 — Две линии', goal: 'Собрать две линии за 6 ходов' },
      { name: 'Уровень 2 — Блоки', goal: 'Собрать узор с заблокированными плитками за 8 ходов' },
      { name: 'Уровень 3 — Таймеры', goal: 'Успеть до исчезновения таймерных плиток' }
    ],
    winCondition: 'Целевые ячейки уровня очищены (все условия уровня выполнены)',
    loseCondition: 'Ходы кончились, а цель не достигнута'
  },
  tech: {
    patterns: ['fsm', 'event-driven', 'service', 'observer'],
    stateMode: 'local',
    dataDriven: true,
    saveFormat: 'JSON-файл в %APPDATA%/hexshift/save.json',
    perfTarget: '60 FPS не критично (пошаговая), но отклик на ввод — мгновенный',
    resolution: '800x800, окно фиксированного размера',
    testing: 'pytest: сдвиг строки, поиск линий 3+, расход ходов, победа/поражение, undo'
  },
  prompt: {
    role: 'Senior Python Game Developer',
    constraints: [
      'PEP8, type hints обязательны',
      'Не менять стек и версии зависимостей без явного разрешения',
      'Не добавлять новые внешние библиотеки без обоснования',
      'Вся логика сдвигов и поиска линий — в чистом Python без pygame, чтобы тестировалась',
      'Все константы — в src/config.py'
    ],
    forbidden: [
      'Придумывать несуществующие API pygame (галлюцинации)',
      'Писать «примерный» код с многоточиями вместо реализации',
      'Оставлять нереализованные функции-заглушки без пометки',
      'Смешивать логику и рендер в одном классе',
      'Генерировать ассеты кодом во время тестов'
    ],
    dod: [
      'python main.py открывает окно без traceback',
      'pytest -q проходит зелёным',
      'Логика сдвигов покрыта тестами и не импортирует pygame',
      'Все шаги проверки воспроизведены агентом и описаны в отчёте',
      'Уровни загружаются из JSON-файла, а не захардкожены'
    ]
  }
});

export const TEMPLATES = [
  { id: 'platformer', title: '2D Platformer', engine: 'Godot 4', description: 'Заряжаемый прыжок, уровни, шипы, патрулирующие враги, оценка по времени.', config: platformer },
  { id: 'arena', title: 'Top-Down Arena', engine: 'Phaser 3', description: 'Волны врагов, автоатака, апгрейды между волнами, пул объектов.', config: arena },
  { id: 'runner', title: 'Endless Runner', engine: 'Phaser 3', description: 'Раннер с растущей скоростью, множителем очков и рекордом.', config: runner },
  { id: 'puzzle', title: 'Grid Puzzle', engine: 'Pygame', description: 'Пошаговая головоломка на сетке: сдвиги, линии, отмена хода.', config: puzzle }
];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id)?.config ?? null;
}
