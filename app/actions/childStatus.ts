"use server";

import dbConnect from "@/lib/db";
import ChildStatus from "@/models/ChildCurrentStatus";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

export type ActionState = {
  success: boolean;
  data?: { label: string; value: string } | null;
  error?: string | null;
};

export async function saveChildStatus(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const w = await requireWrite("/children");
  if (!(w as any).ok) return { success: false, error: (w as any).error, data: null };
  await dbConnect();
  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    return { success: false, error: "Status name cannot be empty.", data: null };
  }

  try {
    const status = await ChildStatus.create({ 
        name: name.trim() 
    });
    
    revalidatePath("/"); 
    
    return { 
        success: true, 
        data: { label: status.name, value: status.name },
        error: null
    };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, error: "This status label already exists.", data: null };
    }
    return { success: false, error: "Internal Registry Error. Try again.", data: null };
  }
}