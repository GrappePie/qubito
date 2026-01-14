import mongoose, { Schema } from "mongoose";

const CashRegisterSessionSchema = new Schema(
  {
    tenantId: { type: String, index: true, required: true },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
    openingAmount: { type: Number, default: 0 },
    closingAmount: { type: Number, default: null },
    expectedCash: { type: Number, default: null },
    discrepancy: { type: Number, default: null },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    openedBy: { type: String, default: null },
    closedBy: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true },
);

const CashRegisterSession =
  mongoose.models.CashRegisterSession ||
  mongoose.model("CashRegisterSession", CashRegisterSessionSchema);

export default CashRegisterSession;
