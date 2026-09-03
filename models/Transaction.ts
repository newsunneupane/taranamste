import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  amount: number;
  date: Date;
  type: 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY';
  accountHead?: mongoose.Types.ObjectId | null;
  subType?: string; 

  // ✨ THE FIX: Updated the TS Interface to match the schema!
  paymentCategory?: mongoose.Types.ObjectId | null;

  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isSettled: boolean; 
  createdBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  referenceNumber?: string;
  description: string;
  donorOrVendorName?: string;
  logId?: mongoose.Types.ObjectId | string;
}

const TransactionSchema = new Schema({
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['INCOME', 'EXPENSE', 'ASSET', 'LIABILITY'], required: true },

  accountHead: {
    type: Schema.Types.ObjectId,
    ref: 'AccountHead',
    required: false,
    default: null
  },

  subType: { type: String }, 
  
  // ✨ The unified payment tracker
  paymentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentCategory',
    required: false
  },

  referenceNumber: { type: String },
  description: { type: String, required: true },
  donorOrVendorName: { type: String },

  logId: {
    type: Schema.Types.ObjectId,
    ref: 'InventoryLog',
    required: false
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isSettled: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

// Always use this pattern for Next.js to prevent model recompilation errors
export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);