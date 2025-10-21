import {Item} from "@/models/Item";
import mongoose, {Model} from 'mongoose';

export interface ICategory {
    categoryId: string;
    name: string;
    description: string;
    imageUrl: string;
    parentCategoryId?: string;
    isActive: boolean;
    products: Partial<Item>[]; // Array of products in this category
    owner?: string;
}

// Define the Category schema
const CategorySchema = new mongoose.Schema<ICategory>({
    categoryId: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    description: {type: String, required: true},
    imageUrl: {type: String, required: true},
    parentCategoryId: {type: String, default: null},
    isActive: {type: Boolean, default: true},
    products: [{type: mongoose.Schema.Types.ObjectId, ref: 'Item'}],
    owner: { type: String, required: false, index: true },
}, {timestamps: true});

const CategoryModel: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export default CategoryModel;
