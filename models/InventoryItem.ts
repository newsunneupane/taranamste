import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  name: string;
  category: mongoose.Types.ObjectId; // ref InventoryCategory
  type: 'CONSUMABLE' | 'ASSET';
  unit: string;
  currentStock: number;
  minimumStockLevel: number;
  location?: string;
  condition?: 'NEW' | 'GOOD' | 'REPAIR';
  description?: string;
  isActive: boolean;
}

const InventoryItemSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'InventoryCategory', required: true },
  type: { type: String, enum: ['CONSUMABLE', 'ASSET'], required: true, default: 'CONSUMABLE' },
  unit: { type: String, required: true, trim: true },
  currentStock: { type: Number, default: 0, required: true },
  minimumStockLevel: { type: Number, default: 10 },
  location: { type: String, trim: true, default: '' },
  condition: { type: String, enum: ['NEW', 'GOOD', 'REPAIR'], default: 'NEW' },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Force refresh in dev (old enum schema cached in mongoose.models)
if (mongoose.models.InventoryItem) {
  try { delete mongoose.models.InventoryItem; } catch {}
}
export default mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);