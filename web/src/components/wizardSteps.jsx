import React from 'react';
import {
  Fingerprint, Gamepad2, Rocket, Boxes, Shapes, Terminal, Wrench, Sparkles, Footprints,
  Crosshair, Timer, Grid3x3, Target, BookOpen, Dice5, Joystick, Castle, BrainCircuit,
  Heart, Swords, SlidersHorizontal, Wand2, TerminalSquare, ShieldAlert, ListChecks,
  Layers, FolderTree, Gauge, Users, Save, Monitor, Palette, Package
} from 'lucide-react';
import {
  Field, TextInput, TextInputBig, TextArea, Select, Toggle, Chip, ChipMulti, StringList,
  ObjectList, Section, Collapsible, OptionCards, Tooltip
} from './kit.jsx';
import {
  ENGINES, GENRES, PLATFORMS, ART_STYLES, PATTERNS, STATE_MODES, GAME_SYSTEMS, SCOPE_LEVELS,
  ROLES, DOD_OPTIONS, CONSTRAINTS_OPTIONS, FORBIDDEN_OPTIONS, STRATEGY_STEPS
} from '@shared/catalog.js';

/* ── иконки карточек выбора (маленькие, в потоке текста) ── */
const GENRE_ICONS = {
  platformer: Footprints, 'topdown-arena': Crosshair, 'endless-runner': Timer, 'grid-puzzle': Grid3x3,
  shooter: Target, rpg: BookOpen, roguelike: Dice5, arcade: Joystick, 'tower-defense': Castle, custom: Sparkles
};
const ENGINE_ICONS = { godot: Rocket, unity: Boxes, phaser: Gamepad2, three: Shapes, pygame: Terminal, custom: Wrench };
const PLATFORM_ICONS = {
  'web-desktop': Monitor, 'web-mobile': Monitor, windows: Monitor, linux: Terminal,
  android: Monitor, ios: Monitor, telegram: Sparkles
};
const AGENT_ICONS = {
  opencode: TerminalSquare, cursor: Crosshair, aider: Wand2, 'claude-code': BrainCircuit, codex: Terminal, chat: BookOpen
};

/* ─────────────────────────── ШАГ 1 ─────────────────────────── */

