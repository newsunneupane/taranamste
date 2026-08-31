"use server";
import dbConnect from "@/lib/db";
import Staff from "@/models/Staff";
import User from "@/models/User"; 
import bcrypt from "bcryptjs";
import { normalizeStaff } from "@/lib/normalizers";
import { revalidatePath } from "next/cache";

export async function createStaff(prevState: any, formData: FormData) {
  await dbConnect();

  // 1. Extract Auth-specific fields
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
  // 2. Normalize the rest of the profile data
  const payload = normalizeStaff(formData) as any;

  try {
    let finalUserId = formData.get("userId") as string || null;

    // 3. User Provisioning Logic
    if (username && password) {
      // Check for existing identity to prevent crashes
      const existingUser = await User.findOne({ 
        $or: [{ username }, { email: payload.email }] 
      });
      
      if (existingUser) {
        return { success: false, error: "Identity Conflict: Username or Email already active." };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name: payload.fullName,
        email: payload.email,
        username: username,
        passwordHash: hashedPassword,
        role: "STAFF", 
        image: payload.profileImage || null
      });
      
      finalUserId = newUser._id;
    }

    // ✨ THE CRITICAL FIX: Clean the payload
    // We don't want plain-text passwords or usernames in the Staff collection
    delete payload.username;
    delete payload.password;
    
    // Assign the linked User ID
    payload.userId = finalUserId;

    // 4. Finalize Staff Registry
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
  await dbConnect();
  const id = formData.get("_id") as string;
  if (!id) return { success: false, error: "Critical Error: Personnel ID missing." };

  const payload = normalizeStaff(formData) as any;
  
  // Clean payload for updates as well
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