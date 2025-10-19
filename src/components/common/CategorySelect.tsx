"use client";
import React, { useMemo, useState, useId } from "react";

export interface CategorySelectProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAddOption?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowFreeText?: boolean; // si es false, solo permite valores que existan o que se hayan agregado explícitamente
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  label = "Categoría",
  value,
  options,
  onChange,
  onAddOption,
  placeholder = "Selecciona o escribe...",
  disabled,
  allowFreeText = false,
}) => {
  const id = useId();
  const [input, setInput] = useState<string>(value ?? "");

  const normalizedOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const opt of options || []) {
      const key = normalize(opt);
      if (!key) continue;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(opt);
      }
    }
    return out.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [options]);

  const exists = useMemo(() => {
    const key = normalize(input);
    return key.length > 0 && normalizedOptions.some((o) => normalize(o) === key);
  }, [input, normalizedOptions]);

  const canAdd = !disabled && normalize(input).length > 0 && !exists;

  const handleSelect = (val: string) => {
    setInput(val);
    onChange(val);
  };

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (exists) return; // ya existe (case-insensitive)
    onAddOption?.(trimmed);
    handleSelect(trimmed);
  };

  const suggestions = useMemo(() => {
    const key = normalize(input);
    if (!key) return normalizedOptions.slice(0, 10);
    return normalizedOptions
      .filter((o) => normalize(o).includes(key))
      .slice(0, 10);
  }, [input, normalizedOptions]);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="mt-1 flex gap-2 items-stretch">
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              setInput(val);
              if (allowFreeText) onChange(val);
            }}
            onBlur={() => {
              // si no se permite texto libre, al salir solo aceptamos valores existentes
              if (!allowFreeText) {
                const key = normalize(input);
                const match = normalizedOptions.find((o) => normalize(o) === key);
                if (match) onChange(match);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            autoComplete="off"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls={id + "-list"}
          />
          {/* Dropdown */}
          {suggestions.length > 0 && (
            <ul
              id={id + "-list"}
              className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-auto"
              role="listbox"
            >
              {suggestions.map((opt) => (
                <li
                  key={opt}
                  role="option"
                  aria-selected={normalize(opt) === normalize(value)}
                  className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-sm"
                  onMouseDown={(e) => {
                    // prevenir blur del input antes de onClick
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                >
                  {opt}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium ${
            canAdd
              ? "bg-sky-500 border-sky-500 text-white hover:bg-sky-600"
              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
          }`}
          title={canAdd ? "Agregar categoría" : exists ? "Ya existe" : "Escribe una categoría"}
        >
          Agregar
        </button>
      </div>
      {!allowFreeText && normalize(value).length > 0 && !normalizedOptions.some((o) => normalize(o) === normalize(value)) && (
        <p className="mt-1 text-xs text-amber-600">Esta categoría no existe aún. Usa el botón &quot;Agregar&quot; para registrarla antes de guardar.</p>
      )}
    </div>
  );
};

export default CategorySelect;
