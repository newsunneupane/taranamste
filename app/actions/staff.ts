"use server";
import dbConnect from "@/lib/db";
import Staff from "@/models/Staff";
import { normalizeStaff } from "@/lib/normalizers";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

export async function createStaff(prevState: any, formData: FormData) {
  const w = await requireWrite("/staff");
  if (!(w as any).ok) return { success: false, error: (w as any).error };
  await dbConnect();

  const payload = normalizeStaff(formData) as any;

  try {
    let finalUserId = formData.get("userId") as string || null;

    // User accounts are now created only via SuperAdmin User Management.
    // Ignore any username/password fields from the staff form.
    delete payload.username;
    delete payload.password;
    
    payload.userId = finalUserId || null;

    await Staff.create(payload);

    revalidatePath("/staff");
    return { success: true, error: null };

  } catch (error: any) {
    if (error.code === 11000) {
      return { success: false, error: "Database Conflict: A staff record with this email/phone already exists." };
    }
    console.error("Registry Error:", error);
    return { success: false, error: "Protocol Failure: " + error.message };
  }
}

export async function updateStaff(prevState: any, formData: FormData) {
  const w = await requireWrite("/staff");
  if (!(w as any).ok) return { success: false, error: (w as any).error };
  await dbConnect();
  const id = formData.get("_id") as string;
  if (!id) return { success: false, error: "Critical Error: Personnel ID missing." };

  const payload = normalizeStaff(formData) as any;
  
  delete payload.username;
  delete payload.password;

  try {
    await Staff.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    revalidatePath("/staff");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, error: "Update Protocol Failed: " + error.message };
  }
}