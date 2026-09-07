import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventoryCategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

const InventoryCategorySchema = new Schema<IInventoryCategory>(
  {
    name: { 
      type: String, 
      required: [true, "Category name is required"], 
      trim: true,
      unique: true
    },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const InventoryCategory: Model<IInventoryCategory> = 
  mongoose.models.InventoryCategory || mongoose.model<IInventoryCategory>("InventoryCategory", InventoryCategorySchema);

export default InventoryCategory;