// ==========================================
// SHARED UTILITY TYPES
// ==========================================
type Populated<T> = string | T; 

// ==========================================
// ACCOUNT HEAD TYPES
// ==========================================
export type AccountType = 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY';
export type FundCategory = 'RESTRICTED' | 'UNRESTRICTED';

export interface TAccountHead {
  _id: string;
  name: string;
  type: AccountType;
  fundCategory: FundCategory;
  subType: string[];
  code: string;
  description?: string;
  isSystem?: boolean;
}

// ==========================================
// ✨ NEW: PAYMENT CATEGORY TYPES
// ==========================================
// This defines whether an account is Cash, Bank, or Staff Personal/Debt
export type PaymentCategoryType = 'CASH' | 'BANK' | 'PERSONAL' | 'DEBT' | 'WALLET';

export interface TPaymentCategory {
  _id: string;
  name: string;      // e.g., "Nabil Bank", "Petty Cash", "Staff Reimbursement"
  type: PaymentCategoryType;
  isActive: boolean;
  accountNumber?: string; // Optional for bank accounts
}

// ==========================================
// TRANSACTION (FINANCE) TYPES
// ==========================================
export type TransactionType = 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY';
export type TransactionStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface TTransaction {
  _id: string;
  amount: number;
  date: string | Date;
  type: TransactionType;
  status: TransactionStatus;
  isSettled: boolean;
  
  // Relationships
  accountHead: Populated<TAccountHead>; 
  paymentCategory: Populated<TPaymentCategory>; // ✨ REPLACED 
  
  description: string;
  subType?: string; 
  referenceNumber?: string;
  donorOrVendorName?: string;
  createdBy: any; // Ideally a TUser type
  verifiedBy?: any;
  
  // Inventory Link
  logId?: Populated<TInventoryLog> | null; 
  
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ==========================================
// INVENTORY TYPES (Fixed)
// ==========================================
export type InventoryCategory = string; // now InventoryCategory ObjectId
export type InventoryItemType = 'CONSUMABLE' | 'ASSET';
export type InventoryLogType = 'IN' | 'OUT';

export interface TInventoryItem {
  _id: string;
  name: string;
  category: InventoryCategory | any;
  type: InventoryItemType;
  unit: string;
  currentStock: number;
  minimumStockLevel: number;
  location?: string;
  condition?: 'NEW' | 'GOOD' | 'REPAIR';
  description?: string;
  isActive?: boolean;
}

export interface TInventoryLog {
  _id: string;
  item: Populated<TInventoryItem>;
  quantity: number;
  type: InventoryLogType;
  reason: string;
  date: string | Date;
}