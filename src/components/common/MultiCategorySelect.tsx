"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface MultiCategorySelectProps {
  label?: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  onAddOption?: (value: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function MultiCategorySelect({
  label = 'Categorías',
  values,
  options,
  onChange,
  onAddOption,
  placeholder = 'Escribe para buscar o agregar...',
  disabled,
}: MultiCategorySelectProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const normalizedOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const opt of options || []) {
      const key = normalize(opt);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(opt);
    }
    return out.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [options]);

  const selectedKeys = useMemo(() => new Set(values.map((v) => normalize(v))), [values]);

  const suggestions = useMemo(() => {
    const key = normalize(input);
    const base = key
      ? normalizedOptions.filter((o) => normalize(o).includes(key))
      : normalizedOptions;
    return base.filter((o) => !selectedKeys.has(normalize(o))).slice(0, 10);
  }, [input, normalizedOptions, selectedKeys]);

  function addValue(v: string) {
    const key = normalize(v);
    if (!key) return;
    if (selectedKeys.has(key)) return;
    onChange([...values, v.trim()]);
    setInput('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeValue(v: string) {
    const key = normalize(v);
    onChange(values.filter((x) => normalize(x) !== key));
  }

  async function handleAddNew() {
    const val = input.trim();
    if (!val) return;
    // si ya existe en opciones o seleccionado, solo agrégalo a seleccionados
    const key = normalize(val);
    const existsInOptions = normalizedOptions.some((o) => normalize(o) === key);
    if (!existsInOptions && onAddOption) {
      await onAddOption(val);
    }
    addValue(val);
  }

  useEffect(() => {
    setOpen(suggestions.length > 0 && document.activeElement === inputRef.current);
  }, [suggestions.length]);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="mt-1 border border-slate-300 rounded-md px-2 py-2 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500">
        <div className="flex flex-wrap gap-2">
          {values.map((val) => (
            <span key={val} className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs">
              {val}
              <button type="button" className="text-sky-700 hover:text-sky-900" onClick={() => removeValue(val)} aria-label={`Quitar ${val}`}>×</button>
            </span>
          ))}
          <input
            id={id}
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                await handleAddNew();
              } else if (e.key === 'Backspace' && !input && values.length > 0) {
                // borrar último chip
                removeValue(values[values.length - 1]);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-w-[10ch] outline-none text-sm py-1"
            autoComplete="off"
          />
        </div>
        {open && suggestions.length > 0 && (
          <ul className="mt-2 max-h-56 overflow-auto bg-white border border-slate-200 rounded-md shadow-lg" role="listbox">
            {suggestions.map((opt) => (
              <li
                key={opt}
                className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addValue(opt);
                }}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
      {input.trim() && !normalizedOptions.some((o) => normalize(o) === normalize(input)) && (
        <div className="mt-1">
          <button type="button" onClick={handleAddNew} disabled={disabled} className="text-sm text-sky-700 hover:text-sky-900">
            Agregar &quot;{input}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
