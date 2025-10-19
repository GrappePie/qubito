"use client";
import { useAppDispatch } from "@/store/hooks";
import { addItem } from "@/store/slices/cartSlice";

interface ProductProps {
  id: string;
  title: string;
  price: number;
  image?: string;
}

const Product = ({ id, title, price, image }: ProductProps) => {
  const dispatch = useAppDispatch();
  const handleAdd = () => {
    dispatch(addItem({ id, title, price, image }));
  };
  return (
    <div onClick={handleAdd} className="h-40 border rounded-lg p-2 text-center cursor-pointer hover:shadow-md transition-shadow select-none">
      <img src={image || "https://placehold.co/150x150/add8e6/ffffff?text=" + encodeURIComponent(title)} alt={title}
           className="w-full h-24 object-cover rounded-md mx-auto" />
      <p className="text-sm font-semibold mt-2 truncate" title={title}>{title}</p>
      <p className="text-xs text-slate-500">${price.toFixed(2)}</p>
    </div>
  );
};

export default Product;