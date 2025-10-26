"use client";
import React from 'react';
import { Save, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUpdateCategoryMutation, useDeleteCategoryMutation, CategoryDTO } from '@/store/slices/categoriesApi';

export type EditableCategoryState = Partial<CategoryDTO>

interface CategoryRowProps {
  category: CategoryDTO;
  editState?: EditableCategoryState;
  onChangeEdit: (id: string, data: EditableCategoryState) => void;
  onStartEdit: (c: CategoryDTO) => void;
  onCancelEdit: (id: string) => void;
}

export default function CategoryRow({ category, editState, onChangeEdit, onStartEdit, onCancelEdit }: CategoryRowProps) {
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const saveEdit = async () => {
    if (!editState) return;
    try {
      await updateCategory({ id: category._id, data: { name: editState.name, description: editState.description, imageUrl: editState.imageUrl, isActive: editState.isActive } }).unwrap();
      onCancelEdit(category._id);
      toast.success('Categoría actualizada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar');
    }
  };

  const remove = async () => {
    try {
      await deleteCategory(category._id).unwrap();
      toast.success('Categoría eliminada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar');
    }
  };

  if (editState) {
    return (
      <tr key={category._id}>
        <td className="p-3">
          <input
            className="border rounded-md px-2 py-1 w-full"
            value={editState.name ?? ''}
            onChange={(e) => onChangeEdit(category._id, { ...editState, name: e.target.value })}
          />
        </td>
        <td className="p-3">
          <input
            className="border rounded-md px-2 py-1 w-full"
            value={editState.description ?? ''}
            onChange={(e) => onChangeEdit(category._id, { ...editState, description: e.target.value })}
          />
        </td>
        <td className="p-3">
          <select
            className="border rounded-md px-2 py-1"
            value={String(editState.isActive ?? true)}
            onChange={(e) => onChangeEdit(category._id, { ...editState, isActive: e.target.value === 'true' })}
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        </td>
        <td className="p-3">
          <div className="flex gap-2">
            <button onClick={saveEdit} className="text-green-600 hover:text-green-800 flex items-center"><Save size={16} className="mr-1"/>Guardar</button>
            <button onClick={() => onCancelEdit(category._id)} className="text-slate-600 hover:text-slate-800 flex items-center"><X size={16} className="mr-1"/>Cancelar</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr key={category._id}>
      <td className="p-3">
        <span className="font-medium text-slate-800">{category.name}</span>
      </td>
      <td className="p-3">
        <span className="text-slate-600">{category.description}</span>
      </td>
      <td className="p-3">
        <span className={`px-2 py-1 rounded-full text-xs ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{category.isActive ? 'Activa' : 'Inactiva'}</span>
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <button onClick={() => onStartEdit(category)} className="text-sky-600 hover:text-sky-800 flex items-center"><Edit2 size={16} className="mr-1"/>Editar</button>
          <button onClick={remove} className="text-red-600 hover:text-red-800 flex items-center" disabled={isDeleting}><Trash2 size={16} className="mr-1"/>Eliminar</button>
        </div>
      </td>
    </tr>
  );
}

