"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeItem, updateQuantity, selectCartItems } from "@/store/slices/cartSlice";
import { toast } from 'react-hot-toast';

interface CartItemRowProps { id: string; title: string; price: number; quantity: number; }

const CartItemRow = ({ id, title, price, quantity }: CartItemRowProps) => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const item = items.find(i => i.id === id);
  const stock = item?.stock;
  const atMax = typeof stock === 'number' ? quantity >= stock : false;

  const inc = () => {
    if (atMax) {
      toast.error('Cantidad máxima según stock');
      return;
    }
    dispatch(updateQuantity({ id, delta: 1 }));
  };
  const dec = () => dispatch(updateQuantity({ id, delta: -1 }));
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Number(e.target.value) || 1);
    const clamped = typeof stock === 'number' ? Math.min(val, stock) : val;
    if (clamped !== val) toast.error('No puedes exceder el stock disponible');
    dispatch(updateQuantity({ id, quantity: clamped }));
  };

  return (
    <div className="bg-white p-2 rounded-lg flex items-center shadow-sm">
      <div className="flex-1">
        <p className="font-semibold text-slate-800 truncate" title={title}>{title}</p>
        <div className="flex items-center mt-1 select-none">
          <button className="text-slate-500 hover:text-slate-800 px-2" onClick={dec}>-</button>
          <input
            type="number"
            value={quantity}
            className="w-12 text-center mx-1 border rounded text-sm"
            onChange={onChange}
            min={1}
            {...(typeof stock === 'number' ? { max: stock } : {})}
          />
          <button className="text-slate-500 hover:text-slate-800 px-2 disabled:opacity-40" onClick={inc} disabled={atMax}>+</button>
        </div>
        {typeof stock === 'number' && (
          <p className="text-[11px] text-slate-500 mt-0.5">Disponible: {Math.max(0, stock - quantity)}</p>
        )}
      </div>
      <p className="font-semibold text-slate-700 whitespace-nowrap ml-2">${(price * quantity).toFixed(2)}</p>
      <button className="ml-4 text-red-500 hover:text-red-700" onClick={() => dispatch(removeItem(id))} title="Eliminar del carrito">
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
    </div>
  );
};

export default CartItemRow;
