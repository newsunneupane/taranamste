"use server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function registerUser(prevState: any, formData: FormData) {
  // Self-registration is disabled. All accounts are created by SuperAdmin via User Management.
  return { error: "Self-registration is disabled. Please contact SuperAdmin for an account." };
  await dbConnect();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Security keys do not match." };
  }
  if (role === "ADMIN") {
    return { error: "Security Violation: Cannot request Administrator privileges." };
  }

  try {
    // 2. Check for duplicates
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "An identity with this email already exists in the system." };
    }

    // 3. Encrypt Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create locked account
    await User.create({
      name,
      email,
      phone,
      passwordHash,
      role,
      isActive: false // Locked until Admin approves
    });

    return { success: true };
  } catch (e: any) {
    return { error: "Database protocol failure: " + e.message };
  }
}