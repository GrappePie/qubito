"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItem, selectCartItems } from "@/store/slices/cartSlice";
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ProductProps {
  id: string;
  title: string;
  price: number;
  sku?: string;
  image?: string;
  stock?: number;
}

const Product = ({ id, title, price, sku, image, stock }: ProductProps) => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const current = items.find(i => i.id === id);
  const currentQty = current?.quantity ?? 0;
  const max = typeof stock === 'number' ? stock : Infinity;

  const handleAdd = () => {
    if (currentQty >= max) {
      toast.error('No hay más stock disponible para este producto');
      return;
    }
    dispatch(addItem({ id, title, price, image, stock, sku }));
  };

  const outOfStock = max <= 0;

  return (
    <div
      onClick={outOfStock ? undefined : handleAdd}
      className={`h-44 border rounded-lg p-2 text-center ${outOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} transition-shadow select-none`}
      title={outOfStock ? 'Sin stock' : 'Agregar al carrito'}
    >
      <Image
        src={image || ("https://placehold.co/150x150/add8e6/ffffff?text=" + encodeURIComponent(title))}
        alt={title}
        width={150}
        height={96}
        className="w-full h-24 object-cover rounded-md mx-auto"
        unoptimized
      />
      <p className="text-sm font-semibold mt-2 truncate" title={title}>{title}</p>
      <p className="text-xs text-slate-500">${price.toFixed(2)}</p>
      {Number.isFinite(max) && (
        <p className="text-[11px] text-slate-500 mt-0.5">Stock: {Math.max(0, max - currentQty)} disp.</p>
      )}
    </div>
  );
};

export default Product;
