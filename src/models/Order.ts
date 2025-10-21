import mongoose, { Model } from "mongoose";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  stock?: number;
}

export interface OrderDoc {
  contextId: string;
  mode: "table" | "quick";
  tableNumber?: number;
  status: "pending" | "completed";
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName?: string;
  tenantId?: string;
}

const OrderSchema = new mongoose.Schema<OrderDoc>(
  {
    contextId: { type: String, required: true, unique: true },
    mode: { type: String, enum: ["table", "quick"], required: true },
    tableNumber: { type: Number },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        sku: { type: String },
        stock: { type: Number },
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    customerName: { type: String },
    tenantId: { type: String, index: true },
  },
  { timestamps: true },
);

const OrderModel: Model<OrderDoc> = mongoose.models.Order || mongoose.model<OrderDoc>("Order", OrderSchema);

export default OrderModel;
