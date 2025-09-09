import { Schema, Document, models, model } from 'mongoose';

export interface IAdjustmentHistory extends Document {
  productId: string;
  previousStock: number;
  newStock: number;
  reason?: string;
  date: Date;
}

const AdjustmentHistorySchema = new Schema<IAdjustmentHistory>({
  productId: { type: String, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: { type: String },
  date: { type: Date, default: Date.now },
});

export default models.AdjustmentHistory || model<IAdjustmentHistory>('AdjustmentHistory', AdjustmentHistorySchema);
