"use server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/guards";
import { ROLES } from "@/lib/permission";

export async function updateUserStatus(userId: string, newStatus: boolean) {
  try {
    await dbConnect();
    
    // Only an ADMIN may change account access.
    const role = await requireRole(ROLES.ADMIN);
    if (!role) return { success: false, error: "Security Violation: Only Administrators can manage accounts." };

    await User.findByIdAndUpdate(userId, { isActive: newStatus });
    
    revalidatePath("/usersmanagement");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
    try {
      await dbConnect();
      const role = await requireRole(ROLES.ADMIN);
      if (!role) return { success: false, error: "Security Violation: Only Administrators can delete accounts." };

      await User.findByIdAndDelete(userId);
      revalidatePath("/usersmanagement");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}