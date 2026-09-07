import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  name: string;
  category: mongoose.Types.ObjectId; // ref InventoryCategory
  currentStock: number;
  minimumStockLevel: number;
  description?: string;
  isActive: boolean;
}

const InventoryItemSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'InventoryCategory', required: true },
  currentStock: { type: Number, default: 0, required: true },
  minimumStockLevel: { type: Number, default: 10 },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Force refresh in dev (old enum schema cached in mongoose.models)
if (mongoose.models.InventoryItem) {
  try { delete mongoose.models.InventoryItem; } catch {}
}
export default mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);