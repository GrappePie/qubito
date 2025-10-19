import React from "react";

interface CategoryChipsContainerProps {
  categories: string[];
  selectedCategory: number | null;
  setSelectedCategory: (index: number) => void;
}

const CategoryChipsContainer: React.FC<CategoryChipsContainerProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <div className={"w-full relative h-12 px-2 py-1"}>
      <div className={"w-full min-w-0 h-full flex flex-nowrap px-4 overflow-x-auto overflow-y-hidden gap-2"}>
        {categories.map((cat, index) => (
          <button
            key={index}
            onClick={() => setSelectedCategory(index)}
            className={`flex items-center gap-2 h-8 max-w-32 flex-shrink-0 px-3 py-1 rounded-full border transition-colors text-base tracking-[0] mr-1 overflow-hidden text-ellipsis whitespace-nowrap
              ${selectedCategory === index
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-800 border-[color:var(--gm3-sys-color-outline-variant,#c4c7c5)] hover:bg-slate-100'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryChipsContainer;

