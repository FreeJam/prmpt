import React, { useEffect, useId, useRef, useState } from 'react';
import { Info, Plus, Trash2, ChevronDown, X, Check } from 'lucide-react';

/**
 * PRMPT · дизайн-кит v2
 * Иерархия строится типографикой и воздухом, а не коробками и иконками.
 * Один акцент (чернила) + маркерная жёлтая для состояния выбора.
 */

const STROKE = 1.75;

/* ─────────────── подсказка ─────────────── */

export function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="tooltip-host inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="Пояснение"
        className="grid h-4 w-4 place-items-center rounded-[4px] text-ink-500 transition-colors hover:text-accent"
      >
        <Info size={12} strokeWidth={STROKE} />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-modal mb-2 w-[min(78vw,320px)] -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-2xs leading-relaxed text-ink-300 shadow-panel"
        >
          {text}
        </span>
      )}
    </span>
  );
}

/* ─────────────── поля ─────────────── */

export function Field({ label, hint, tip, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">
        {label}
        {tip && <Tooltip text={tip} />}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-2xs text-ink-500">{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, mono, ...rest }) {
  return (
    <input
      className={`input ${mono ? 'font-mono text-xs' : ''}`}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

/** Название игры — «пишем на чертеже»: без рамки, только линия снизу */
export function TextInputBig({ value, onChange, placeholder, tip }) {
  return (
    <div className="flex items-end gap-2 border-b border-line pb-2 transition-colors focus-within:border-accent">
      <input
        className="w-full bg-transparent text-2xl font-semibold tracking-[-.015em] text-ink-100 outline-none placeholder:font-normal placeholder:text-ink-500 sm:text-3xl"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        aria-label="Название игры"
      />
      {tip && <Tooltip text={tip} />}
    </div>
  );
}

export function TextArea({ value, onChange, rows = 3, placeholder, counter }) {
  const n = (value ?? '').trim().length;
  return (
    <div>
      <textarea
        className="input textarea"
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {counter && (
        <span className={`num mt-1 block text-right text-2xs ${n < 20 ? 'text-rose' : 'text-ink-500'}`}>
          {n} символов{n < 20 ? ' · для агента маловато' : ''}
        </span>
      )}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select className="input pr-8" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-left transition-colors hover:bg-hover"
    >
      <span
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-line bg-sunken'
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full bg-surface shadow-soft transition-transform duration-200 ease-spring ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink-100">{label}</span>
        {hint && <span className="mt-0.5 block text-2xs leading-snug text-ink-500">{hint}</span>}
      </span>
    </button>
  );
}

/* ─────────────── чипы ─────────────── */

export function Chip({ active, onClick, children, title }) {
  return (
    <button type="button" className={`chip ${active ? 'chip-on' : 'chip-off'}`} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

export function ChipMulti({ values = [], options, onChange }) {
  const has = (v) => values.includes(v);
  const toggle = (v) => onChange(has(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.id} active={has(o.id)} onClick={() => toggle(o.id)} title={o.hint}>
          {has(o.id) && <Check size={12} strokeWidth={2.5} />}
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

/* ─────────────── карточки выбора ─────────────── */

export function OptionCards({ value, onChange, options, columns = 2, size = 'md' }) {
  const cols = columns === 3 ? 'sm:grid-cols-3' : columns === 1 ? '' : 'sm:grid-cols-2';
  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {options.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={`group relative overflow-hidden rounded-lg border px-3.5 text-left transition-all duration-200 ease-out ${
              size === 'sm' ? 'py-2.5' : 'py-3'
            } ${active ? 'border-accent bg-marker/20' : 'border-line bg-surface hover:border-ink-500/40 hover:bg-hover'}`}
          >
            <span
              className={`absolute inset-y-0 left-0 w-[3px] transition-colors ${active ? 'bg-marker' : 'bg-transparent'}`}
            />
            <span className="flex items-baseline gap-2">
              {Icon && (
                <Icon
                  size={size === 'sm' ? 13 : 14}
                  strokeWidth={STROKE}
                  className={`relative top-[2px] shrink-0 ${active ? 'text-ink-200' : 'text-ink-500'}`}
                />
              )}
              <span className={`min-w-0 flex-1 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'} text-ink-100`}>
                {o.title}
              </span>
              {o.badge && <span className="tag shrink-0">{o.badge}</span>}
            </span>
            {o.subtitle && (
              <span className={`mt-1 block text-2xs leading-snug ${active ? 'text-ink-300' : 'text-ink-500'}`}>
                {o.subtitle}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── блоки шага ─────────────── */

export function Section({ icon: Icon, title, desc, children, className = '' }) {
  return (
    <section className={`space-y-3.5 ${className}`}>
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-[-.01em] text-ink-100">
          {Icon && <Icon size={15} strokeWidth={STROKE} className="text-ink-400" />}
          {title}
        </h2>
        {desc && <p className="mt-1.5 max-w-[62ch] text-xs leading-relaxed text-ink-400">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export function Collapsible({ title, hint, children, defaultOpen = false, icon: Icon, tone = 'default' }) {
  const [open, setOpen] = useState(defaultOpen);
  const warn = tone === 'warn';
  return (
    <div className="border-t border-line-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-3.5 text-left"
      >
        <ChevronDown
          size={14}
          strokeWidth={STROKE}
          className={`shrink-0 text-ink-500 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
        />
        {Icon && <Icon size={14} strokeWidth={STROKE} className={warn ? 'text-amber' : 'text-ink-500'} />}
        <span className={`text-sm font-medium ${warn ? 'text-amber' : 'text-ink-200'}`}>{title}</span>
        {hint && <span className="ml-auto hidden max-w-[46%] truncate pl-3 text-2xs text-ink-500 sm:block">{hint}</span>}
      </button>
      {open && <div className="animate-fade space-y-3.5 pb-5">{children}</div>}
    </div>
  );
}

/* ─────────────── прогресс ─────────────── */

export function ProgressBar({ value, className = '' }) {
  return (
    <div
      className={`h-0.5 w-full overflow-hidden bg-line ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div
        className="h-full w-full origin-left bg-accent transition-transform duration-500 ease-out"
        style={{ transform: `scaleX(${Math.min(1, Math.max(0, value / 100))})` }}
      />
    </div>
  );
}

export function StepDots({ steps, index, maxReached, onJump }) {
  return (
    <ol className="flex flex-wrap items-center gap-1">
      {steps.map((s, i) => {
        const active = i === index;
        const reachable = i <= maxReached;
        return (
          <li key={s.id ?? i}>
            <button
              type="button"
              onClick={() => reachable && onJump(i)}
              disabled={!reachable}
              aria-current={active ? 'step' : undefined}
              aria-label={`Шаг ${i + 1}: ${s.short}`}
              className={`num rounded-[6px] px-2 py-1 text-2xs transition-colors ${
                active
                  ? 'bg-accent text-accent-ink'
                  : reachable
                    ? 'text-ink-400 hover:bg-hover hover:text-ink-200'
                    : 'text-ink-600'
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Компактная шкала оценки — вместо «монументальной» цифры */
export function Meter({ value, label }) {
  const color = value >= 90 ? 'bg-mint' : value >= 70 ? 'bg-accent' : value >= 50 ? 'bg-amber' : 'bg-rose';
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between text-xs text-ink-400">
          <span>{label}</span>
          <span className="num text-ink-200">{value}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
        <div
          className={`h-full w-full origin-left rounded-full ${color} transition-transform duration-500 ease-out`}
          style={{ transform: `scaleX(${value / 100})` }}
        />
      </div>
    </div>
  );
}

/* ─────────────── списки ─────────────── */

function IconBtn({ onClick, title, children, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-ink-400 transition-colors hover:bg-hover ${
        tone === 'danger' ? 'hover:border-rose/40 hover:text-rose' : 'hover:text-ink-100'
      }`}
    >
      {children}
    </button>
  );
}

export function StringList({ values = [], onChange, placeholder = 'Добавить пункт…', addLabel = 'Добавить', max = 40 }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || values.length >= max) return;
    onChange([...values, v]);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={`${v}-${i}`} className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1.5 pl-3 pr-1.5">
          <span className="idx w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
          <span className="min-w-0 flex-1 text-sm text-ink-100">{v}</span>
          <IconBtn tone="danger" title={`Убрать «${v}»`} onClick={() => onChange(values.filter((_, j) => j !== i))}>
            <Trash2 size={13} strokeWidth={STROKE} />
          </IconBtn>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn shrink-0" onClick={add} disabled={values.length >= max}>
          <Plus size={14} strokeWidth={STROKE} />
          <span className="hidden sm:inline">{addLabel}</span>
        </button>
      </div>
      {values.length >= max && <p className="hint">Больше {max} пунктов не имеет смысла.</p>}
    </div>
  );
}

export function ObjectList({ items = [], onChange, fields, blank, titleKey = 'name', addLabel = 'Добавить' }) {
  const update = (i, key, value) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: value } : it)));

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line-soft px-3 py-2">
            <span className="idx">{String(i + 1).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-300">
              {item[titleKey] || 'без названия'}
            </span>
            <IconBtn tone="danger" title="Удалить" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 size={13} strokeWidth={STROKE} />
            </IconBtn>
          </div>
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.type === 'area' || f.wide ? 'sm:col-span-2' : ''}>
                <span className="label">{f.label}</span>
                {f.type === 'area' ? (
                  <textarea
                    className="input textarea"
                    rows={2}
                    placeholder={f.placeholder}
                    value={item[f.key] ?? ''}
                    onChange={(e) => update(i, f.key, e.target.value)}
                  />
                ) : (
                  <input
                    className="input"
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={item[f.key] ?? ''}
                    onChange={(e) => update(i, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn w-full" onClick={() => onChange([...items, { ...blank }])}>
        <Plus size={14} strokeWidth={STROKE} /> {addLabel}
      </button>
    </div>
  );
}

/* ─────────────── метки и окна ─────────────── */

export function Badge({ tone = 'neutral', children, title }) {
  const tones = {
    neutral: 'border-line text-ink-400',
    accent: 'border-accent/40 text-accent',
    mint: 'border-mint/40 text-mint',
    amber: 'border-amber/40 text-amber',
    rose: 'border-rose/40 text-rose'
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[5px] border bg-surface px-1.5 py-0.5 text-2xs font-medium ${tones[tone]}`}
      title={title}
    >
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg' }) {
  const id = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`relative flex max-h-[92vh] w-full animate-rise flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift sm:rounded-2xl ${width}`}
      >
        <header className="flex items-center gap-3 border-b border-line-soft px-5 py-3.5">
          <h2 id={id} className="text-base font-semibold tracking-[-.01em] text-ink-100">
            {title}
          </h2>
          <button type="button" className="btn btn-sm btn-ghost ml-auto" onClick={onClose} aria-label="Закрыть">
            <X size={15} strokeWidth={STROKE} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-line-soft px-5 py-3.5">{footer}</footer>}
      </div>
    </div>
  );
}

/** Тонкое кольцо оценки: моноширинная цифра, без «монумента» */
export function ScoreRing({ value, size = 84, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone =
    value >= 90 ? 'var(--mint)' : value >= 70 ? 'var(--accent)' : value >= 50 ? 'var(--amber)' : 'var(--rose)';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`rgb(${tone})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,.68,.32,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="num text-xl font-medium text-ink-100">{value}</span>
      </div>
    </div>
  );
}
