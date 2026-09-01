"use server";
import dbConnect from "@/lib/db";
import ActionPlan from "@/models/ActionPlan";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

export async function createActionItem(prevState: any, formData: FormData) {
    const w = await requireWrite("/children");
    if (!(w as any).ok) return { success: false, error: (w as any).error };
    await dbConnect();
    const data = Object.fromEntries(formData.entries());

    try {
        await ActionPlan.create({
            ...data,
            childId: data.childId,
            dueDate: data.dueDate ? new Date(data.dueDate as string) : undefined,
            estimatedCost: Number(data.estimatedCost) || 0
        });

        revalidatePath(`/children/${data.childId}`);
        revalidatePath(`/children`);
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: "Failed to create action item: " + error.message };
    }
}