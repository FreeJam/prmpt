/**
 * PRMPT — схема конфигурации проекта, дефолты, нормализация и валидация.
 */
import { ENGINES, SCOPE_LEVELS } from './catalog.js';

export const SCHEMA_VERSION = 1;

export function defaultConfig() {
  return {
    schema: SCHEMA_VERSION,
    meta: {
      projectName: 'Neon Runner',
      packageName: 'neon_runner',
      genre: 'endless-runner',
      engine: 'phaser',
      coreMechanic: 'Бег вперёд с перекатами и двойным прыжком: ритм ускоряется, дистанция растёт, за серию собранных чипов растёт множитель очков.',
      artStyle: 'Пиксель-арт (16x16 / 32x32)',
      platform: 'web-desktop',
      references: 'Canabalt, Geometry Dash, Subway Surfers',
      pitch: 'Неоновый раннер, где каждая ошибка дороже предыдущей: скорость растёт, а множитель сгорает при первом столкновении.',
      scope: 'mvp',
      targetIterations: 6
    },
    gameplay: {
      player: {
        name: 'Игрок',
        controls: 'A/D — смена полосы, Space/W — прыжок, S — перекат, Esc — пауза',
        abilities: ['Двойной прыжок', 'Перекат (dash) с i-frames', 'Замедление времени (1 заряд)'],
        hp: 3,
        speed: 6
      },
      coreLoop: [
        'Бежать вперёд, скорость автоматически растёт',
        'Читать препятствия и реагировать прыжком/перекатом',
        'Собирать чипы — растёт множитель очков',
        'Потерять HP при столкновении — множитель сбрасывается',
        'Играть до 0 HP, увидеть рекорд, начать заново в один клик'
      ],
      enemies: [
        { name: 'Дрон-патруль', behavior: 'Летит на фиксированной высоте, качается синусоидой', hp: 1, damage: 1, notes: 'Сбивается только рывком' },
        { name: 'Стационарный шип', behavior: 'Неподвижен, появляется на полосе', hp: 999, damage: 1, notes: 'Требует смены полосы' }
      ],
      obstacles: [
        { name: 'Низкая баррикада', behavior: 'Перепрыгивается', value: 0 },
        { name: 'Потолочная балка', behavior: 'Требует переката', value: 0 }
      ],
      pickups: [
        { name: 'Чип', effect: 'Очки + множитель', value: 10 },
        { name: 'Хайп-сфера', effect: 'Замедление времени', value: 0 }
      ],
      systems: { score: true, health: true, lives: false, timer: false, combos: true, powerups: true, save: true, levels: false, audio: true, settings: true, achievements: true, leaderboard: true },
      difficulty: 'Плавный рост скорости + дискретное повышение плотности препятствий каждые 500 м. Первые 15 секунд — «безопасный» разгон.',
      progression: 'Endless: рост скорости и плотности; рекорд сохраняется локально',
      levels: [{ name: 'Бесконечный прогон', goal: 'Продержаться как можно дольше, побить рекорд' }],
      winCondition: 'Победы нет — есть рекорд дистанции и очков. Достижение 5000 м считается «победой среза».',
      loseCondition: 'HP = 0 при столкновении с препятствием/врагом'
    },
    tech: {
      patterns: ['fsm', 'event-driven', 'object-pool', 'service', 'game-loop-fixed'],
      stateMode: 'singleton-services',
      dataDriven: true,
      saveFormat: 'JSON в localStorage',
      testing: 'Юнит-тесты (vitest) на чистую логику: очки, множитель, урон, определение победы/поражения',
      perfTarget: 'Стабильные 60 FPS в Chrome, отрисовка ≤ 4 мс/кадр',
      resolution: '960x540 (canvas, масштабируется под окно)',
      folderStructure: 'auto',
      customFolders: ''
    },
    prompt: {
      role: 'Senior Frontend Game Developer (TypeScript)',
      agent: 'opencode',
      experience: 'Уровень Senior: код должен быть чистым, типизированным и сопровождаемым',
      constraints: [
        'Не менять стек и версии зависимостей без явного разрешения',
        'Не добавлять новые внешние библиотеки без обоснования',
        'Никаких ассетов из интернета: только плейсхолдеры, которые агент генерирует сам',
        'Строгая типизация (strict TypeScript / type hints / аннотации)'
      ],
      forbidden: [
        'Придумывать несуществующие API движка или библиотек (галлюцинации)',
        'Писать «примерный» код с многоточиями вместо реализации',
        'Оставлять нереализованные функции-заглушки без пометки',
        'Молча расширять объём задачи за пределы постановки',
        'Переписывать уже работающий код «чтобы было красиво»'
      ],
      strategy: ['Прочитать docs/GDD.md и docs/TECH_SPEC.md перед написанием кода', 'Создать скелет файлов и папок строго по структуре из ТЕХ_SPEC', 'Реализовать минимальный вертикальный срез: запуск → управление → 1 враг → смерть/победа'],
      dod: [
        'Проект запускается одной командой без ошибок в консоли',
        'Все шаги проверки воспроизведены агентом и описаны в отчёте',
        'Нет // TODO и заглушек в коде кроме явно помеченных `// PLACEHOLDER:`',
        'Числовой баланс вынесен в конфиг, а не размазан по коду'
      ],
      iterationSize: 'Одна атомарная фича за итерацию',
      askQuestions: true,
      reportFormat: 'Markdown-отчёт: Что сделано / Файлы / Как проверить / Известные ограничения / Следующий шаг',
      includeRoadmap: true
    }
  };
}

