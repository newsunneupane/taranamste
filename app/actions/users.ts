"use server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentActor, requireWrite } from "@/lib/guards";

async function requireSuperAdmin() {
  const actor = await getCurrentActor();
  if (!actor?.isSuperAdmin) return { ok: false as const, error: "Security Violation: Only SuperAdmin can manage accounts." };
  return { ok: true as const, actor };
}

export async function updateUserStatus(userId: string, newStatus: boolean) {
  try {
    await dbConnect();
    const chk = await requireSuperAdmin();
    if (!chk.ok) return { success: false, error: chk.error };
    const u: any = await User.findById(userId);
    if (!u) return { success: false, error: "User not found." };
    const updates: any = { isActive: newStatus };
    if (newStatus && (!u.permissions || Object.keys(u.permissions).length === 0)) {
      // grant minimal legacy access so pending users aren't locked out after approval
      updates.permissions = {
        "/children": { read: true, write: false },
        "/children/:path*": { read: true, write: false },
        "/my-finances": { read: true, write: false },
      };
    }
    await User.findByIdAndUpdate(userId, updates);
    revalidatePath("/usersmanagement");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    await dbConnect();
    const chk = await requireSuperAdmin();
    if (!chk.ok) return { success: false, error: chk.error };
    const actor = await getCurrentActor();
    if (actor?.id === userId) return { success: false, error: "Cannot delete your own SuperAdmin account." };
    await User.findByIdAndDelete(userId);
    revalidatePath("/usersmanagement");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createUserWithPermissions(prevState: any, formData: FormData) {
  try {
    await dbConnect();
    const chk = await requireSuperAdmin();
    if (!chk.ok) return { success: false, error: chk.error };

    const name = (formData.get("name") as string || "").trim();
    const email = (formData.get("email") as string || "").trim().toLowerCase();
    const phone = (formData.get("phone") as string || "").trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const permissionsRaw = formData.get("permissions") as string;

    if (!name || !email || !password) return { success: false, error: "Name, email and password are required." };
    if (password !== confirmPassword) return { success: false, error: "Passwords do not match." };
    if (password.length < 6) return { success: false, error: "Password must be at least 6 characters." };

    const exists = await User.findOne({ email });
    if (exists) return { success: false, error: "Email already registered." };

    let permissions: any = {};
    try { permissions = permissionsRaw ? JSON.parse(permissionsRaw) : {}; } catch { permissions = {}; }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      phone,
      passwordHash,
      isActive: true,
      isSuperAdmin: false,
      permissions,
      role: "STAFF",
    });

    revalidatePath("/usersmanagement");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserPermissions(userId: string, permissions: any) {
  try {
    await dbConnect();
    const chk = await requireSuperAdmin();
    if (!chk.ok) return { success: false, error: chk.error };
    // prevent removing own superadmin accidentally via this path (not allowed to edit superadmin perms here)
    const target = await User.findById(userId);
    if (!target) return { success: false, error: "User not found." };
    if (target.isSuperAdmin) return { success: false, error: "Cannot modify SuperAdmin permissions." };
    await User.findByIdAndUpdate(userId, { permissions });
    revalidatePath("/usersmanagement");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserDetails(userId: string, data: { name?: string; email?: string; phone?: string }) {
  try {
    await dbConnect();
    const chk = await requireSuperAdmin();
    if (!chk.ok) return { success: false, error: chk.error };
    const target = await User.findById(userId);
    if (!target) return { success: false, error: "User not found." };
    const updates: any = {};
    if (data.name?.trim()) updates.name = data.name.trim();
    if (data.email?.trim()) {
      const em = data.email.trim().toLowerCase();
      const dup = await User.findOne({ email: em, _id: { $ne: userId } });
      if (dup) return { success: false, error: "Email already in use." };
      updates.email = em;
    }
    if (data.phone !== undefined) updates.phone = data.phone.trim();

    await User.findByIdAndUpdate(userId, updates);

    // also sync linked Staff record name/email/phone if exists (staff names editable by admin)
    const staff = await Staff.findOne({ userId });
    if (staff) {
      const sUpd: any = {};
      if (updates.name) sUpd.fullName = updates.name;
      if (updates.email) sUpd.email = updates.email;
      if (updates.phone !== undefined) sUpd.phone = updates.phone;
      if (Object.keys(sUpd).length) await Staff.findByIdAndUpdate(staff._id, sUpd);
    }

    revalidatePath("/usersmanagement");
    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    await dbConnect();
    const chk = await requireSuperAdmin();
    if (!chk.ok) return { success: false, error: chk.error };
    if (!newPassword || newPassword.length < 6) return { success: false, error: "Password must be at least 6 characters." };
    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { passwordHash: hash });
    revalidatePath("/usersmanagement");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
