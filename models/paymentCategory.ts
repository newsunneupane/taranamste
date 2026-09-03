import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentCategory extends Document {
  name: string;
  type: "CASH" | "BANK" | "WALLET" | "KIND" | "PERSONAL"; // ✨ Added PERSONAL
  identifier: string; 
  description?: string;
  isActive: boolean;
  isSystem: boolean; // ✨ Added isSystem to Interface
  
  accountIdentifier?: string; 
  providerDetail?: string;    
  
  createdAt: Date;
  updatedAt: Date;
}

const PaymentCategorySchema = new Schema<IPaymentCategory>(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true 
    },
    type: { 
      type: String, 
      enum: ["CASH", "BANK", "WALLET", "KIND", "PERSONAL"], // ✨ Updated Enum
      required: true,
      default: "CASH"
    },
    identifier: { 
      type: String, 
      required: [true, "Identifier is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false }, // ✨ Added to Schema
    
    accountIdentifier: { type: String, trim: true },
    providerDetail: { type: String, trim: true }
  },
  { timestamps: true }
);

const PaymentCategory: Model<IPaymentCategory> = 
  mongoose.models.PaymentCategory || mongoose.model<IPaymentCategory>("PaymentCategory", PaymentCategorySchema);

export default PaymentCategory;