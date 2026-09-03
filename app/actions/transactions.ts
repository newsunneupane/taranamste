"use server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

export async function addTransaction(prevState: any, formData: FormData) {
  try {
    const w = await requireWrite("/finance");
    if (!(w as any).ok) return { success: false, error: (w as any).error };
    await dbConnect();

    const id = formData.get("id") as string; 
    const amount = Number(formData.get("amount"));
    const createdBy = formData.get("createdBy");

    if (!amount || amount <= 0) return { success: false, error: "Amount must be greater than 0" };

    const payload = {
      amount,
      type: formData.get("type"),
      accountHead: formData.get("accountHead") || null,
      paymentCategory: formData.get("paymentCategoryId") || null,
      subType: formData.get("subType"),
      date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
      description: formData.get("description"),
      donorOrVendorName: formData.get("donorOrVendorName"),
      referenceNumber: formData.get("referenceNumber"),
      status: formData.get("status") || "PENDING",
      createdBy: createdBy,
    };

    if (id) {
      await Transaction.findByIdAndUpdate(id, payload, { runValidators: true });
    } else {
      await Transaction.create(payload);
    }

    revalidatePath("/finance"); 
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 2. DELETE PROTOCOL
// ============================================================================
export async function deleteTransaction(id: string) {
  const w = await requireWrite("/finance");
  if (!(w as any).ok) return { success: false, error: (w as any).error };
  await dbConnect();
  try {
    if (!id) throw new Error("Transaction ID is required.");
    
    await Transaction.findByIdAndDelete(id);

    revalidatePath("/finance");
    return { success: true };
  } catch (e: any) {
    console.error("Delete Error:", e);
    return { success: false, error: e.message };
  }
}