function StepIdentity({ project }) {
  const { config, set } = project;
  const m = config.meta;

  return (
    <div className="space-y-8">
      <Section
        icon={Fingerprint}
        title="Как называется игра?"
        desc="С этого начинается любой документ. Рабочее название подойдёт — его легко поменять потом."
      >
        <TextInputBig
          value={m.projectName}
          onChange={(v) => set(['meta', 'projectName'], v)}
          placeholder="Например: Neon Runner"
        />
      </Section>

      <Section icon={Gamepad2} title="Какой это жанр?" desc="Жанр определяет набор механик, которые агент предложит в GDD.">
        <OptionCards
          value={m.genre}
          onChange={(v) => set(['meta', 'genre'], v)}
          options={GENRES.map((g) => ({ id: g.id, title: g.label, icon: GENRE_ICONS[g.id] ?? Sparkles }))}
          size="sm"
          columns={2}
        />
      </Section>

      <Collapsible icon={Palette} title="Платформа, арт-стиль и имя папки" hint="можно оставить по умолчанию">
        <div className="space-y-6">
          <div>
            <span className="field-label">Целевая платформа</span>
            <OptionCards
              value={m.platform}
              onChange={(v) => set(['meta', 'platform'], v)}
              options={PLATFORMS.map((p) => ({ id: p.id, title: p.label, icon: PLATFORM_ICONS[p.id] ?? Monitor }))}
              size="sm"
              columns={3}
            />
          </div>
          <div>
            <span className="field-label">
              Стиль графики
              <Tooltip text="Если сомневаетесь — выбирайте плейсхолдеры: агент всё равно не нарисует ассеты, а код будет тем же." />
            </span>
            <div className="flex flex-wrap gap-2">
              {ART_STYLES.map((s) => (
                <Chip key={s} active={m.artStyle === s} onClick={() => set(['meta', 'artStyle'], s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <Field label="Имя папки проекта" tip="Латиница, нижний регистр, подчёркивания. Попадёт в структуру архива.">
            <TextInput mono value={m.packageName} onChange={(v) => set(['meta', 'packageName'], v)} placeholder="neon_runner" />
          </Field>
        </div>
      </Collapsible>
    </div>
  );
}

/* ─────────────────────────── ШАГ 2 ─────────────────────────── */

function StepEngine({ project }) {
  const { config, set } = project;
  const m = config.meta;
  const engine = ENGINES[m.engine] ?? ENGINES.custom;

  return (
    <div className="space-y-8">
      <Section
        icon={Rocket}
        title="На чём делаем игру?"
        desc="От движка зависят команды запуска, структура папок и содержание первой задачи для агента."
      >
        <OptionCards
          value={m.engine}
          onChange={(v) => set(['meta', 'engine'], v)}
          options={Object.values(ENGINES).map((e) => ({
            id: e.id,
            title: e.label,
            subtitle: `${e.language} · ${e.version}`,
            badge: e.id === 'custom' ? undefined : e.version,
            icon: ENGINE_ICONS[e.id] ?? Wrench
          }))}
          columns={2}
        />
      </Section>

      <dl className="panel-sunken grid gap-x-6 gap-y-2 px-4 py-3 text-xs sm:grid-cols-2">
        <div className="flex items-baseline gap-2">
          <dt className="shrink-0 text-ink-500">запуск</dt>
          <dd className="num truncate text-ink-200">{engine.runCmd}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="shrink-0 text-ink-500">тесты</dt>
          <dd className="num truncate text-ink-200">{engine.testFramework}</dd>
        </div>
      </dl>

      <Collapsible
        icon={Layers}
        title="Насколько большой объём?"
        hint={`${(SCOPE_LEVELS.find((s) => s.id === m.scope) ?? {}).label ?? '—'} · ${m.targetIterations} итераций`}
      >
        <div className="space-y-6">
          <div>
            <span className="field-label">Объём</span>
            <OptionCards
              value={m.scope}
              onChange={(v) => set(['meta', 'scope'], v)}
              options={SCOPE_LEVELS.map((s) => ({
                id: s.id,
                title: s.label.split(' (')[0],
                subtitle: s.label.includes('(') ? s.label.slice(s.label.indexOf('(') + 1, -1) : undefined,
                icon: Gauge
              }))}
              size="sm"
              columns={2}
            />
          </div>
          <Field
            label="На сколько итераций разбить работу"
            tip="Попадает в план docs/PROMPT_ROADMAP.md — это декомпозиция задачи на проверяемые шаги."
          >
            <TextInput
              type="number"
              min={2}
              max={20}
              mono
              value={m.targetIterations}
              onChange={(v) => set(['meta', 'targetIterations'], Number(v) || 0)}
            />
          </Field>
        </div>
      </Collapsible>
    </div>
  );
}

/* ─────────────────────────── ШАГ 3 ─────────────────────────── */

function StepMechanic({ project }) {
  const { config, set } = project;
  const m = config.meta;

  return (
    <div className="space-y-8">
      <Section
        icon={BrainCircuit}
        title="Что игрок делает в игре?"
        desc="Самый важный ответ. Опишите правила: что нажимает игрок и что из этого следует."
      >
        <TextArea
          rows={5}
          counter
          value={m.coreMechanic}
          onChange={(v) => set(['meta', 'coreMechanic'], v)}
          placeholder="Например: дольше удерживаешь кнопку — выше прыжок; приземление на платформу своего цвета даёт ускорение, чужого — отбрасывает."
        />
        <p className="hint">
          Чем конкретнее правила, тем меньше агент додумает за вас. Рабочий ориентир — 100+ символов.
        </p>

        <div className="mt-6 space-y-5">
          <Field label="Питч в одном абзаце" tip="Для кого игра и в чём крючок. Агент опирается на это в спорных решениях.">
            <TextArea rows={2} value={m.pitch} onChange={(v) => set(['meta', 'pitch'], v)} />
          </Field>
          <Field label="Игры-ориентиры">
            <TextInput
              value={m.references}
              onChange={(v) => set(['meta', 'references'], v)}
              placeholder="Celeste, Super Meat Boy"
            />
          </Field>
        </div>
      </Section>

      <Section
        icon={ListChecks}
        title="Игровой цикл"
        desc="3–6 шагов, которые повторяются от старта до конца сессии. Вокруг них агент построит код."
      >
        <StringList
          values={config.gameplay.coreLoop}
          onChange={(v) => set(['gameplay', 'coreLoop'], v)}
          placeholder="Например: бежать вперёд, читать препятствия, реагировать…"
        />
      </Section>
    </div>
  );
}

/* ─────────────────────────── ШАГ 4 ─────────────────────────── */

function StepPlayer({ project }) {
  const { config, set } = project;
  const p = config.gameplay.player;

  return (
    <div className="space-y-8">
      <Section icon={Heart} title="Кем управляет игрок?" desc="Управление попадёт в документы дословно и превратится в код ввода.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Имя">
            <TextInput value={p.name} onChange={(v) => set(['gameplay', 'player', 'name'], v)} />
          </Field>
          <Field label="Здоровье" tip="0 — если урона в игре не будет.">
            <TextInput type="number" mono value={p.hp} onChange={(v) => set(['gameplay', 'player', 'hp'], Number(v) || 0)} />
          </Field>
          <Field label="Скорость" tip="Число из баланса: пикселей или юнитов в секунду.">
            <TextInput
              type="number"
              mono
              value={p.speed}
              onChange={(v) => set(['gameplay', 'player', 'speed'], Number(v) || 0)}
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Управление" tip="Чем точнее указаны клавиши, тем меньше шанс, что агент подставит свои.">
            <TextArea rows={2} value={p.controls} onChange={(v) => set(['gameplay', 'player', 'controls'], v)} />
          </Field>
        </div>
      </Section>

      <Section icon={Wand2} title="Что игрок умеет?" desc="Каждая способность станет отдельной фичей в плане итераций.">
        <StringList
          values={p.abilities}
          onChange={(v) => set(['gameplay', 'player', 'abilities'], v)}
          placeholder="Двойной прыжок, рывок…"
        />
      </Section>
    </div>
  );
}

/* ─────────────────────────── ШАГ 5 ─────────────────────────── */

function StepEntities({ project }) {
  const { config, set } = project;
  const g = config.gameplay;

  return (
    <div className="space-y-8">
      <Section
        icon={Swords}
        title="Кто и что мешает игроку?"
        desc="Опишите поведение словами — агент превратит его в состояния и код. Шаг можно пропустить и вернуться позже."
      >
        <ObjectList
          titleKey="name"
          addLabel="Добавить противника"
          blank={{ name: 'Новый противник', behavior: 'Патрулирует между двумя точками', hp: 1, damage: 1, notes: '' }}
          items={g.enemies}
          onChange={(v) => set(['gameplay', 'enemies'], v)}
          fields={[
            { key: 'name', label: 'Имя' },
            { key: 'hp', label: 'Прочность', type: 'number' },
            { key: 'damage', label: 'Урон', type: 'number' },
            { key: 'behavior', label: 'Поведение', type: 'area', placeholder: 'Что делает по кругу?' },
            { key: 'notes', label: 'Как побеждается', type: 'area' }
          ]}
        />
      </Section>

      <Collapsible
        icon={ShieldAlert}
        title="Препятствия"
        hint={g.obstacles?.length ? `${g.obstacles.length} шт.` : 'пока не заданы'}
      >
        <ObjectList
          titleKey="name"
          addLabel="Добавить препятствие"
          blank={{ name: 'Препятствие', behavior: '', value: 0 }}
          items={g.obstacles}
          onChange={(v) => set(['gameplay', 'obstacles'], v)}
          fields={[
            { key: 'name', label: 'Имя' },
            { key: 'value', label: 'Значение', type: 'number' },
            { key: 'behavior', label: 'Поведение', type: 'area' }
          ]}
        />
      </Collapsible>

      <Collapsible
        icon={Package}
        title="Что можно подобрать"
        hint={g.pickups?.length ? `${g.pickups.length} шт.` : 'пока не задано'}
      >
        <ObjectList
          titleKey="name"
          addLabel="Добавить предмет"
          blank={{ name: 'Предмет', effect: '', value: 10 }}
          items={g.pickups}
          onChange={(v) => set(['gameplay', 'pickups'], v)}
          fields={[
            { key: 'name', label: 'Имя' },
            { key: 'value', label: 'Значение', type: 'number' },
            { key: 'effect', label: 'Эффект', type: 'area' }
          ]}
        />
      </Collapsible>
    </div>
  );
}

/* ─────────────────────────── ШАГ 6 ─────────────────────────── */

function StepRules({ project }) {
  const { config, set } = project;
  const g = config.gameplay;
  const enabled = GAME_SYSTEMS.filter((s) => g.systems?.[s.id]).length;

  return (
    <div className="space-y-8">
      <Section
        icon={SlidersHorizontal}
        title="Что должно работать в игре?"
        desc="Отметьте нужное — каждая система попадёт в ТЗ, в обязательные события и в список тестов."
      >
        <div className="flex flex-wrap gap-2">
          {GAME_SYSTEMS.map((s) => {
            const on = !!g.systems?.[s.id];
            return (
              <Chip key={s.id} active={on} title={s.detail} onClick={() => set(['gameplay', 'systems', s.id], !on)}>
                {s.label}
              </Chip>
            );
          })}
        </div>
        <p className="hint">
          Выбрано {enabled} из {GAME_SYSTEMS.length}. Начните с главного: очки, здоровье, сохранение.
        </p>
      </Section>

      <Section
        icon={Target}
        title="Как игра заканчивается?"
        desc="Если победы нет — так и напишите: «победы нет, цель — рекорд». Иначе агент придумает её сам."
      >
        <div className="space-y-5">
          <Field label="Условие победы">
            <TextArea rows={2} value={g.winCondition} onChange={(v) => set(['gameplay', 'winCondition'], v)} />
          </Field>
          <Field label="Условие поражения">
            <TextArea rows={2} value={g.loseCondition} onChange={(v) => set(['gameplay', 'loseCondition'], v)} />
          </Field>
        </div>
      </Section>

      <Collapsible icon={Gauge} title="Сложность, прогрессия и уровни" hint="что меняется от уровня к уровню">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Модель прогрессии">
              <TextInput value={g.progression} onChange={(v) => set(['gameplay', 'progression'], v)} />
            </Field>
            <Field label="Кривая сложности" tip="Формула или правило — например «плотность врагов +15% за волну».">
              <TextInput value={g.difficulty} onChange={(v) => set(['gameplay', 'difficulty'], v)} />
            </Field>
          </div>
          <div>
            <span className="field-label">Уровни и контент</span>
            <ObjectList
              titleKey="name"
              addLabel="Добавить уровень"
              blank={{ name: `Уровень ${(g.levels?.length ?? 0) + 1}`, goal: '' }}
              items={g.levels}
              onChange={(v) => set(['gameplay', 'levels'], v)}
              fields={[
                { key: 'name', label: 'Название' },
                { key: 'goal', label: 'Цель', type: 'area' }
              ]}
            />
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

/* ─────────────────────────── ШАГ 7 ─────────────────────────── */

function StepArchitecture({ project }) {
  const { config, set } = project;
  const t = config.tech;
  const engine = ENGINES[config.meta.engine] ?? ENGINES.custom;

  return (
    <div className="space-y-8">
      <Section icon={Layers} title="Как устроен код?" desc="2–4 паттерна — это то, что не даёт агенту свалить всю логику в один файл.">
        <ChipMulti values={t.patterns} options={PATTERNS} onChange={(v) => set(['tech', 'patterns'], v)} />
        {t.patterns.length > 5 && (
          <p className="text-xs text-amber">
            Выбрано {t.patterns.length}. Для одной итерации это много — агент реализует их поверхностно. Оставьте 2–4
            ключевых.
          </p>
        )}
      </Section>

      <Section icon={Save} title="Где хранится состояние игры?" desc="Правда о прогрессе: очки, здоровье, настройки.">
        <OptionCards
          value={t.stateMode}
          onChange={(v) => set(['tech', 'stateMode'], v)}
          options={STATE_MODES.map((s) => ({ id: s.id, title: s.label }))}
          size="sm"
          columns={2}
        />
        <div className="mt-5">
          <Toggle
            label="Данные отдельно от логики"
            hint="Все числа баланса — в конфиг-файле, а не в коде"
            checked={!!t.dataDriven}
            onChange={(v) => set(['tech', 'dataDriven'], v)}
          />
        </div>
      </Section>

      <Collapsible
        icon={FolderTree}
        title="Структура папок и сохранения"
        hint={t.folderStructure === 'custom' ? 'своя структура' : `стандартная для ${engine.label}`}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Chip active={t.folderStructure === 'auto'} onClick={() => set(['tech', 'folderStructure'], 'auto')}>
              Стандартная для {engine.label}
            </Chip>
            <Chip active={t.folderStructure === 'custom'} onClick={() => set(['tech', 'folderStructure'], 'custom')}>
              Своя структура
            </Chip>
          </div>
          {t.folderStructure === 'custom' ? (
            <TextArea
              rows={7}
              value={t.customFolders ?? ''}
              onChange={(v) => set(['tech', 'customFolders'], v)}
              placeholder={'src/\n  entities/\n  systems/\nassets/'}
            />
          ) : (
            <pre className="overflow-x-auto rounded-lg border border-line bg-sunken p-3.5 font-mono text-2xs leading-relaxed text-ink-300">
              {engine.folders.join('\n')}
            </pre>
          )}
          <Field label="Формат сохранений">
            <TextInput
              value={t.saveFormat}
              onChange={(v) => set(['tech', 'saveFormat'], v)}
              placeholder="JSON в localStorage"
            />
          </Field>
        </div>
      </Collapsible>

      <Collapsible icon={Gauge} title="Производительность и тесты" hint={t.perfTarget}>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Целевая производительность" tip="Формулируйте измеримо: «60 FPS при 300 снарядах». «Быстро» — не критерий.">
              <TextInput value={t.perfTarget} onChange={(v) => set(['tech', 'perfTarget'], v)} />
            </Field>
            <Field label="Разрешение / канвас">
              <TextInput value={t.resolution} onChange={(v) => set(['tech', 'resolution'], v)} />
            </Field>
          </div>
          <Field label="Что тестируем" tip="Направьте агента на чистую логику, а не на UI — тесты интерфейса он обычно ломает.">
            <TextArea rows={2} value={t.testing} onChange={(v) => set(['tech', 'testing'], v)} />
          </Field>
        </div>
      </Collapsible>
    </div>
  );
}

/* ─────────────────────────── ШАГ 8 ─────────────────────────── */

function QuickAdd({ options, values, onAdd, label }) {
  const missing = options.filter((o) => !values.includes(o));
  if (!missing.length) return null;
  return (
    <div className="mt-3 border-t border-line-soft pt-3">
      <div className="mb-2 flex items-center gap-1.5 text-2xs text-ink-500">
        <Sparkles size={12} strokeWidth={1.75} /> {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {missing.slice(0, 8).map((o) => (
          <Chip key={o} onClick={() => onAdd(o)}>
            + {o.length > 48 ? `${o.slice(0, 48)}…` : o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function StepPrompt({ project }) {
  const { config, set } = project;
  const p = config.prompt;
  const customRole = !ROLES.includes(p.role);

  return (
    <div className="space-y-8">
      <Section icon={TerminalSquare} title="Кому отдаём работу?" desc="Роль задаёт уровень кода и стиль ответов агента.">
        <OptionCards
          value={p.agent}
          onChange={(v) => set(['prompt', 'agent'], v)}
          options={[
            { id: 'opencode', title: 'OpenCode', icon: AGENT_ICONS.opencode },
            { id: 'cursor', title: 'Cursor', icon: AGENT_ICONS.cursor },
            { id: 'aider', title: 'Aider', icon: AGENT_ICONS.aider },
            { id: 'claude-code', title: 'Claude Code', icon: AGENT_ICONS['claude-code'] },
            { id: 'codex', title: 'Codex CLI', icon: AGENT_ICONS.codex },
            { id: 'chat', title: 'Просто чат', subtitle: 'ChatGPT / Claude / Gemini', icon: AGENT_ICONS.chat }
          ]}
          size="sm"
          columns={3}
        />

        <div className="mt-6 space-y-5">
          <Field label="Роль агента">
            <Select
              value={customRole ? '__custom' : p.role}
              onChange={(v) => {
                if (v !== '__custom') set(['prompt', 'role'], v);
              }}
              options={[...ROLES.map((r) => ({ id: r, label: r })), { id: '__custom', label: 'Своя роль (ввести ниже)' }]}
            />
          </Field>
          {customRole || p.role === 'Своя роль (ввести ниже)' ? (
            <Field label="Своя формулировка роли" hint="Например: «Senior Godot 4 Gameplay Engineer с опытом 2D-платформеров»">
              <TextInput
                value={p.role}
                onChange={(v) => set(['prompt', 'role'], v)}
                placeholder="Senior Godot 4 Gameplay Engineer"
              />
            </Field>
          ) : null}
        </div>
      </Section>

      <Collapsible
        icon={ShieldAlert}
        tone="warn"
        title="Запреты"
        hint={`${p.forbidden.length} шт. — здесь отсекаются выдуманные API и самовольный рефакторинг`}
        defaultOpen
      >
        <StringList values={p.forbidden} onChange={(v) => set(['prompt', 'forbidden'], v)} placeholder="Что категорически нельзя…" />
        <QuickAdd
          label="Готовые формулировки"
          options={FORBIDDEN_OPTIONS}
          values={p.forbidden}
          onAdd={(o) => set(['prompt', 'forbidden'], [...p.forbidden, o])}
        />
      </Collapsible>

      <Collapsible
        icon={ListChecks}
        title="Критерии приёмки"
        hint={`${p.dod.length} шт. — без них агент сам решит, что задача закрыта`}
        defaultOpen
      >
        <StringList values={p.dod} onChange={(v) => set(['prompt', 'dod'], v)} placeholder="Проверяемый критерий…" />
        <QuickAdd
          label="Готовые критерии"
          options={DOD_OPTIONS}
          values={p.dod}
          onAdd={(o) => set(['prompt', 'dod'], [...p.dod, o])}
        />
        {!p.dod.length && <p className="text-xs text-rose">Без критериев приёмки оценка промпта не поднимется выше 60.</p>}
      </Collapsible>

      <Collapsible icon={SlidersHorizontal} title="Ограничения" hint={`${p.constraints.length} шт. — рамки, в которых агенту разрешено работать`}>
        <StringList values={p.constraints} onChange={(v) => set(['prompt', 'constraints'], v)} placeholder="Формулировка ограничения…" />
        <QuickAdd
          label="Готовые формулировки"
          options={CONSTRAINTS_OPTIONS}
          values={p.constraints}
          onAdd={(o) => set(['prompt', 'constraints'], [...p.constraints, o])}
        />
      </Collapsible>

      <Collapsible
        icon={Users}
        title="Стратегия и процесс работы"
        hint={`${p.strategy.length} шагов · ${p.askQuestions ? 'агент может задать вопрос' : 'агент решает сам'}`}
      >
        <div className="space-y-6">
          <div>
            <span className="field-label">Пошаговая стратегия агента</span>
            <StringList values={p.strategy} onChange={(v) => set(['prompt', 'strategy'], v)} placeholder="Шаг стратегии…" />
            <QuickAdd
              label="Готовые шаги"
              options={STRATEGY_STEPS}
              values={p.strategy}
              onAdd={(o) => set(['prompt', 'strategy'], [...p.strategy, o])}
            />
          </div>
          <Field label="Требования к уровню исполнения">
            <TextArea rows={2} value={p.experience} onChange={(v) => set(['prompt', 'experience'], v)} />
          </Field>
          <Field label="Размер шага" tip="Правило атомарности: одна проверяемая фича за итерацию.">
            <TextInput value={p.iterationSize} onChange={(v) => set(['prompt', 'iterationSize'], v)} />
          </Field>
          <div className="space-y-2">
            <Toggle
              label="Разрешить один уточняющий вопрос"
              hint="Иначе агент либо молча угадывает, либо засыпает вопросами"
              checked={!!p.askQuestions}
              onChange={(v) => set(['prompt', 'askQuestions'], v)}
            />
            <Toggle
              label="Включить план итераций"
              hint="docs/PROMPT_ROADMAP.md с шаблоном постановки для каждой итерации"
              checked={!!p.includeRoadmap}
              onChange={(v) => set(['prompt', 'includeRoadmap'], v)}
            />
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

/* ─────────────────────────── описание шагов ─────────────────────────── */

export const STEPS = [
  { id: 'identity', title: 'Название и жанр', short: 'Игра', icon: Fingerprint, Component: StepIdentity,
    lead: 'Начнём с простого — как называется ваша игра и что это за жанр.' },
  { id: 'engine', title: 'Движок', short: 'Движок', icon: Rocket, Component: StepEngine,
    lead: 'Выберите технологию. Документация и первая задача подстроятся под неё.' },
  { id: 'mechanic', title: 'Главная механика', short: 'Механика', icon: BrainCircuit, Component: StepMechanic,
    lead: 'Опишите своими словами, что игрок делает в игре. Это ядро всех документов.' },
  { id: 'player', title: 'Игрок', short: 'Игрок', icon: Heart, Component: StepPlayer,
    lead: 'Кем управляет игрок, с какими параметрами и способностями.' },
  { id: 'entities', title: 'Противники и предметы', short: 'Сущности', icon: Swords, Component: StepEntities,
    lead: 'Наполните мир. Шаг необязательный — можно пропустить и вернуться.' },
  { id: 'rules', title: 'Правила и системы', short: 'Правила', icon: SlidersHorizontal, Component: StepRules,
    lead: 'Что должно работать в игре и как она заканчивается.' },
  { id: 'architecture', title: 'Архитектура', short: 'Архитектура', icon: Layers, Component: StepArchitecture,
    lead: 'Как устроен код внутри. Здесь живёт защита от «всё в одном файле».' },
  { id: 'prompt', title: 'Промпт для агента', short: 'Промпт', icon: TerminalSquare, Component: StepPrompt,
    lead: 'Последний шаг: роль, запреты и критерии приёмки для ИИ-агента.' }
];

export const STEP_COUNT = STEPS.length;
