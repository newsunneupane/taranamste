import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryLog extends Document {
  item: mongoose.Types.ObjectId;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  date: Date;
  
  // ✨ NEW: Cross-Module Links
  transactionId?: mongoose.Types.ObjectId; // Links to the financial purchase
  childId?: mongoose.Types.ObjectId;       // Links to the child who received the item
  
  createdBy: mongoose.Types.ObjectId; // Audit Trail
  donorOrVendorName?: string;
  cost?: number;
}

const InventoryLogSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  
  // ✨ UPDATED: Allows for 1.5kg or 0.5 liters
  quantity: { type: Number, required: true, min: 0.01 }, 
  
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  reason: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },

  // ✨ NEW: The Database Hooks
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  childId: { type: Schema.Types.ObjectId, ref: 'Child' },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  donorOrVendorName: { type: String, trim: true },
  cost: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.InventoryLog || mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);