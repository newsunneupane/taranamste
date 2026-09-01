"use server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

export async function settleStaffCash(prevState: any, formData: FormData) {
  try {
    await dbConnect();
    const w = await requireWrite("/settlements");
    if (!(w as any).ok) return { error: (w as any).error };
    const session = (w as any).session;

    const staffId = formData.get("staffId") as string;
    const paymentCategoryId = formData.get("paymentCategoryId") as string; // The destination (Bank/Safe)
    const totalAmount = Number(formData.get("totalAmount"));
    // The actor id comes from the session, not the (spoofable) form field.
    const adminId = session.user.id;

    if (!staffId || !paymentCategoryId || totalAmount <= 0) {
      return { error: "Missing required settlement parameters." };
    }

    // 1. Mark all verified cash as SETTLED
    // We filter by paymentCategory type "CASH" via a sub-query or direct ID check
    // Assuming staff only have one 'Cash' category they use for collections:
    await Transaction.updateMany(
      { 
        createdBy: staffId, 
        status: "VERIFIED", 
        isSettled: false,
        type: "INCOME" 
      },
      { $set: { isSettled: true } }
    );

    // 2. Create the Official Deposit Transaction
    // This represents the money landing in the Bank/Safe
    await Transaction.create({
      amount: totalAmount,
      type: "INCOME",
      paymentCategory: paymentCategoryId, // ✨ UPDATED: Link to the Nabil Bank / Safe record
      status: "VERIFIED",
      isSettled: true, 
      description: `[SYSTEM SETTLEMENT] Bulk cash reconciliation for staff intake.`,
      createdBy: adminId, // The admin who verified the cash is now in the bank
      subType: "SETTLEMENT" // Optional: label to filter these out of standard donor reports
    });

    revalidatePath("/finance");
    revalidatePath("/settlements");
    return { success: true };
  } catch (error: any) {
    console.error("Settlement Error:", error);
    return { error: error.message || "Settlement Protocol Failed." };
  }
}