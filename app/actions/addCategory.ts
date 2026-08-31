"use server";

import dbConnect from "@/lib/db";
import PaymentCategory from "@/models/paymentCategory";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/guards";
import { ROLES } from "@/lib/permission";

export async function savePaymentCategory(prevState: any, formData: FormData) {
    await dbConnect();
    try {
        const role = await requireRole(ROLES.ADMIN);
        if (!role) return { success: false, error: "Security Violation: Only Administrators can manage money accounts." };

        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;
        const identifier = formData.get("identifier") as string;
        const accountIdentifier = formData.get("accountIdentifier") as string;
        const providerDetail = formData.get("providerDetail") as string;
        const isActive = formData.get("isActive") === "true";
        const isSystem = formData.get("isSystem") === "true"; // Only editable by devs/seeding usually

        const payload = { 
            name, 
            type, 
            identifier, 
            accountIdentifier, 
            providerDetail, 
            isActive, 
            isSystem 
        };

        if (id) {
            // Protect system categories from being renamed/changed via UI if necessary
            const existing = await PaymentCategory.findById(id);
            if (existing?.isSystem && !payload.isSystem) {
                // If it's a system category, maybe restrict certain changes
            }
            await PaymentCategory.findByIdAndUpdate(id, payload);
        } else {
            await PaymentCategory.create(payload);
        }

        revalidatePath("/payment-categories");
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deletePaymentCategory(id: string) {
    await dbConnect();
    try {
        const role = await requireRole(ROLES.ADMIN);
        if (!role) return { success: false, error: "Security Violation: Only Administrators can delete money accounts." };

        const category = await PaymentCategory.findById(id);
        if (category?.isSystem) throw new Error("System categories cannot be deleted.");
        
        await PaymentCategory.findByIdAndDelete(id);
        revalidatePath("/payment-categories");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}