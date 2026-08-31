"use server";
import dbConnect from "@/lib/db";
import InventoryItem from "@/models/InventoryItem";
import InventoryLog from "@/models/InventoryLog";
import { revalidatePath } from "next/cache";
import Transaction from "@/models/Transaction";
import AccountHead from "@/models/AccountHead";

// --- CREATE ITEM ---
export async function addInventoryItem(prevState: any, formData: FormData) {
    await dbConnect();

    try {
        await InventoryItem.create({
            name: String(formData.get("name")),
            category: String(formData.get("category")),
            type: String(formData.get("type") || "CONSUMABLE"), // ✨ NEW: ASSET or CONSUMABLE
            unit: String(formData.get("unit")),
            description: String(formData.get("description") || ""),
            location: String(formData.get("location") || ""), // ✨ NEW
            condition: String(formData.get("condition") || "NEW"), // ✨ NEW
            currentStock: 0, 
            // Assets might not need stock alerts, so we handle 0/null
            minimumStockLevel: Number(formData.get("minimumStockLevel")) || 0,
        });

        revalidatePath("/inventory");
        return { success: true };
    } catch (error: any) {
        if (error.code === 11000) {
            return { success: false, error: "An item with this exact name already exists." };
        }
        return { success: false, error: error.message };
    }
}

// --- UPDATE ITEM ---
export async function updateInventoryItem(prevState: any, formData: FormData) {
    await dbConnect();
    try {
        const id = formData.get("id") as string;
        if (!id) throw new Error("Missing Item ID for update.");

        const updateData = {
            name: String(formData.get("name")),
            category: String(formData.get("category")),
            type: String(formData.get("type")), // ✨ Sync type
            unit: String(formData.get("unit")),
            description: String(formData.get("description")),
            location: String(formData.get("location") || ""), // ✨ Sync location
            condition: String(formData.get("condition")), // ✨ Sync condition
            minimumStockLevel: Number(formData.get("minimumStockLevel")) || 0,
        };

        const updatedItem = await InventoryItem.findByIdAndUpdate(id, updateData, { 
            new: true,
            runValidators: true 
        });

        if (!updatedItem) throw new Error("Inventory item not found.");

        revalidatePath("/inventory");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function adjustStock(prevState: any, formData: FormData) {
    await dbConnect();
    
    try {
        const itemId = formData.get("itemId") as string;
        const quantity = Number(formData.get("quantity"));
        const type = formData.get("type") as 'IN' | 'OUT';
        const reason = formData.get("reason") as string;
        const createdBy = formData.get("createdBy") as string;
        const status = formData.get("status") as string || "PENDING";

        if (!createdBy) throw new Error("Session expired. Please log in again.");

        const cost = Number(formData.get("cost") || 0);
        let accountHead = formData.get("accountHead") as string;
        
        // ✨ NEW: Grab the single Payment Category ID instead of the old two-field system
        const paymentCategoryId = formData.get("paymentCategoryId") as string || null;

        // 1. UPDATE STOCK
        const stockChange = type === 'IN' ? quantity : -quantity;
        const updatedItem = await InventoryItem.findByIdAndUpdate(
            itemId,
            { $inc: { currentStock: stockChange } },
            { new: true }
        );
        if (!updatedItem) throw new Error("Item not found");

        // Prevent negative stock for consumables
        if (updatedItem.type === "CONSUMABLE" && updatedItem.currentStock < 0) {
            await InventoryItem.findByIdAndUpdate(itemId, { $inc: { currentStock: -stockChange } });
            throw new Error(`Insufficient stock. Only ${updatedItem.currentStock + quantity} available.`);
        }

        // 2. CREATE LOG
        const log = await InventoryLog.create({
            item: itemId,
            quantity,
            type,
            reason,
            date: new Date(),
            createdBy 
        });

        // 3. FINANCIAL INTEGRATION (Only if cost is involved)
        if (type === 'IN' && cost > 0) {
            
            // Magic Fallback for Account Head
            if (!accountHead) {
                let defaultAccount = await AccountHead.findOne({ name: "Staff/Samity Personal Cash Spend" });
                if (!defaultAccount) {
                    defaultAccount = await AccountHead.create({
                        name: "Staff/Samity Personal Cash Spend",
                        type: "EXPENSE",
                        fundCategory: "UNRESTRICTED",
                        code: "EXP-STAFF",
                        isSystem: true,
                        isActive: true
                    });
                }
                accountHead = defaultAccount._id.toString();
            }

            await Transaction.create({
                amount: cost,
                date: new Date(formData.get("date") as string || Date.now()),
                type: 'EXPENSE',
                logId: log._id,
                accountHead: accountHead,
                
                // ✨ NEW: Link the dynamic Payment Category (Bank/Wallet/Cash)
                paymentCategory: paymentCategoryId, 
                
                donorOrVendorName: formData.get("donorOrVendorName") || "Inventory Supplier",
                referenceNumber: formData.get("referenceNumber"),
                description: `${updatedItem.type === 'ASSET' ? 'Asset Purchase' : 'Inventory Purchase'}: ${quantity} ${updatedItem.unit} of ${updatedItem.name}.`,
                createdBy, 
                status     
            });
        }

        revalidatePath("/inventory");
        revalidatePath("/finance"); 
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}