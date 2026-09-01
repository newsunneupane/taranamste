"use server";

import dbConnect from "@/lib/db";
import InventoryCategory from "@/models/InventoryCategory";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

// ✨ Interface strictly matching the useActionState initialState in your modals
export type CategoryActionState = {
  success: boolean;
  data?: { label: string; value: string } | null;
  error?: string | null;
};

export async function saveInventoryCategory(
  prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const w = await requireWrite("/inventory");
  if (!(w as any).ok) return { success: false, error: (w as any).error, data: null };
  await dbConnect();

  const name = formData.get("name") as string;
  const type = formData.get("type") as "CONSUMABLE" | "ASSET";

  // 1. Core Protocol Validation
  if (!name || name.trim().length === 0) {
    return { 
      success: false, 
      error: "Label is required.", 
      data: null 
    };
  }

  if (!type) {
    return { 
      success: false, 
      error: "Registry type (Asset/Consumable) is missing.", 
      data: null 
    };
  }

  try {
    // 2. Create the entry
    const category = await InventoryCategory.create({
      name: name.trim(),
      type,
      isActive: true
    });

    // 3. Force cache refresh so dropdowns and tables update globally
    revalidatePath("/", "layout"); 

    return {
      success: true,
      error: null,
      data: { 
        label: category.name, 
        // ✨ Convert ObjectId to string for client-side Select components
        value: category._id.toString() 
      }
    };

  } catch (err: any) {
    console.error("Registry Sync Failure:", err);

    // 4. Handle Duplicate Logic (Unique Index: Name + Type)
    if (err.code === 11000) {
      return { 
        success: false, 
        error: `The ${type.toLowerCase()} class "${name}" already exists.`, 
        data: null 
      };
    }

    return { 
      success: false, 
      error: "Internal Registry Error. Protocol failed.", 
      data: null 
    };
  }
}