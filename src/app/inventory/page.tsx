import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export default async function InventoryPage() {
    await connectToDatabase();
    const products = await Product.find().lean();
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Inventory</h1>
            <div className="flex gap-4 mb-4">
                <button className="bg-gray-200 px-4 py-2 rounded text-black">Upload CSV</button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded">Add Product</button>
            </div>
            <table className="w-full border-collapse bg-white rounded shadow">
                <thead>
                <tr className="bg-gray-100 text-left text-black">
                    <th className="p-3">Product</th>
                    <th className="p-3">Current Quantity</th>
                    <th className="p-3">Minimum Quant.</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Status</th>
                </tr>
                </thead>
                <tbody>
                {products.map((p: any) => {
                    const lowStock = p.quantity < p.minThreshold;
                    return (
                        <tr key={p._id} className="border-t text-black">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3">{p.quantity}</td>
                            <td className="p-3">{p.minThreshold}</td>
                            <td className="p-3">{p.unit}</td>
                            <td className="p-3">
                                {lowStock ? (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Low stock</span>
                                ) : (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">OK</span>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
