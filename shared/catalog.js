/**
 * PRMPT — каталог движков, жанров, паттернов и игровых систем.
 * Чистый ESM без зависимостей: используется и фронтендом (Vite), и бэкендом (Node).
 */

export const ENGINES = {
  godot: {
    id: 'godot',
    label: 'Godot 4.x',
    language: 'GDScript',
    version: '4.3+',
    entry: 'project.godot',
    entryScene: 'scenes/Main.tscn',
    ext: '.gd',
    runCmd: 'godot --path . --editor',
    testCmd: 'godot --headless -s addons/gut/gut_cmdln.gd',
    testFramework: 'GUT (Godot Unit Test)',
    pkgManager: 'встроенный (без менеджера пакетов)',
    folders: [
      'scenes/            # .tscn сцены (Main, Level, UI)',
      'scripts/           # .gd скрипты (player, enemy, systems)',
      'scripts/systems/   # сервисы: score, health, save',
      'autoload/          # синглтоны (EventBus, GameState)',
      'assets/sprites/    # PNG/SVG спрайты и тайлсеты',
      'assets/audio/      # .ogg/.wav звуки и музыка',
      'assets/fonts/      # шрифты',
      'resources/         # .tres конфиги данных (враги, уровни)',
      'addons/            # плагины (gut для тестов)'
    ],
    conventions: [
      'snake_case для файлов и переменных, PascalCase для классов (class_name)',
      'Коммуникация через сигналы, а не прямые вызовы между узлами',
      'Сцены собирать в редакторе, скрипты держать тонкими'
    ],
    gotchas: [
      'Не забывать про `@onready` и порядок _ready()',
      'Не тянуть узлы через get_node("../../") — использовать @export или сигналы'
    ]
  },
  unity: {
    id: 'unity',
    label: 'Unity 6',
    language: 'C#',
    version: '6000.0 LTS+',
    entry: 'Assets/Scenes/Main.unity',
    entryScene: 'Assets/Scenes/Main.unity',
    ext: '.cs',
    runCmd: 'Открыть проект в Unity Hub → Press Play',
    testCmd: 'Unity Test Runner (EditMode + PlayMode)',
    testFramework: 'Unity Test Framework (NUnit)',
    pkgManager: 'Unity Package Manager / UPM',
    folders: [
      'Assets/Scenes/      # Main.unity, Level_01.unity',
      'Assets/Scripts/     # Player/, Enemies/, Systems/, UI/',
      'Assets/Prefabs/     # префабы сущностей',
      'Assets/Sprites/     # спрайты 2D',
      'Assets/Audio/       # AudioClip',
      'Assets/Resources/   # ScriptableObject конфиги',
      'ProjectSettings/    # настройки проекта (Input, Physics, Tags)',
      'Packages/           # manifest.json'
    ],
    conventions: [
      'PascalCase для классов, camelCase для полей, _camelCase для приватных сериализуемых',
      'Данные в ScriptableObject, логика в MonoBehaviours',
      'Запрещено FindObjectOfType в Update()'
    ],
    gotchas: [
      'Все ссылки через [SerializeField], не через GameObject.Find',
      'Physics считать в FixedUpdate, ввод — в Update'
    ]
  },
  phaser: {
    id: 'phaser',
    label: 'Phaser 3',
    language: 'TypeScript',
    version: '3.80+',
    entry: 'src/main.ts',
    entryScene: 'src/scenes/BootScene.ts',
    ext: '.ts',
    runCmd: 'npm run dev',
    testCmd: 'npm test  (vitest run)',
    testFramework: 'Vitest',
    pkgManager: 'npm',
    folders: [
      'src/main.ts        # точка входа, конфиг Phaser.Game',
      'src/scenes/        # BootScene, PreloadScene, GameScene, UIScene',
      'src/entities/      # Player, Enemy, Pickup (спрайты/классы)',
      'src/systems/       # ScoreSystem, HealthSystem, SaveSystem',
      'src/config/        # balance.ts (числовые константы)',
      'src/types/         # общие типы и интерфейсы',
      'public/assets/     # спрайты, атласы, аудио, тайлмапы',
      'tests/             # unit-тесты логики'
    ],
    conventions: [
      'Одна сцена = одна ответственность (Boot / Preload / Game / UI)',
      'Никакой магии: все числа вынести в src/config/balance.ts',
      'Строгий TypeScript (strict: true), без `any`'
    ],
    gotchas: [
      'Ассеты грузить только в PreloadScene и ждать this.load.on("complete")',
      'Физику и таймеры привязывать к сцене, а не к глобалу'
    ]
  },
  three: {
    id: 'three',
    label: 'Three.js',
    language: 'TypeScript',
    version: 'r160+',
    entry: 'src/main.ts',
    entryScene: 'src/core/Game.ts',
    ext: '.ts',
    runCmd: 'npm run dev',
    testCmd: 'npm test  (vitest run)',
    testFramework: 'Vitest',
    pkgManager: 'npm',
    folders: [
      'src/main.ts        # bootstrap, канвас, render loop',
      'src/core/          # Game, SceneManager, AssetLoader, InputManager',
      'src/entities/      # игровые объекты (Object3D-обёртки)',
      'src/systems/       # физика, коллизии, очки',
      'src/shaders/       # GLSL-шейдеры',
      'src/config/        # balance.ts',
      'public/assets/     # .glb/.gltf модели, текстуры, HDRI, аудио'
    ],
    conventions: [
      'Каждый объект — класс с update(dt) и dispose()',
      'Ресурсы обязательно освобождать (geometry.dispose(), material.dispose())',
      'Разделять логику и рендер (логика не знает про THREE.Mesh напрямую)'
    ],
    gotchas: [
      'Дельта-время считать через THREE.Clock, а не Date.now()',
      'requestAnimationFrame в единственном экземпляре'
    ]
  },
  pygame: {
    id: 'pygame',
    label: 'Pygame',
    language: 'Python',
    version: '2.5+ / Python 3.12',
    entry: 'main.py',
    entryScene: 'main.py',
    ext: '.py',
    runCmd: 'python main.py',
    testCmd: 'pytest -q',
    testFramework: 'pytest',
    pkgManager: 'venv + pip (requirements.txt)',
    folders: [
      'main.py            # точка входа, game loop',
      'src/scenes/        # scene_play.py, scene_menu.py',
      'src/entities/      # player.py, enemy.py (спрайты pygame.sprite.Sprite)',
      'src/systems/       # score_system.py, save_system.py',
      'src/config.py      # все константы баланса',
      'assets/images/     # PNG',
      'assets/sounds/     # OGG/WAV',
      'tests/             # pytest-тесты чистой логики'
    ],
    conventions: [
      'PEP8, type hints обязательны, snake_case',
      'Логику отделять от рендера: сцены не хранят бизнес-правила',
      'Все константы — в src/config.py'
    ],
    gotchas: [
      'Не смешивать pygame.event.get() и не обрабатывать события дважды',
      'Изображения конвертировать: img.convert_alpha() после display.set_mode()'
    ]
  },
  custom: {
    id: 'custom',
    label: 'Другой / свой движок',
    language: 'по выбору агента',
    version: '—',
    entry: 'src/main',
    entryScene: 'src/main',
    ext: '',
    runCmd: 'уточняется в TECH_SPEC.md',
    testCmd: 'уточняется в TECH_SPEC.md',
    testFramework: 'уточняется',
    pkgManager: 'уточняется',
    folders: [
      'src/               # исходники',
      'src/entities/      # игровые сущности',
      'src/systems/       # системы',
      'assets/            # ресурсы',
      'docs/              # документация'
    ],
    conventions: ['Описываются в TECH_SPEC.md'],
    gotchas: []
  }
};

