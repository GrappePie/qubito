"use client";
import React, { useMemo, useState } from 'react';
import TitlePage from '@/components/common/TitlePage';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type CategoryDTO,
} from '@/store/slices/categoriesApi';
import { toast } from 'react-hot-toast';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Record<string, Partial<CategoryDTO>>>({});

  const sorted = useMemo(() => {
    return [...(categories as CategoryDTO[])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [categories]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createCategory({ name }).unwrap();
      setNewName('');
      toast.success('Categoría creada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo crear');
    }
  };

  const startEdit = (c: CategoryDTO) => {
    setEditing((prev) => ({ ...prev, [c._id]: { name: c.name, description: c.description, imageUrl: c.imageUrl, isActive: c.isActive } }));
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => { const cp = { ...prev }; delete cp[id]; return cp; });
  };

  const saveEdit = async (id: string) => {
    const data = editing[id];
    if (!data) return;
    try {
      await updateCategory({ id, data: { name: data.name, description: data.description, imageUrl: data.imageUrl, isActive: data.isActive } }).unwrap();
      cancelEdit(id);
      toast.success('Categoría actualizada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
      toast.success('Categoría eliminada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <TitlePage title="Categorías" subtitle="Administra tus categorías (crear, editar, eliminar)." />
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nueva categoría"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border rounded-md px-3 py-2"
          />
          <button onClick={handleCreate} className="bg-sky-500 text-white px-3 py-2 rounded-md flex items-center" disabled={!newName.trim() || isCreating}>
            <Plus size={18} className="mr-1" /> Crear
          </button>
        </div>
      </div>

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
            ) : sorted.map((c) => {
              const edit = editing[c._id];
              return (
                <tr key={c._id}>
                  <td className="p-3">
                    {edit ? (
                      <input className="border rounded-md px-2 py-1 w-full" value={edit.name ?? ''} onChange={(e) => setEditing((prev) => ({ ...prev, [c._id]: { ...edit, name: e.target.value } }))} />
                    ) : (
                      <span className="font-medium text-slate-800">{c.name}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {edit ? (
                      <input className="border rounded-md px-2 py-1 w-full" value={edit.description ?? ''} onChange={(e) => setEditing((prev) => ({ ...prev, [c._id]: { ...edit, description: e.target.value } }))} />
                    ) : (
                      <span className="text-slate-600">{c.description}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {edit ? (
                      <select className="border rounded-md px-2 py-1" value={String(edit.isActive ?? true)} onChange={(e) => setEditing((prev) => ({ ...prev, [c._id]: { ...edit, isActive: e.target.value === 'true' } }))}>
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{c.isActive ? 'Activa' : 'Inactiva'}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {edit ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(c._id)} className="text-green-600 hover:text-green-800 flex items-center"><Save size={16} className="mr-1"/>Guardar</button>
                        <button onClick={() => cancelEdit(c._id)} className="text-slate-600 hover:text-slate-800 flex items-center"><X size={16} className="mr-1"/>Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(c)} className="text-sky-600 hover:text-sky-800 flex items-center"><Edit2 size={16} className="mr-1"/>Editar</button>
                        <button onClick={() => remove(c._id)} className="text-red-600 hover:text-red-800 flex items-center" disabled={isDeleting}><Trash2 size={16} className="mr-1"/>Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
