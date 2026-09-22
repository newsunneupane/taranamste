"use server";

import dbConnect from "@/lib/db";
import AccountHead from "@/models/AccountHead";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

export async function addAccountHead(prevState: any, formData: FormData) {
    await dbConnect();

    try {
        // Check write on either accounts_headers or finance
        const a = await requireWrite("/accounts_headers");
        const b = await requireWrite("/finance");
        if (!(a as any).ok && !(b as any).ok) return { success: false, error: "Write access denied. Need Finance or Chart of Accounts permission." };

        const id = formData.get("id") as string;

        // ✨ Extract the Bank Checkbox (FormData checkboxes return 'on' if checked, null if not)
        const isBankAccount = formData.get("isBankAccount") === "on";

        // ✨ Validation: accountNumber required when Is Bank Account is ticked
        if (isBankAccount) {
            const accNum = (formData.get("accountNumber") as string)?.trim();
            if (!accNum) {
                return { success: false, error: "Account Number is required when Is Bank Account is checked." };
            }
        }

        // ✨ Build the payload, injecting bank details only if the checkbox was ticked
        const accountData: any = {
            name: (formData.get("name") as string)?.trim(),
            type: formData.get("type"),
            fundCategory: formData.get("fundCategory") || "UNRESTRICTED",
            code: (formData.get("code") as string)?.trim().toUpperCase(),
            description: (formData.get("description") as string)?.trim(),
            isBankAccount: isBankAccount,
        };

        if (!accountData.name || !accountData.code || !accountData.type) {
            return { success: false, error: "Name, GL Code and Root Type are required." };
        }

        if (isBankAccount) {
            accountData.bankDetails = {
                accountNumber: (formData.get("accountNumber") as string)?.trim(),
                bankName: (formData.get("bankName") as string)?.trim(),
                branch: (formData.get("branch") as string)?.trim()
            };
        } else {
            // Clear them out if the user unchecked the box on an edit
            accountData.bankDetails = { accountNumber: "", bankName: "", branch: "" };
        }

        if (id) {
            const existing = await AccountHead.findById(id);
            if (!existing) return { success: false, error: "Account head not found." };

            if (existing.isSystem) {
                // Protect System Accounts, but allow updating bank details if it is a system bank account
                await AccountHead.findByIdAndUpdate(id, { 
                    description: accountData.description, 
                    isBankAccount: accountData.isBankAccount,
                    bankDetails: accountData.bankDetails
                }, { runValidators: true });
            } else {
                await AccountHead.findByIdAndUpdate(id, accountData, { runValidators: true });
            }
        } else {
            await AccountHead.create(accountData);
        }

        revalidatePath("/finance");
        revalidatePath("/accounts_headers"); 
        
        return { success: true, error: null };
    } catch (error: any) {
        if (error.code === 11000) {
            return { success: false, error: "An account with this Name or GL Code already exists." };
        }
        return { success: false, error: error.message || "Failed to save Account Head" };
    }
}