export const GENRES = [
  { id: 'platformer', label: '2D-платформер' },
  { id: 'topdown-arena', label: 'Top-Down арена / выживание' },
  { id: 'endless-runner', label: 'Endless Runner (бесконечный бег)' },
  { id: 'grid-puzzle', label: 'Grid Puzzle (сетка, уровни)' },
  { id: 'shooter', label: 'Шутер' },
  { id: 'rpg', label: 'RPG / приключение' },
  { id: 'roguelike', label: 'Roguelike' },
  { id: 'arcade', label: 'Аркада / хайскор' },
  { id: 'tower-defense', label: 'Tower Defense' },
  { id: 'custom', label: 'Другое' }
];

export const PLATFORMS = [
  { id: 'web-desktop', label: 'Web (браузер, десктоп)' },
  { id: 'web-mobile', label: 'Web (браузер, мобильные)' },
  { id: 'windows', label: 'Windows' },
  { id: 'linux', label: 'Linux' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
  { id: 'telegram', label: 'Telegram Mini App' }
];

export const ART_STYLES = [
  'Пиксель-арт (16x16 / 32x32)',
  'Векторная / flat-графика',
  'Low-poly 3D',
  'Плейсхолдеры (цветные прямоугольники)',
  'Ретро CRT / scanlines',
  'Минимализм, монохром + акцент'
];

export const PATTERNS = [
  { id: 'fsm', label: 'Finite State Machine (FSM)', why: 'Поведение игрока, врагов и состояний сцены становится предсказуемым и тестируемым.' },
  { id: 'event-driven', label: 'Event-driven (шина событий / сигналы)', why: 'Системы не знают друг о друге: Score не зависит от Enemy напрямую. Меньше связности — проще менять правила.' },
  { id: 'ecs', label: 'Entity Component System', why: 'Много однотипных сущностей (пули, частицы, враги) — данные отделены от поведения, легко масштабируется.' },
  { id: 'object-pool', label: 'Object Pool', why: 'Никаких аллокаций в игровом цикле: пули и эффекты переиспользуются, нет статтеров.' },
  { id: 'game-loop-fixed', label: 'Fixed-timestep game loop', why: 'Физика и логика не зависят от FPS, геймплей детерминирован.' },
  { id: 'command', label: 'Command (для ввода)', why: 'Ввод отделён от действий игрока — легко добавить реплеи, ремап клавиш, отмену.' },
  { id: 'observer', label: 'Observer / Publisher-Subscriber', why: 'UI подписывается на изменения модели данных и не опрашивает состояние каждый кадр.' },
  { id: 'service', label: 'Service Layer (Score, Audio, Save)', why: 'Единая точка правды для сквозных систем, доступная из любой сцены.' },
  { id: 'state-machine-scene', label: 'Scene/Pushdown State (меню ↔ игра ↔ пауза)', why: 'Чёткое управление жизненным циклом сцен и паузой без хаков.' }
];

export const STATE_MODES = [
  { id: 'local', label: 'Локальное состояние сцены (без глобалов)' },
  { id: 'singleton-services', label: 'Синглтон-сервисы (autoload / DI-контейнер)' },
  { id: 'store', label: 'Централизованный store (событийный)' },
  { id: 'scriptable', label: 'ScriptableObject / ресурсы-конфиги' }
];

export const GAME_SYSTEMS = [
  { id: 'score', label: 'Система очков', detail: 'начисление, комбо-множитель, рекорд' },
  { id: 'health', label: 'Здоровье / урон', detail: 'HP, i-frames, смерть' },
  { id: 'lives', label: 'Жизни / retry', detail: 'кол-во попыток, чекпоинты' },
  { id: 'timer', label: 'Таймер уровня', detail: 'обратный отсчёт, бонус за скорость' },
  { id: 'combos', label: 'Комбо / стрик', detail: 'цепочки действий, множитель' },
  { id: 'powerups', label: 'Бонусы и апгрейды', detail: 'временные эффекты' },
  { id: 'save', label: 'Сохранение прогресса', detail: 'localStorage / JSON-файл' },
  { id: 'levels', label: 'Уровни и прогрессия', detail: 'последовательность, разблокировка' },
  { id: 'audio', label: 'Звук и музыка', detail: 'SFX, фон, mute-настройка' },
  { id: 'settings', label: 'Настройки', detail: 'громкость, управление, качество' },
  { id: 'achievements', label: 'Достижения', detail: 'локальные ачивки в профиле' },
  { id: 'leaderboard', label: 'Таблица рекордов', detail: 'локальный топ-10' }
];

export const DOD_OPTIONS = [
  'Проект запускается одной командой без ошибок в консоли',
  'Все шаги проверки воспроизведены агентом и описаны в отчёте',
  'Нет // TODO и заглушек в коде кроме явно помеченных `// PLACEHOLDER:`',
  'Публичные функции/классы имеют комментарии-контракты',
  'Числовой баланс вынесен в конфиг, а не размазан по коду',
  'Юнит-тесты на чистую логику (очки, урон, победа) проходят',
  'Игра работает при 60 FPS на целевом разрешении',
  'Нет утечек: объекты освобождаются / возвращаются в пул',
  'Управление работает на клавиатуре и (если нужно) на тач-устройствах',
  'После перезапуска прогресс сохраняется'
];

export const CONSTRAINTS_OPTIONS = [
  'Не менять стек и версии зависимостей без явного разрешения',
  'Не добавлять новые внешние библиотеки без обоснования',
  'Не рефакторить существующий код вне рамок текущей задачи',
  'Не трогать файлы вне списка «разрешено менять»',
  'Максимум один новый файл за итерацию, если не сказано иное',
  'Коммит-сообщения в формате Conventional Commits',
  'Строгая типизация (strict TypeScript / type hints / аннотации)',
  'Никаких ассетов из интернета: только плейсхолдеры, которые агент генерирует сам'
];

export const FORBIDDEN_OPTIONS = [
  'Придумывать несуществующие API движка или библиотек (галлюцинации)',
  'Писать «примерный» код с многоточиями вместо реализации',
  'Оставлять нереализованные функции-заглушки без пометки',
  'Молча расширять объём задачи за пределы постановки',
  'Переписывать уже работающий код «чтобы было красиво»',
  'Добавлять сетевой мультиплеер, БД и бэкенд, если это не в ТЗ',
  'Использовать платные ассеты и SDK',
  'Генерировать бинарные ассеты (аудио/модели) кодом'
];

export const STRATEGY_STEPS = [
  'Прочитать docs/GDD.md и docs/TECH_SPEC.md перед написанием кода',
  'Создать скелет файлов и папок строго по структуре из ТЕХ_SPEC',
  'Реализовать минимальный вертикальный срез: запуск → управление → 1 враг → смерть/победа',
  'Каждую итерацию завершать запускаемым состоянием игры (не оставлять проект сломанным)',
  'После каждой итерации писать краткий отчёт: что сделано, как проверить, что дальше',
  'Не начинать следующую фичу, пока предыдущая не проверена запуском'
];

export const ROLES = [
  'Senior Game Developer',
  'Lead Unity Developer',
  'Godot 4 Gameplay Engineer',
  'Senior Frontend Game Developer (TypeScript)',
  'Senior Python Game Developer',
  'Technical Game Designer'
];

export const SCOPE_LEVELS = [
  { id: 'prototype', label: 'Прототип (проверить механику, 30+ мин работы агента)' },
  { id: 'mvp', label: 'MVP / вертикальный срез (играбельно, 1-2 уровня)' },
  { id: 'vertical-slice', label: 'Vertical Slice (полированный кусок игры)' },
  { id: 'full', label: 'Полный проект (много контента)' }
];

export const ENGINE_IDS = Object.keys(ENGINES);
