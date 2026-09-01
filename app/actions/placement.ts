"use server";

import dbConnect from "@/lib/db";
import Guardian from "@/models/Guardian";
import Child from "@/models/Child";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";

/**
 * ACTION: UPDATE PLACEMENT TYPE
 */
export async function updatePlacement(prevState: any, formData: FormData) {
    try {
        const w = await requireWrite("/guardians");
        if (!(w as any).ok) return { error: (w as any).error };
        await dbConnect();

        const guardianId = formData.get("guardianId");
        const childId = formData.get("childId");
        const placementType = formData.get("placementType");

        if (!guardianId || !childId || !placementType) {
            return { error: "Incomplete Protocol: Missing Required IDs" };
        }

        await Child.findByIdAndUpdate(childId, { 
            status: placementType === "ADOPTED" ? "ADOPTED" : "FOSTERED" 
        });

        revalidatePath("/guardians");
        return { success: true };

    } catch (error: any) {
        return { error: `Registry Fault: ${error.message}` };
    }
}

/**
 * ACTION: TERMINATE PLACEMENT
 */
export async function removePlacement(prevState: any, formData: FormData) {
    try {
        const w = await requireWrite("/guardians");
        if (!(w as any).ok) return { error: (w as any).error };
        await dbConnect();

        const guardianId = formData.get("guardianId");
        const childId = formData.get("childId");

        if (!guardianId || !childId) {
            return { error: "Purge Fault: Missing Identity Keys" };
        }

        await Guardian.findByIdAndUpdate(guardianId, {
            $pull: { assignedChildren: childId }
        });

        await Child.findByIdAndUpdate(childId, { 
            status: "IN_CARE" 
        });

        revalidatePath("/guardians");
        return { success: true };

    } catch (error: any) {
        return { error: `Termination Failure: ${error.message}` };
    }
}

/**
 * ACTION: ASSIGN CHILD TO GUARDIAN
 */
export async function assignChildToGuardian(prevState: any, formData: FormData) {
    try {
        const w = await requireWrite("/guardians");
        if (!(w as any).ok) return { error: (w as any).error };
        await dbConnect();

        const guardianId = formData.get("guardianId");
        const childId = formData.get("childId");
        const placementType = formData.get("placementType");

        if (!guardianId || !childId) {
            return { error: "Assignment Fault: Selection Required" };
        }

        await Guardian.findByIdAndUpdate(guardianId, {
            $addToSet: { assignedChildren: childId }
        });

        await Child.findByIdAndUpdate(childId, { 
            status: placementType === "ADOPTED" ? "ADOPTED" : "FOSTERED" 
        });

        revalidatePath("/guardians");
        return { success: true };

    } catch (error: any) {
        return { error: `Deployment Failure: ${error.message}` };
    }
}