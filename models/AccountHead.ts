import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountHead extends Document {
  name: string;
  code: string;
  type: 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY';
  fundCategory: 'RESTRICTED' | 'UNRESTRICTED';
  subType: string[];
  description?: string;
  
  // ✨ NEW: Bank Account Flags & Details
  isBankAccount: boolean;
  bankDetails?: {
    accountNumber?: string;
    bankName?: string;
    branch?: string;
  };

  isSystem: boolean;
  isActive: boolean;
}

const AccountHeadSchema = new Schema<IAccountHead>({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE', 'ASSET', 'LIABILITY'], required: true },
  fundCategory: { type: String, enum: ['RESTRICTED', 'UNRESTRICTED'], default: 'UNRESTRICTED', required: true },
  subType: [{ type: String, trim: true }], 
  description: { type: String, trim: true },
  isBankAccount: { type: Boolean, default: false },
  bankDetails: {
    accountNumber: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
  },
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.AccountHead || mongoose.model<IAccountHead>('AccountHead', AccountHeadSchema);