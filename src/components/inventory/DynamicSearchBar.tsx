'use client';
import React, { useState } from "react";

type Product = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
};

const mockProducts: Product[] = [
    {
        id: "123456",
        name: "Product A",
        price: 10.99,
        quantity: 5,
        image: "https://via.placeholder.com/40",
    },
    {
        id: "789012",
        name: "Product B",
        price: 5.49,
        quantity: 2,
        image: "https://via.placeholder.com/40",
    },
];

const DynamicSearchBar: React.FC = () => {
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<Product[]>(mockProducts);

    // Simulate barcode scanner by listening for Enter key
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const filtered = products.filter(
        (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.id.includes(query)
    );

    return (
        <div className="w-full flex flex-col items-center">
            <input
                type="text"
                className="w-2/3 h-10 px-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search or scan barcode..."
                value={query}
                onChange={handleInput}
                autoFocus
            />
            <div className="w-2/3 mt-2 bg-white rounded shadow">
                {filtered.map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center py-2 px-4 border-b last:border-b-0"
                    >
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded mr-4"
                        />
                        <div className="flex-1">
                            <div className="font-semibold">{product.name}</div>
                            <div className="text-sm text-gray-500">
                                ${product.price.toFixed(2)}
                            </div>
                        </div>
                        <div className="ml-4 text-sm">
                            <button
                                className="w-full bg-slate-600 text-white font-bold p-1 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                                Agregar
                            </button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="py-4 text-center text-gray-400">No products found</div>
                )}
            </div>
        </div>
    );
};

export default DynamicSearchBar;