"use client";

import React, { useState, FormEvent, ChangeEvent, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
    useGetProductsQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    type ProductDTO,
    type UpsertProductPayload,
} from '@/store/slices/productsApi';
import TitlePage from '@/components/common/TitlePage';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import MultiCategorySelect from '@/components/common/MultiCategorySelect';
import { useGetCategoriesQuery, useCreateCategoryMutation, type CategoryDTO } from '@/store/slices/categoriesApi';

// Tipo alineado con backend (Mongoose usa _id)
type Product = ProductDTO;

const emptyProduct: Product = {
    name: '',
    sku: '',
    price: 0,
    cost: 0,
    stock: 0,
    lowStock: 0,
    categories: [''],
    imageUrl: '',
    // Campos adicionales opcionales que el backend espera
    barCode: '',
    description: 'Sin descripción',
    owner: 'admin',
    supplier: 'Sin proveedor',
    variants: [],
};

export default function ProductsPage() {
    // Data desde RTK Query
    const { data: products = [], isLoading, isFetching } = useGetProductsQuery();
    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
    const { data: categories = [] } = useGetCategoriesQuery();
    const [createCategory] = useCreateCategoryMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    // Categorías únicas derivadas de los productos existentes
    const existingCategories = useMemo(() => {
        const fromProducts = new Map<string, string>();
        for (const p of products) {
            const cat = p.categories?.[0];
            if (typeof cat === 'string') {
                const key = cat.trim().toLowerCase();
                if (key && !fromProducts.has(key)) fromProducts.set(key, cat);
            }
        }
        const fromApi = new Map<string, string>();
        for (const c of (categories as CategoryDTO[])) {
            const key = c.name.trim().toLowerCase();
            if (key && c.isActive && !fromApi.has(key)) fromApi.set(key, c.name);
        }
        // priorizar nombres tal cual en API, luego los de productos
        const map = new Map<string, string>([...fromProducts, ...fromApi]);
        return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    }, [products, categories]);

    // Categorías nuevas agregadas en el modal actual (no persistentes hasta guardar algún producto)
    const [extraCategories, setExtraCategories] = useState<string[]>([]);

    // Manejadores del modal de edición/creación
    const handleOpenModal = (product: Product | null) => {
        setCurrentProduct(product ? { ...product } : { ...emptyProduct });
        setExtraCategories([]); // limpiar categorías añadidas locales al abrir
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setExtraCategories([]);
    };

    // Manejadores del modal de confirmación de borrado
    const handleOpenDeleteModal = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentProduct) return;
        const { name, value } = e.target;
        const numericFields = new Set(['price', 'cost', 'stock', 'lowStock']);
        setCurrentProduct({
            ...currentProduct,
            [name]: numericFields.has(name) ? (parseFloat(value as string) || 0) : value
        });
    };

    // Agregar categoría a la lista local para sugerencias (crear en API y seleccionar)
    const handleAddCategoryOption = async (val: string) => {
        const key = val.trim().toLowerCase();
        if (!key) return;
        const exists = existingCategories.some((c) => c.trim().toLowerCase() === key) ||
            extraCategories.some((c) => c.trim().toLowerCase() === key);
        if (exists) {
            // si ya existe, solo añádela a seleccionadas (si no estaba)
            if (currentProduct && !currentProduct.categories?.some(c => c.trim().toLowerCase() === key)) {
                setCurrentProduct({ ...currentProduct, categories: [...(currentProduct.categories || []), val] });
            }
            return;
        }
        try {
            const created = await createCategory({ name: val }).unwrap();
            setExtraCategories((prev) => [...prev, created.name]);
            if (currentProduct) {
                setCurrentProduct({ ...currentProduct, categories: [...(currentProduct.categories || []), created.name] });
            }
            toast.success('Categoría agregada');
        } catch (e) {
            console.error('No se pudo crear la categoría', e);
            toast.error('No se pudo crear la categoría');
        }
    };

    // Actualiza la selección completa de categorías (chips)
    const handleCategoriesChange = (vals: string[]) => {
        if (!currentProduct) return;
        setCurrentProduct({ ...currentProduct, categories: vals });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;

        const payload: UpsertProductPayload = {
            ...currentProduct,
            barCode: currentProduct.barCode ?? currentProduct.sku ?? '',
            description: currentProduct.description ?? 'Sin descripción',
            owner: currentProduct.owner ?? 'admin',
            supplier: currentProduct.supplier ?? 'Sin proveedor',
            variants: currentProduct.variants ?? [],
        };

        try {
            if (currentProduct._id) {
                await updateProduct({ id: currentProduct._id, data: payload }).unwrap();
                toast.success('Producto actualizado');
            } else {
                await createProduct(payload).unwrap();
                toast.success('Producto creado');
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error al guardar el producto', error);
            toast.error('No se pudo guardar el producto');
        }
    };

    const handleDelete = async () => {
        if (!productToDelete?._id) return;
        try {
            await deleteProduct(productToDelete._id).unwrap();
            toast.success('Producto eliminado');
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Error al eliminar el producto', error);
            toast.error('No se pudo eliminar el producto');
        }
    };

    const isBusy = isLoading || isFetching || isCreating || isUpdating || isDeleting;

    // Opciones de categorías combinando existentes + añadidas en el modal
    const categoryOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of existingCategories) {
            const k = c.trim().toLowerCase();
            if (k) map.set(k, c);
        }
        for (const c of extraCategories) {
            const k = c.trim().toLowerCase();
            if (k && !map.has(k)) map.set(k, c);
        }
        return Array.from(map.values());
    }, [existingCategories, extraCategories]);

    // const currentCategory = currentProduct?.categories?.[0] ?? '';

    return (
        <div>
            <div className="flex justify-between items-center">
                <TitlePage title="Productos" subtitle="Gestiona tu catálogo de productos." />
                <button
                    onClick={() => handleOpenModal(null)}
                    className="bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center"
                >
                    <Plus size={20} className="mr-2" />
                    Agregar Producto
                </button>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-slate-600">Producto</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">SKU</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Precio</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Costo</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Stock</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                    {isLoading ? (
                        <tr><td colSpan={6} className="text-center p-8 text-slate-500">Cargando...</td></tr>
                    ) : products.map(product => (
                        <tr key={product._id}>
                            <td className="p-4 flex items-center">
                                {/* Imagen del producto */}
                                <Image
                                    src={product.imageUrl || 'https://placehold.co/40x40/e2e8f0/475569?text=Img'}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="rounded-md mr-4 h-10 w-10 object-cover"
                                    unoptimized
                                />
                                <div>
                                    <span className="font-medium text-slate-800">{product.name}</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(product.categories && product.categories.length > 0) ? (
                                            product.categories.map((cat) => (
                                                <span key={cat} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] border border-slate-200">{cat}</span>
                                            ))
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] border border-slate-200">General</span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-slate-500">{product.sku}</td>
                            <td className="p-4 text-slate-500">${product.price.toFixed(2)}</td>
                            <td className="p-4 text-slate-500">${product.cost.toFixed(2)}</td>
                            <td className="p-4 text-slate-500">{product.stock}</td>
                            <td className="p-4">
                                <button onClick={() => handleOpenModal(product)} className="text-sky-600 hover:text-sky-800 font-medium p-2" disabled={isBusy}><Edit size={18} /></button>
                                <button onClick={() => handleOpenDeleteModal(product)} className="text-red-600 hover:text-red-800 font-medium ml-2 p-2" disabled={isBusy}><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Modal para Agregar/Editar Producto */}
            {isModalOpen && currentProduct && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">{currentProduct._id ? 'Editar Producto' : 'Agregar Producto'}</h2>
                                <button type="button" onClick={handleCloseModal} className="text-slate-500 hover:text-slate-800">&times;</button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label htmlFor="product-name" className="block text-sm font-medium text-slate-700">Nombre</label>
                                    <input type="text" id="product-name" name="name" value={currentProduct.name} onChange={handleChange} required className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <MultiCategorySelect
                                        label="Categorías"
                                        values={currentProduct?.categories || []}
                                        options={categoryOptions}
                                        onChange={handleCategoriesChange}
                                        onAddOption={handleAddCategoryOption}
                                        placeholder="Selecciona o agrega categorías"
                                        disabled={isBusy}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="product-sku" className="block text-sm font-medium text-slate-700">SKU</label>
                                    <input type="text" id="product-sku" name="sku" value={currentProduct.sku} onChange={handleChange} required className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-price" className="block text-sm font-medium text-slate-700">Precio</label>
                                    <input type="number" id="product-price" name="price" value={currentProduct.price} onChange={handleChange} required className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-cost" className="block text-sm font-medium text-slate-700">Costo</label>
                                    <input type="number" id="product-cost" name="cost" value={currentProduct.cost} onChange={handleChange} required className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-stock" className="block text-sm font-medium text-slate-700">Stock</label>
                                    <input type="number" id="product-stock" name="stock" value={currentProduct.stock} onChange={handleChange} required className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-image" className="block text-sm font-medium text-slate-700">Imagen URL</label>
                                    <input type="text" id="product-image" name="imageUrl" value={currentProduct.imageUrl} onChange={handleChange} className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-barcode" className="block text-sm font-medium text-slate-700">Código de Barras</label>
                                    <input type="text" id="product-barcode" name="barCode" value={currentProduct.barCode} onChange={handleChange} className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-description" className="block text-sm font-medium text-slate-700">Descripción</label>
                                    <textarea id="product-description" name="description" value={currentProduct.description} onChange={handleChange} className="mt-1 block w-full resize-none h-20" />
                                </div>
                                <div>
                                    <label htmlFor="product-owner" className="block text-sm font-medium text-slate-700">Propietario</label>
                                    <input type="text" id="product-owner" name="owner" value={currentProduct.owner} onChange={handleChange} className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-supplier" className="block text-sm font-medium text-slate-700">Proveedor</label>
                                    <input type="text" id="product-supplier" name="supplier" value={currentProduct.supplier} onChange={handleChange} className="mt-1 block w-full" />
                                </div>
                            </div>
                            <div className="p-6 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center"
                                    disabled={isBusy}
                                >
                                    {isBusy ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Borrado */}
            {isDeleteModalOpen && productToDelete && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-800">Eliminar Producto</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 mb-4">
                                ¿Estás seguro de que deseas eliminar el producto <span className="font-semibold">{productToDelete.name}</span>? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={handleCloseDeleteModal}
                                    className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    disabled={isBusy}
                                >
                                    {isBusy ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
