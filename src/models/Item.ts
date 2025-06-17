import mongoose, { Model } from 'mongoose';

export interface ItemVariant{
    type: string;
    productIds: string[];
}
export interface Item {
    id: string;
    barCode:string;
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
    supplier: string;
}

const ItemSchema = new mongoose.Schema<Item>({
    barCode: { type: String, required: true },
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
    variants: [{
        type: {
            type: String,
            required: true
        },
        productIds: {
            type: [String],
            required: true
        }
    }],
    supplier: { type: String, required: true }
}, { timestamps: true });

const ItemModel: Model<Item> = mongoose.models.Item || mongoose.model<Item>('Item', ItemSchema);

export default ItemModel;
