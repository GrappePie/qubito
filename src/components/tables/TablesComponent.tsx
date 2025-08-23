interface TableProps {
    number: number;
    total: number;
}

interface TableState {
    tables: TableProps[];
}

const Table = ({ number, total=0 }:TableProps) => {
    return (
        <div className={`rounded-lg p-4 text-white text-center cursor-pointer ${total == 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-600'} transition-colors flex flex-col justify-between`}>
            <div className="font-bold text-lg">Mesa {number}</div>
            <div className="text-sm">{total == 0 ? 'Disponible': "$"+total.toFixed(2).toString()}</div>
        </div>
    );
}

const TablesComponent = ({tables}:TableState) => {
    return (
        <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 my-6 mx-4"}>
            {tables.map((table) => (
                <Table key={table.number} number={table.number} total={table.total}/>
            ))}
        </div>
    );
};

export default TablesComponent;