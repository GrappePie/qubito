"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

// Interfaz para el componente TitlePage, ahora definido localmente
interface TitlePageProps  {
    title: string,
    subtitle?: string,
};

// Componente TitlePage, ahora definido localmente para evitar problemas de importación
const TitlePage = ({title,subtitle}:TitlePageProps) => {
    return (
        <div className={"p-4"}>
            <h1 className={"text-3xl font-bold text-slate-800"}>
                {title}
            </h1>
            {subtitle ? <p className={"text-slate-500 mt-1"}>{subtitle}</p> : null}
        </div>
    );
};


// Interfaz para el objeto de producto, alineada con el modelo de la base de datos
interface Product {
    _id?: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock: number;
    lowStock: number;
    categories: string[];
    imageUrl: string;
}

const emptyProduct: Product = {
    name: '',
    sku: '',
    price: 0,
    cost: 0,
    stock: 0,
    lowStock: 0,
    categories: [''],
    imageUrl: ''
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    // Función para obtener los productos de la API
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${window.location.origin}/api/products`);
            if (!res.ok) throw new Error('Error fetching products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Manejadores del modal de edición/creación
    const handleOpenModal = (product: Product | null) => {
        setCurrentProduct(product ? { ...product } : emptyProduct);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
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

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!currentProduct) return;
        const { name, value, type } = e.target;
        setCurrentProduct({
            ...currentProduct,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        });
    };

    // El campo de categoría en el formulario es un string, pero el modelo espera un array
    const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!currentProduct) return;
        setCurrentProduct({
            ...currentProduct,
            categories: [e.target.value]
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;

        // Agregar campos requeridos por el modelo backend si no existen
        const productToSend = {
            ...currentProduct,
            barCode: currentProduct.barCode || currentProduct.sku || '',
            description: (currentProduct as any).description || 'Sin descripción',
            owner: (currentProduct as any).owner || 'admin',
            supplier: (currentProduct as any).supplier || 'Sin proveedor',
            variants: (currentProduct as any).variants || [],
        };

        const url = currentProduct._id ? `${window.location.origin}/api/products/${currentProduct._id}` : `${window.location.origin}/api/products`;
        const method = currentProduct._id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productToSend)
            });

            if (res.ok) {
                handleCloseModal();
                await fetchProducts(); // Recargar productos
            } else {
                console.error("Error saving product");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!productToDelete?._id) return;
        try {
            const res = await fetch(`${window.location.origin}/api/products/${productToDelete._id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                handleCloseDeleteModal();
                await fetchProducts(); // Recargar productos
            } else {
                console.error("Error deleting product");
            }
        } catch (error) {
            console.error(error);
        }
    };

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
                                <img src={product.imageUrl || 'https://placehold.co/40x40/e2e8f0/475569?text=Img'} className="rounded-md mr-4 h-10 w-10 object-cover" alt={product.name} />
                                <div>
                                    <span className="font-medium text-slate-800">{product.name}</span>
                                    <p className="text-xs text-slate-500">{product.categories[0]}</p>
                                </div>
                            </td>
                            <td className="p-4 text-slate-500">{product.sku}</td>
                            <td className="p-4 text-slate-500">${product.price.toFixed(2)}</td>
                            <td className="p-4 text-slate-500">${product.cost.toFixed(2)}</td>
                            <td className="p-4 text-slate-500">{product.stock}</td>
                            <td className="p-4">
                                <button onClick={() => handleOpenModal(product)} className="text-sky-600 hover:text-sky-800 font-medium p-2"><Edit size={18} /></button>
                                <button onClick={() => handleOpenDeleteModal(product)} className="text-red-600 hover:text-red-800 font-medium ml-2 p-2"><Trash2 size={18} /></button>
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
                                    <label htmlFor="product-category" className="block text-sm font-medium text-slate-700">Categoría</label>
                                    <input type="text" id="product-category" name="category" value={currentProduct.categories[0] || ''} onChange={handleCategoryChange} required className="mt-1 block w-full" />
                                </div>
                                <div>
                                    <label htmlFor="product-sku" className="block text-sm font-medium text-slate-700">SKU</label>
                                    <input type="text" id="product-sku" name="sku" value={currentProduct.sku} onChange={handleChange} required className="mt-1 block w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="product-price" className="block text-sm font-medium text-slate-700">Precio</label>
                                        <input type="number" id="product-price" name="price" value={currentProduct.price} onChange={handleChange} required className="mt-1 block w-full" step="0.01" />
                                    </div>
                                    <div>
                                        <label htmlFor="product-cost" className="block text-sm font-medium text-slate-700">Costo</label>
                                        <input type="number" id="product-cost" name="cost" value={currentProduct.cost} onChange={handleChange} required className="mt-1 block w-full" step="0.01" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="product-stock" className="block text-sm font-medium text-slate-700">Stock</label>
                                        <input type="number" id="product-stock" name="stock" value={currentProduct.stock} onChange={handleChange} required className="mt-1 block w-full" />
                                    </div>
                                    <div>
                                        <label htmlFor="product-lowStock" className="block text-sm font-medium text-slate-700">Nivel Bajo Stock</label>
                                        <input type="number" id="product-lowStock" name="lowStock" value={currentProduct.lowStock} onChange={handleChange} required className="mt-1 block w-full" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="product-imageUrl" className="block text-sm font-medium text-slate-700">URL de la Imagen</label>
                                    <input type="text" id="product-imageUrl" name="imageUrl" value={currentProduct.imageUrl} onChange={handleChange} required className="mt-1 block w-full" />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-b-xl flex justify-end space-x-4">
                                <button type="button" onClick={handleCloseModal} className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="bg-sky-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-600">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Borrado */}
            {isDeleteModalOpen && productToDelete && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <h3 className="mt-4 text-lg font-medium text-slate-900">¿Eliminar Producto?</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                ¿Estás seguro de que quieres eliminar "{productToDelete.name}"? Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-center space-x-4">
                            <button onClick={handleCloseDeleteModal} className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleDelete} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
