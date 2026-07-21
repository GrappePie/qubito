"use client";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTable, selectSubtotalForTable, startQuickOrder, hydrateFromOrders } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useGetOrdersQuery } from "@/store/slices/ordersApi";
import { useGetTablesQuery, type RestaurantTableDTO } from "@/store/slices/tablesApi";

interface TableProps {
    table: RestaurantTableDTO;
}

const Table = ({ table }: TableProps) => {
    const subtotal = useAppSelector(selectSubtotalForTable(table.tableId));
    const dispatch = useAppDispatch();
    const router = useRouter();
    const occupied = subtotal > 0;
    const handleClick = () => {
        dispatch(setActiveTable({ id: table.tableId, name: table.name, number: table.legacyNumber ?? null }));
        router.push('/sale');
    };
    return (
        <button onClick={handleClick}
                className={`rounded-lg p-4 text-white text-center cursor-pointer ${occupied ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600'} transition-colors flex flex-col justify-between w-full`}
                aria-label={`${table.name} ${occupied ? 'ocupada' : 'disponible'}`}>
            <div className="font-bold text-lg">{table.name}</div>
            <div className="text-sm">{occupied ? "$" + subtotal.toFixed(2) : 'Disponible'}</div>
        </button>
    );
};

const TablesComponent = () => {
    const { data } = useGetOrdersQuery();
    const { data: tables = [], isLoading: tablesLoading, isError: tablesError } = useGetTablesQuery();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const quickSubtotal = useAppSelector(selectSubtotalForTable('standalone'));
    const quickOccupied = quickSubtotal > 0;
    const handleQuick = () => { dispatch(startQuickOrder()); router.push('/sale'); };

    useEffect(() => {
        if (data && data.length > 0) {
            dispatch(hydrateFromOrders(data));
        }
    }, [data, dispatch]);

    return (
        <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 my-6 mx-4"}>
            <button onClick={handleQuick}
                    className={`rounded-lg p-4 text-white text-center cursor-pointer ${quickOccupied ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} transition-colors flex flex-col justify-between w-full`}
                    aria-label={`Orden rápida ${quickOccupied ? 'en curso' : 'nueva'}`}>
                <div className="font-bold text-lg">Orden Rápida</div>
                <div className="text-sm">{quickOccupied ? "$" + quickSubtotal.toFixed(2) : 'Nueva'}</div>
            </button>
          {tablesLoading && <div className="text-sm text-slate-500">Cargando mesas...</div>}
          {tablesError && <div className="text-sm text-rose-600">No pudimos cargar las mesas.</div>}
          {tables.map(t => (
              <Table key={t.tableId} table={t} />
          ))}
        </div>
    );
};

export default TablesComponent;
