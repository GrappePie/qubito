import mongoose, { Model } from 'mongoose';

export interface ITicketProduct {
    productId: mongoose.Types.ObjectId; // Referencia
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface ITicket {
    _id: string;
    customerId?: string;
    createdBy?: string;
    products: ITicketProduct[];
    createdAt: Date;
    updatedAt: Date;
}

// Ticket Schema Definition
const TicketSchema = new mongoose.Schema<ITicket>({
    customerId: { type: String, required: false },
    createdBy: { type: String, required: false },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true }
    }]
}, { timestamps: true });

// Ticket Mode
const TicketModel: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);  

export default TicketModel;
    
