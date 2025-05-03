import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema({
    name: String,
    quantity: Number,
    minThreshold: Number,
    unit: String,
});

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
