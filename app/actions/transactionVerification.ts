"use server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

async function assertAdmin() {
  const w = await requireWrite("/approvals");
  if (!(w as any).ok) throw new Error((w as any).error);
}

export async function verifyTransaction(transactionId: string) {
  try {
    await dbConnect();
    
    await assertAdmin();

    // 2. Perform the Verification
    const updatedTx = await Transaction.findByIdAndUpdate(
      transactionId,
      { 
        status: "VERIFIED",
      },
      { new: true }
    );

    if (!updatedTx) throw new Error("Transaction not found.");

    // 3. Revalidate the UI
    revalidatePath("/approvals");
    revalidatePath("/finance"); // Updates the main ledger

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectTransaction(transactionId: string, reason: string) {
    try {
      await dbConnect();
      await assertAdmin();
      
      await Transaction.findByIdAndUpdate(transactionId, { 
          status: "REJECTED",
          description: `[REJECTED] - ${reason}` // Append the reason to the description
      });
  
      revalidatePath("/approvals");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }