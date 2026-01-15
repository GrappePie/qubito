import mongoose, { Model, Schema } from 'mongoose';
import { PermissionCode } from '@/lib/permissions';

export interface Role {
  _id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  permissions: PermissionCode[];
  isAdmin?: boolean;
  createdBy?: string | null;
}

const RoleSchema = new Schema<Role>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    permissions: { type: [String], default: [] },
    isAdmin: { type: Boolean, default: false },
    createdBy: { type: String, default: null },
  },
  { timestamps: true }
);

RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const RoleModel: Model<Role> =
  mongoose.models.Role || mongoose.model<Role>('Role', RoleSchema);

export default RoleModel;
