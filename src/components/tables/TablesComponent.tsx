"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTable, selectSubtotalForTable, startQuickOrder } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import {useAccounts} from "@/contexts/AccountsContext";
import {useGetOrdersQuery} from "@/store/slices/ordersApi";

interface TableProps {
    number: number;
}

const Table = ({ number }: TableProps) => {
    const subtotal = useAppSelector(selectSubtotalForTable(number));
    const dispatch = useAppDispatch();
    const router = useRouter();
    const occupied = subtotal > 0;
    const handleClick = () => {
        dispatch(setActiveTable(number));
        router.push('/sale');
    };
    return (
        <button onClick={handleClick}
                className={`rounded-lg p-4 text-white text-center cursor-pointer ${occupied ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600'} transition-colors flex flex-col justify-between w-full`}
                aria-label={`Mesa ${number} ${occupied ? 'ocupada' : 'disponible'}`}>
            <div className="font-bold text-lg">Mesa {number}</div>
            <div className="text-sm">{occupied ? "$" + subtotal.toFixed(2) : 'Disponible'}</div>
        </button>
    );
};

const TablesComponent = () => {
    const { account, availablePermissions, refresh, hasPermission } = useAccounts();
    const {data} = useGetOrdersQuery();
    const tableQuantity = account?.settings?.tableQuantity;
    const dispatch = useAppDispatch();
    const router = useRouter();
    const quickSubtotal = useAppSelector(selectSubtotalForTable('standalone'));
    const quickOccupied = quickSubtotal > 0;
    const handleQuick = () => { dispatch(startQuickOrder()); router.push('/sale'); };
    console.log("Orders LOKAS",data);
    return (
        <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 my-6 mx-4"}>
            <button onClick={handleQuick}
                    className={`rounded-lg p-4 text-white text-center cursor-pointer ${quickOccupied ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} transition-colors flex flex-col justify-between w-full`}
                    aria-label={`Orden rápida ${quickOccupied ? 'en curso' : 'nueva'}`}>
                <div className="font-bold text-lg">Orden Rápida</div>
                <div className="text-sm">{quickOccupied ? "$" + quickSubtotal.toFixed(2) : 'Nueva'}</div>
            </button>
          {Array.from({ length: tableQuantity ?? 0 }, (_, index) => (
              <Table key={index + 1} number={index + 1} />
          ))}
        </div>
    );
};

export default TablesComponent;