"use server";
import dbConnect from "@/lib/db";
import Guardian from "@/models/Guardian";
import { uploadFile, uploadImage } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWrite } from "@/lib/guards";

export async function createGuardian(prevState: any, formData: FormData) {
    const w = await requireWrite("/guardians");
    if (!(w as any).ok) return { success: false, error: (w as any).error };
    await dbConnect();
    const rawData = Object.fromEntries(formData.entries()) as any;
    
    // Handle background check files
    const docFiles = formData.getAll("documents") as File[];
    const documentUrls: string[] = [];

    // We'll use this to track if we should redirect after the try/catch
    let success = false;

    try {
        for (const file of docFiles) {
            // Check if it's actually a file with content
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                // Using the 'guardian_vault' folder for clean organization
                const url = await uploadImage(buffer, "guardian_vault");
                documentUrls.push(url);
            }
        }

        const payload = {
            ...rawData,
            annualIncome: Number(rawData.annualIncome) || 0,
            backgroundCheckDocs: documentUrls
        };

        await Guardian.create(payload);
        success = true;

    } catch (error: any) {
        console.error("Guardian Save Error:", error);
        
        // Return structured error that matches our ActionState type
        return { 
            error: error.code === 11000 
                ? "This email is already registered to a guardian." 
                : "Database error: " + (error.message || "Unknown error"),
            success: false 
        };
    }

    // Redirect must happen OUTSIDE the try/catch block 
    // because redirect() works by throwing a special Next.js error
    if (success) {
        revalidatePath("/guardians");
        redirect("/guardians");
    }
}

export async function uploadGuardianDoc(guardianId: string, formData: FormData) {
    const w2 = await requireWrite("/guardians");
    if (!(w2 as any).ok) return { success: false, error: (w2 as any).error };
    await dbConnect();

    try {
        const file = formData.get("document") as File;
        
        // 1. Validate the file exists and isn't empty
        if (!file || file.size === 0) {
            throw new Error("No file was uploaded.");
        }

        // 2. Convert the standard web File into a Node.js Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // 3. Upload to Cloudinary into the 'guardian_vault' folder
        const cloudUrl = await uploadFile(buffer, "guardian_vault");

        // 4. Save the new secure URL to MongoDB
        await Guardian.findByIdAndUpdate(guardianId, {
            $push: { backgroundCheckDocs: cloudUrl } 
        });

        // 5. Instantly refresh the UI
        revalidatePath(`/guardians/${guardianId}`);
        return { success: true };

    } catch (error: any) {
        console.error("Single Document Upload Error:", error);
        return { success: false, error: error.message };
    }
}


export async function deleteGuardianDoc(guardianId: string, docUrl: string) {
    const w3 = await requireWrite("/guardians");
    if (!(w3 as any).ok) return { success: false, error: (w3 as any).error };
    await dbConnect();
    try {
        // Remove the specific URL from the array
        await Guardian.findByIdAndUpdate(guardianId, {
            $pull: { backgroundCheckDocs: docUrl }
        });

            //use cloudinary delete

        revalidatePath(`/guardians/${guardianId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function updateGuardian(id: string, prevState: any, formData: FormData) {
    const w4 = await requireWrite("/guardians");
    if (!(w4 as any).ok) return { success: false, error: (w4 as any).error };
    await dbConnect();
    let success = false;

    try {
        const updateData = {
            primaryName: formData.get("primaryName"),
            secondaryName: formData.get("secondaryName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            address: formData.get("address"),
            occupation: formData.get("occupation"),
            annualIncome: Number(formData.get("annualIncome")) || 0,
            type: formData.get("type"),
        };

        const result = await Guardian.findByIdAndUpdate(id, updateData, { runValidators: true });
        if (!result) throw new Error("Guardian not found.");

        success = true;
    } catch (error: any) {
        if (error.code === 11000) return { success: false, error: "This email is already in use." };
        return { success: false, error: error.message };
    }

    if (success) {
        revalidatePath(`/guardians/${id}`);
        redirect(`/guardians/${id}`);
    }
}