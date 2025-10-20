"use client";

import React from "react";

export interface CategoryChipOption {
  id: string;
  name: string;
}

interface CategoryChipsContainerProps {
  categories: CategoryChipOption[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
}

const CategoryChipsContainer: React.FC<CategoryChipsContainerProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
}) => {
  return (
    <div className={"w-full relative h-12 px-2 py-1"}>
      <div className={"w-full min-w-0 h-full flex flex-nowrap px-4 overflow-x-auto overflow-y-hidden gap-2"}>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2 h-8 max-w-32 flex-shrink-0 px-3 py-1 rounded-full border transition-colors text-base tracking-[0] mr-1 overflow-hidden text-ellipsis whitespace-nowrap
            ${selectedCategoryId == null
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-800 border-[color:var(--gm3-sys-color-outline-variant,#c4c7c5)] hover:bg-slate-100'}
          `}
          aria-pressed={selectedCategoryId == null}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(selectedCategoryId === cat.id ? null : cat.id)}
            className={`flex items-center gap-2 h-8 max-w-32 flex-shrink-0 px-3 py-1 rounded-full border transition-colors text-base tracking-[0] mr-1 overflow-hidden text-ellipsis whitespace-nowrap
              ${selectedCategoryId === cat.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-800 border-[color:var(--gm3-sys-color-outline-variant,#c4c7c5)] hover:bg-slate-100'}
            `}
            aria-pressed={selectedCategoryId === cat.id}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryChipsContainer;
