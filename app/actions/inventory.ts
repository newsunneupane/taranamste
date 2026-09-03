"use server";
import dbConnect from "@/lib/db";
import InventoryItem from "@/models/InventoryItem";
import InventoryLog from "@/models/InventoryLog";
import { revalidatePath } from "next/cache";
import Transaction from "@/models/Transaction";
import AccountHead from "@/models/AccountHead";
import { requireWrite } from "@/lib/guards";

// --- CREATE ITEM ---
export async function addInventoryItem(prevState: any, formData: FormData) {
    const w = await requireWrite("/inventory");
    if (!(w as any).ok) return { success: false, error: (w as any).error };
    await dbConnect();

    try {
        const name = String(formData.get("name") || "").trim();
        const categoryRaw = formData.get("category") as string | null;
        if (!name) return { success: false, error: "Item Name is required." };
        if (!categoryRaw || !String(categoryRaw).trim()) return { success: false, error: "Category required — add via + Add New" };
        const category = String(categoryRaw).trim();
        if (!/^[a-fA-F0-9]{24}$/.test(category)) return { success: false, error: "Invalid category — please re-select after adding." };

        await InventoryItem.create({
            name,
            category: category as any,
            type: (String(formData.get("type") || "CONSUMABLE") as any),
            description: String(formData.get("description") || ""),
            location: String(formData.get("location") || ""),
            condition: (String(formData.get("condition") || "NEW") as any),
            currentStock: 0,
            minimumStockLevel: Number(formData.get("minimumStockLevel")) || 0,
        } as any);

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
    const w2 = await requireWrite("/inventory");
    if (!(w2 as any).ok) return { success: false, error: (w2 as any).error };
    await dbConnect();
    try {
        const id = formData.get("id") as string;
        if (!id) throw new Error("Missing Item ID for update.");

        const categoryRaw = formData.get("category") as string | null;
        if (!categoryRaw || !String(categoryRaw).trim()) throw new Error("Category required — add via + Add New");
        const category = String(categoryRaw).trim();
        if (!/^[a-fA-F0-9]{24}$/.test(category)) throw new Error("Invalid category — please re-select after adding.");
        const updateData = {
            name: String(formData.get("name")),
            category: category as any,
            type: String(formData.get("type")) as any,
            description: String(formData.get("description")),
            location: String(formData.get("location") || ""),
            condition: String(formData.get("condition")) as any,
            minimumStockLevel: Number(formData.get("minimumStockLevel")) || 0,
        } as any;

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
    const w3 = await requireWrite("/inventory");
    if (!(w3 as any).ok) return { success: false, error: (w3 as any).error };
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

        // 3. FINANCIAL INTEGRATION (Only if cost is involved) — true capitalization
        if (type === 'IN' && cost > 0) {
            
            // Magic Fallback for Account Head — keep what is good, fix name to seeded head
            if (!accountHead) {
                let defaultAccount = await AccountHead.findOne({ name: "Staff Personal Expense" });
                if (!defaultAccount) {
                    defaultAccount = await AccountHead.findOne({ code: "EXP-STAFF" });
                }
                if (!defaultAccount) {
                    defaultAccount = await AccountHead.create({
                        name: "Staff Personal Expense",
                        type: "EXPENSE",
                        fundCategory: "UNRESTRICTED",
                        code: "EXP-STAFF",
                        isSystem: true,
                        isActive: true
                    });
                }
                accountHead = defaultAccount._id.toString();
            }

            // True capitalization: asset stock IN → ASSET type, consumable → EXPENSE
            const headDoc = accountHead ? await AccountHead.findById(accountHead).lean() : null;
            const resolvedType = (headDoc as any)?.type === "ASSET" ? "ASSET" : (updatedItem.type === 'ASSET' ? 'ASSET' : 'EXPENSE');

            const txn = await Transaction.create({
                amount: cost,
                date: new Date(formData.get("date") as string || Date.now()),
                type: resolvedType,
                logId: log._id,
                accountHead: accountHead,
                subType: formData.get("subType") || undefined,
                paymentCategory: paymentCategoryId, 
                donorOrVendorName: formData.get("donorOrVendorName") || "Inventory Supplier",
                referenceNumber: formData.get("referenceNumber"),
                description: `${resolvedType === 'ASSET' ? 'Asset Purchase — Capitalized' : 'Inventory Purchase'}: ${quantity} of ${updatedItem.name}.`,
                createdBy, 
                status     
            });
            // Link back for traceability
            await InventoryLog.findByIdAndUpdate(log._id, { transactionId: txn._id } as any);
        }

        revalidatePath("/inventory");
        revalidatePath("/finance"); 
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}