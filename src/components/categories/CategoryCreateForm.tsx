"use client";
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateCategoryMutation } from '@/store/slices/categoriesApi';

interface CategoryCreateFormProps {
  className?: string;
}

export default function CategoryCreateForm({ className }: CategoryCreateFormProps) {
  const [name, setName] = useState('');
  const [createCategory, { isLoading }] = useCreateCategoryMutation();

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createCategory({ name: trimmed }).unwrap();
      setName('');
      toast.success('Categoría creada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo crear');
    }
  };

  return (
    <div className={className}>      
      <input
        type="text"
        placeholder="Nueva categoría"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded-md px-3 py-2"
      />
      <button
        onClick={handleCreate}
        className="bg-sky-500 text-white px-3 py-2 rounded-md flex items-center ml-2 disabled:opacity-60"
        disabled={!name.trim() || isLoading}
      >
        <Plus size={18} className="mr-1" /> Crear
      </button>
    </div>
  );
}

