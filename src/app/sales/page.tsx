"use client";
import React, { useEffect, useState } from "react";
import { Search, Plus, Minus, X, ShoppingCart } from "lucide-react";

// Definimos la interfaz para los productos tal como se usa en tu inventario.
interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl: string;
    category: string;
}

// Interfaz para los elementos del carrito.
interface CartItem extends Product {
    quantity: number;
}

export default function SalesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Efecto para cargar los productos desde tu API.
    useEffect(() => {
        async function fetchProducts() {
            try {
                // Usamos una ruta similar a la de tu inventario, pero asumimos que necesitamos el precio.
                // Adaptaremos esto si la API real es diferente.
                const res = await fetch("/api/inventory/list");
                if (!res.ok) {
                    throw new Error("No se pudieron cargar los productos.");
                }
                const data: Product[] = await res.json();

                // Asignamos precios y URLs de imagen de ejemplo si no vienen en la API.
                const productsWithDetails = data.map(p => ({
                    ...p,
                    price: p.price || Math.floor(Math.random() * 20) + 5, // Precio aleatorio si no existe
                    imageUrl: p.imageUrl || `https://placehold.co/150x150/e2e8f0/475569?text=${encodeURIComponent(p.name)}`,
                    category: p.category || 'General' // Categoría por defecto
                }));

                setProducts(productsWithDetails);
                setFilteredProducts(productsWithDetails);

                // Extraemos las categorías de los productos para los filtros.
                const uniqueCategories = ["All", ...Array.from(new Set(productsWithDetails.map(p => p.category)))];
                setCategories(uniqueCategories);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Un error desconocido ocurrió.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, []);

    // Efecto para filtrar productos por categoría o término de búsqueda.
    useEffect(() => {
        let result = products;
        if (selectedCategory !== "All") {
            result = result.filter(p => p.category === selectedCategory);
        }
        if (searchTerm) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredProducts(result);
    }, [searchTerm, selectedCategory, products]);

    // Funciones para manejar el carrito
    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item._id === product._id);
            if (existingItem) {
                return prevCart.map(item =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, amount: number) => {
        setCart(prevCart => {
            return prevCart
                .map(item => {
                    if (item._id === productId) {
                        return { ...item, quantity: item.quantity + amount };
                    }
                    return item;
                })
                .filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item._id !== productId));
    };

    // Cálculo de totales
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    // Renderizado del componente
    if (isLoading) {
        return <div className="flex justify-center items-center h-full">Cargando productos...</div>;
    }
    if (error) {
        return <div className="flex justify-center items-center h-full text-red-500">{error}</div>;
    }

    return (
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-2rem)]">
            {/* Product Grid */}
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 p-4 bg-white h-full overflow-y-auto rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-slate-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div className="flex-shrink-0 overflow-x-auto pb-2">
                        <div className="flex items-center gap-2">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                        selectedCategory === category
                                            ? "bg-sky-500 text-white"
                                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div id="product-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredProducts.map(product => (
                        <div
                            key={product._id}
                            className="border rounded-lg p-2 text-center cursor-pointer hover:shadow-lg transition-shadow group"
                            onClick={() => addToCart(product)}
                        >
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-24 object-cover rounded-md mx-auto"
                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/150x150/e2e8f0/475569?text=Error')}
                            />
                            <p className="text-sm font-semibold mt-2 truncate group-hover:text-sky-600">{product.name}</p>
                            <p className="text-xs text-slate-500">${product.price.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart/Register */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 p-4 bg-slate-50 flex flex-col h-full rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><ShoppingCart className="mr-2"/> Venta Actual</h2>
                <div className="flex-1 overflow-y-auto -mr-4 pr-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-slate-500 pt-16">
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item._id} className="bg-white p-3 rounded-lg flex items-center shadow-sm">
                                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-4"/>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                                        <div className="flex items-center mt-1">
                                            <button className="text-slate-500 hover:text-slate-800 p-1" onClick={() => updateQuantity(item._id, -1)}><Minus size={16}/></button>
                                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                                            <button className="text-slate-500 hover:text-slate-800 p-1" onClick={() => updateQuantity(item._id, 1)}><Plus size={16}/></button>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-slate-700 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                                    <button className="ml-4 text-red-500 hover:text-red-700" onClick={() => removeFromCart(item._id)}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-600 mt-1"><span>Impuestos (16%)</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-xl text-slate-800 mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button className="w-full bg-slate-600 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors text-lg" onClick={() => setCart([])}>
                        Cancelar
                    </button>
                    <button
                        className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition-colors text-lg disabled:bg-slate-400"
                        disabled={cart.length === 0}
                    >
                        Pagar
                    </button>
                </div>
            </div>
        </div>
    );
}
