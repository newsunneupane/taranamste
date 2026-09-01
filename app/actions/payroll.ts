"use server";
import dbConnect from "@/lib/db";
import Staff from "@/models/Staff";
import Transaction from "@/models/Transaction";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

export async function processMonthlyPayroll(prevState: any, formData: FormData) {
  try {
    await dbConnect();
    const w = await requireWrite("/payroll");
    if (!(w as any).ok) return { error: (w as any).error };
    const session = (w as any).session;

    // ✨ UPDATED: paymentCategoryId replaces bankAccountId string
    const paymentCategoryId = formData.get("paymentCategoryId") as string;
    const salaryAccountHeadId = formData.get("salaryAccountHeadId") as string;
    const monthYear = formData.get("monthYear") as string; // Format: "YYYY-MM"
    // The actor id comes from the session, not the (spoofable) form field.
    const adminId = session.user.id;

    if (!paymentCategoryId || !salaryAccountHeadId || !monthYear || !adminId) {
      return { error: "Missing required financial routing parameters or Admin ID." };
    }

    // 1. Fetch all ACTIVE personnel
    const activeStaff = await Staff.find({ status: "ACTIVE" }).lean();
    if (!activeStaff.length) return { error: "No active personnel found on roster." };

    // 2. Prevent Double-Processing
    const existingPayroll = await Transaction.findOne({
        type: "EXPENSE",
        description: { $regex: `\\[PAYROLL\\] - ${monthYear}` }
    });

    if (existingPayroll) {
        return { error: `Security Lockout: Payroll for ${monthYear} has already been processed.` };
    }

    // 3. Calculate and Generate Transactions
    const transactionsToInsert = activeStaff.map((staff) => {
      const s = staff.salary || {};
      const a = s.allowances || {};
      
      const grossSalary = 
        (s.basicSalary || 0) + (s.grade || 0) + (s.dearnessAllowance || 0) +
        (a.houseRent || 0) + (a.medical || 0) + (a.transport || 0) +
        (a.food || 0) + (a.communication || 0) + (a.other || 0);

      return {
        amount: grossSalary, 
        type: "EXPENSE",
        // ✨ UPDATED: Using the new paymentCategory field
        paymentCategory: paymentCategoryId, 
        accountHead: salaryAccountHeadId,
        status: "VERIFIED", 
        isSettled: true, // Payroll is usually settled immediately upon bank transfer
        description: `[PAYROLL] - ${monthYear} // Salary disbursement for ${staff.fullName}`,
        date: new Date(),
        // ✨ UPDATED: createdBy is the Admin, not the staff member receiving the money
        createdBy: adminId 
      };
    }).filter(tx => tx.amount > 0); 

    if (transactionsToInsert.length === 0) {
        return { error: "No personnel have a configured salary > 0." };
    }

    // 4. Execute Batch Insert
    await Transaction.insertMany(transactionsToInsert);

    revalidatePath("/finance");
    revalidatePath("/staff"); // To update any payroll history tabs on staff profiles
    return { success: true, count: transactionsToInsert.length };

  } catch (error: any) {
    console.error("Payroll Error:", error);
    return { error: error.message || "Payroll Execution Protocol Failed." };
  }
}