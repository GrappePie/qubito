import mongoose, { Model } from "mongoose";

export interface ITicketProduct {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sku?: string;
}

export interface ITicketPayments {
    cash: number;
    card: number;
    change: number;
    paid: number;
}

export interface ITicket {
    _id: string;
    orderContext: "table" | "quick";
    tableNumber?: number | null;
    customerId?: string;
    customerName?: string;
    createdBy?: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    payments: ITicketPayments;
    splitCount?: number;
    products: ITicketProduct[];
    createdAt: Date;
    updatedAt: Date;
}

const TicketSchema = new mongoose.Schema<ITicket>(
    {
        orderContext: { type: String, enum: ["table", "quick"], required: true },
        tableNumber: { type: Number, required: false },
        customerId: { type: String, required: false },
        customerName: { type: String, required: false },
        createdBy: { type: String, required: false },
        subtotal: { type: Number, required: true },
        tax: { type: Number, required: true },
        tip: { type: Number, default: 0 },
        total: { type: Number, required: true },
        payments: {
            cash: { type: Number, default: 0 },
            card: { type: Number, default: 0 },
            change: { type: Number, default: 0 },
            paid: { type: Number, default: 0 },
        },
        splitCount: { type: Number, required: false },
        products: [
            {
                productId: { type: String, required: true },
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                unitPrice: { type: Number, required: true },
                total: { type: Number, required: true },
                sku: { type: String, required: false },
            },
        ],
    },
    { timestamps: true },
);

const TicketModel: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

export default TicketModel;

