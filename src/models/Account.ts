import mongoose, { Model, Schema } from 'mongoose';

export interface Account {
  _id: string;
  tenantId: string;
  userId: string;
  displayName?: string | null;
  email?: string | null;
  roleId?: string | null;
  isAdmin: boolean;
  createdBy?: string | null;
  passwordHash?: string | null;
}

const AccountSchema = new Schema<Account>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    displayName: { type: String, default: null },
    email: { type: String, default: null },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', default: null },
    isAdmin: { type: Boolean, default: false },
    createdBy: { type: String, default: null },
    passwordHash: { type: String, default: null },
  },
  { timestamps: true }
);

AccountSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

const AccountModel: Model<Account> =
  mongoose.models.Account || mongoose.model<Account>('Account', AccountSchema);

export default AccountModel;
