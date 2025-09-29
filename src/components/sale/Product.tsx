

const Product = () => {
    return (
        <div className="h-40 border rounded-lg p-2 text-center cursor-pointer hover:shadow-md transition-shadow">
            <img src="https://placehold.co/150x150/add8e6/ffffff?text=Agua" alt="Agua Embotellada"
                 className="w-full h-24 object-cover rounded-md mx-auto" />
            <p className="text-sm font-semibold mt-2 truncate">Café Americano</p>
            <p className="text-xs text-slate-500">$2.50</p>
        </div>
    );
};

export default Product;