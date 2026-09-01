import mongoose, { Schema, Document } from 'mongoose';

export type PagePermission = { read: boolean; write: boolean };
export type PermissionsMap = Record<string, PagePermission>;

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  // Legacy role kept for migration; new code uses isSuperAdmin + permissions
  role: 'ADMIN' | 'SAMITY' | 'STAFF' | 'CAREGIVER' | 'MEDICAL_STAFF' | 'TEACHER';
  isSuperAdmin: boolean;
  permissions: PermissionsMap;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, "Name is required for the registry"],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, "Email is mandatory for system access"], 
    unique: true,
    lowercase: true,
    trim: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['ADMIN', 'SAMITY', 'STAFF', 'CAREGIVER', 'MEDICAL_STAFF', 'TEACHER'], 
    default: 'SAMITY'
  },
  isSuperAdmin: { type: Boolean, default: false },
  permissions: { type: Schema.Types.Mixed, default: {} },
  phone: { type: String },
  isActive: { type: Boolean, default: false },
  lastLogin: { type: Date }, 
}, { timestamps: true });

// // Pre-save hook example (Optional: if you want to track status changes)
// UserSchema.pre('save', function(next) {
//   next();
// });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);