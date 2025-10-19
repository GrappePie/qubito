"use client";
import React, { useMemo, useState } from "react";
import { useGetProductsQuery, type ProductDTO } from "@/store/slices/productsApi";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

const DynamicSearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const { data: items = [], isLoading } = useGetProductsQuery();

  const products: Product[] = useMemo(() => {
    const list = (items as ProductDTO[]).filter((p) => Boolean(p._id));
    return list.map((p) => ({
      id: (p._id as string) ?? p.sku ?? "",
      name: p.name,
      price: typeof p.price === "number" ? p.price : 0,
      quantity: Number(p.stock ?? 0),
      image: p.imageUrl || "https://via.placeholder.com/40",
    }));
  }, [items]);

  // Simulate barcode scanner by listening for Enter key
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.includes(query)
  );

  return (
    <div className="w-full flex flex-col items-center">
      <input
        type="text"
        className="w-2/3 h-10 px-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={isLoading ? "Cargando productos..." : "Search or scan barcode..."}
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
            <Image
              src={product.image}
              alt={product.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded mr-4"
              unoptimized
            />
            <div className="flex-1">
              <div className="font-semibold">{product.name}</div>
              <div className="text-sm text-gray-500">
                ${product.price.toFixed(2)}
              </div>
            </div>
            <div className="ml-4 text-sm">
              <button className="w-full bg-slate-600 text-white font-bold p-1 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                Agregar
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-4 text-center text-gray-400">
            {isLoading ? "Cargando..." : "No products found"}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicSearchBar;
