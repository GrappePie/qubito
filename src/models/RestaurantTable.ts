import mongoose, { Model, Schema } from 'mongoose';

export interface RestaurantTable {
  _id: string;
  tenantId: string;
  tableId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  legacyNumber?: number | null;
}

const RestaurantTableSchema = new Schema<RestaurantTable>(
  {
    tenantId: { type: String, required: true, index: true },
    tableId: { type: String, required: true },
    name: { type: String, required: true },
    sortOrder: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    legacyNumber: { type: Number, default: null },
  },
  { timestamps: true }
);

RestaurantTableSchema.index({ tenantId: 1, tableId: 1 }, { unique: true });

const RestaurantTableModel: Model<RestaurantTable> =
  mongoose.models.RestaurantTable ||
  mongoose.model<RestaurantTable>('RestaurantTable', RestaurantTableSchema);

export default RestaurantTableModel;
