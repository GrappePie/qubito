"use client";
import React, { useState } from 'react';
import TitlePage from '@/components/common/TitlePage';
import { type CategoryDTO } from '@/store/slices/categoriesApi';
import CategoryCreateForm from '@/components/categories/CategoryCreateForm';
import CategoriesTable from '@/components/categories/CategoriesTable';

export default function CategoriesPage() {
  // Maintain editing state here and pass callbacks downward.
  const [editing, setEditing] = useState<Record<string, Partial<CategoryDTO>>>({});

  const startEdit = (c: CategoryDTO) => {
    setEditing((prev) => ({ ...prev, [c._id]: { name: c.name, description: c.description, imageUrl: c.imageUrl, isActive: c.isActive } }));
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => { const cp = { ...prev }; delete cp[id]; return cp; });
  };

  const changeEdit = (id: string, data: Partial<CategoryDTO>) => {
    setEditing((prev) => ({ ...prev, [id]: data }));
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <TitlePage title="Categorías" subtitle="Administra tus categorías (crear, editar, eliminar)." />
        <div className="flex items-center gap-2">
          <CategoryCreateForm className="flex items-center" />
        </div>
      </div>
      <CategoriesTable
        editing={editing}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onChangeEdit={changeEdit}
      />
    </div>
  );
}
