"use client";
import {useForm} from "@/hooks/useForm";
import {Item} from "@/models/Item";

const initialItem: Item = {
    id: "",
    name: "",
    description: "",
    price: 0,
    barCode: "",
    categories: [],
    cost: 0,
    stock: 0,
    supplier: "",
    imageUrl: "",
    isAvailableForSale: false,
    lowStock: 0,
    owner: "",
    sku: 0,
    variants: []
};
const CreateItem = () => {
    const {name, handleInputChange} = useForm<Item>(initialItem);
    return (
        <div className="container w-2/3 mx-auto">
            <div className="card w-full rounded-lg overflow-hidden shadow-lg bg-white">
                <h2 className="text-center">Create New Item</h2>
            </div>
        </div>
    );
};

export default CreateItem;