export function normalizeConfig(input) {
  const d = defaultConfig();
  const c = input && typeof input === 'object' ? input : {};
  const out = structuredCloneSafe(d);

  out.schema = SCHEMA_VERSION;
  merge(out.meta, c.meta);
  merge(out.gameplay, c.gameplay);
  merge(out.tech, c.tech);
  merge(out.prompt, c.prompt);

  // Массивы: заменяем целиком, если переданы, иначе дефолт
  for (const arr of [
    ['gameplay', 'enemies'], ['gameplay', 'obstacles'], ['gameplay', 'pickups'],
    ['gameplay', 'coreLoop'], ['gameplay', 'levels'],
    ['tech', 'patterns'], ['prompt', 'constraints'], ['prompt', 'forbidden'],
    ['prompt', 'strategy'], ['prompt', 'dod']
  ]) {
    const [g, k] = arr;
    if (Array.isArray(c[g]?.[k])) out[g][k] = c[g][k];
  }
  if (c.gameplay?.player && typeof c.gameplay.player === 'object') {
    merge(out.gameplay.player, c.gameplay.player);
    if (Array.isArray(c.gameplay.player.abilities)) out.gameplay.player.abilities = c.gameplay.player.abilities;
  }
  if (c.gameplay?.systems && typeof c.gameplay.systems === 'object') {
    merge(out.gameplay.systems, c.gameplay.systems);
  }

  if (!ENGINES[out.meta.engine]) out.meta.engine = 'custom';
  if (!SCOPE_LEVELS.some((s) => s.id === out.meta.scope)) out.meta.scope = 'mvp';
  out.meta.packageName = slug(out.meta.packageName || out.meta.projectName);
  out.meta.projectName = String(out.meta.projectName || 'Untitled Game').slice(0, 80);
  return out;
}

function merge(target, src) {
  if (!src || typeof src !== 'object') return target;
  for (const [k, v] of Object.entries(src)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) || typeof v !== 'object') target[k] = v;
    else if (typeof target[k] === 'object' && !Array.isArray(target[k])) merge(target[k], v);
    else target[k] = v;
  }
  return target;
}

export function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => RUS[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'my_game';
}

const RUS = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };

export function structuredCloneSafe(o) {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

export function validateConfig(cfg) {
  const errors = [];
  const warnings = [];
  if (!cfg.meta.projectName?.trim()) errors.push({ field: 'meta.projectName', message: 'Укажите название игры' });
  if (!cfg.meta.coreMechanic?.trim() || cfg.meta.coreMechanic.trim().length < 20) {
    warnings.push({ field: 'meta.coreMechanic', message: 'Кор-механика короче 20 символов — агенту будет неясно, что делать' });
  }
  if (!cfg.tech.patterns?.length) warnings.push({ field: 'tech.patterns', message: 'Не выбрано ни одного архитектурного паттерна — ТЗ будет абстрактным' });
  if (!cfg.prompt.dod?.length) errors.push({ field: 'prompt.dod', message: 'Нужен хотя бы один критерий приёмки (Definition of Done)' });
  if (!cfg.prompt.forbidden?.length) warnings.push({ field: 'prompt.forbidden', message: 'Нет запретов — агент может уйти в рефакторинг и выдуманные API' });
  return { ok: errors.length === 0, errors, warnings };
}
