"use server";

import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import PaymentCategory from "@/models/paymentCategory"; // ✨ NEW: Using the Category model
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/guards";
import { isWorkRole } from "@/lib/permission";

export async function executeTransfer(prevState: any, formData: FormData) {
    await dbConnect();

    try {
        // Moving money is a Finance-tier operation: WORK roles + ADMIN.
        const session = await getCurrentSession();
        if (!session?.user?.id || !isWorkRole(session.user.role)) {
            throw new Error("Security Violation: You are not allowed to move money between accounts.");
        }

        const amount = Number(formData.get("amount"));
        const fromCategoryId = formData.get("fromAccount") as string; // From UI dropdown
        const toCategoryId = formData.get("toAccount") as string;     // From UI dropdown
        const date = formData.get("date") ? new Date(formData.get("date") as string) : new Date();
        const description = formData.get("description") as string;
        // The actor id comes from the session, not the (spoofable) form field.
        const createdBy = session.user.id;

        // 1. Validation
        if (!createdBy) throw new Error("Security Violation: User session not found.");
        if (amount <= 0) throw new Error("Transfer amount must be greater than zero.");
        if (fromCategoryId === toCategoryId) throw new Error("Cannot transfer to the same account.");

        // 2. Fetch Category details for the audit trail
        const fromCat = await PaymentCategory.findById(fromCategoryId);
        const toCat = await PaymentCategory.findById(toCategoryId);

        if (!fromCat || !toCat) throw new Error("One or both payment categories could not be found.");

        // 3. Generate a unique Reference ID to link the pair
        const transferRef = `CONTRA-${Date.now().toString().slice(-6)}`;

        // 4. Create the WITHDRAWAL (Expense side)
        // This reduces the balance of the 'From' account
        await Transaction.create({
            amount: amount,
            date: date,
            type: 'EXPENSE',
            accountHead: null, // Transfers don't hit Income/Expense heads
            paymentCategory: fromCat._id,
            referenceNumber: transferRef,
            description: `Internal Transfer TO [${toCat.name}] - ${description}`,
            createdBy,
            status: "VERIFIED",
            isSettled: true // Contra entries are pre-settled
        });

        // 5. Create the DEPOSIT (Income side)
        // This increases the balance of the 'To' account
        await Transaction.create({
            amount: amount,
            date: date,
            type: 'INCOME',
            accountHead: null,
            paymentCategory: toCat._id,
            referenceNumber: transferRef,
            description: `Internal Transfer FROM [${fromCat.name}] - ${description}`,
            createdBy,
            status: "VERIFIED",
            isSettled: true
        });

        revalidatePath("/finance");
        revalidatePath("/settlements");
        
        return { success: true, error: null };

    } catch (error: any) {
        console.error("Transfer Error:", error);
        return { success: false, error: error.message };
    }
}