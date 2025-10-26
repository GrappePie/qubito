"use client";
import React, { useMemo } from 'react';
import { useGetCategoriesQuery, CategoryDTO } from '@/store/slices/categoriesApi';
import CategoryRow, { EditableCategoryState } from './CategoryRow';

interface CategoriesTableProps {
  editing: Record<string, EditableCategoryState>;
  onStartEdit: (c: CategoryDTO) => void;
  onCancelEdit: (id: string) => void;
  onChangeEdit: (id: string, data: EditableCategoryState) => void;
}

export default function CategoriesTable({ editing, onStartEdit, onCancelEdit, onChangeEdit }: CategoriesTableProps) {
  const { data: categories = [], isLoading } = useGetCategoriesQuery();

  const sorted = useMemo(() => {
    return [...(categories as CategoryDTO[])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [categories]);

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-3 text-sm text-slate-600">Nombre</th>
            <th className="p-3 text-sm text-slate-600">Descripción</th>
            <th className="p-3 text-sm text-slate-600">Estado</th>
            <th className="p-3 text-sm text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {isLoading ? (
            <tr><td colSpan={4} className="text-center p-6 text-slate-500">Cargando...</td></tr>
          ) : sorted.map((c) => (
            <CategoryRow
              key={c._id}
              category={c}
              editState={editing[c._id]}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onChangeEdit={onChangeEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

