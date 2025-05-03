import mongoose, { Model } from 'mongoose';

export interface ItemVariant{
    type: string;
    productIds: string[];
}
interface Item {
    id: string;
    barCode:number;
    categories:string[];
    cost:number;
    description: string;
    imageUrl:  string;
    isAvailableForSale :boolean;
    lowStock:  number;
    name:      string;
    owner:     string;
    price:     number;
    sku:       number;
    stock:     number;
    variants:  ItemVariant[];
}

const ItemSchema = new mongoose.Schema<Item>({
    barCode: { type: Number, required: true },
    categories: { type: [String], required: true },
    cost: { type: Number, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isAvailableForSale: { type: Boolean, default: false },
    lowStock: { type: Number, default: 0 },
    name: { type: String, required: true },
    owner: { type: String, required: true },
    price: { type: Number, required: true },
    sku: { type: Number, required: true },
    stock: { type: Number, default: 0 },
}, { timestamps: true });

const ItemModel: Model<Item> = mongoose.models.Item || mongoose.model<Item>('Item', ItemSchema);

export default ItemModel;
