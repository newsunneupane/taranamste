"use server";
import dbConnect from "@/lib/db";
import Child from "@/models/Child";
import { uploadImage } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


export async function createChild(prevState: any, formData: FormData) {
  await dbConnect();

  // Extract all standard text inputs
  const data = Object.fromEntries(formData.entries()) as any;

  // Extract files safely
  const photo = formData.get("photo") as File;
  const galleryFiles = formData.getAll("gallery") as File[];
  const docFiles = formData.getAll("documents") as File[];

  const galleryUrls: string[] = [];
  const documentUrls: string[] = [];

  try {
    // 1. Process Main Photo -> Folder: 'profiles'
    if (photo && photo.size > 0) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      data.profileImageUrl = await uploadImage(buffer, "profiles");
    }

    // 2. Process Gallery Photos -> Folder: 'gallery'
    for (const file of galleryFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        galleryUrls.push(await uploadImage(buffer, "gallery"));
      }
    }

    // 3. Process Vault Documents -> Folder: 'vault'
    for (const file of docFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        documentUrls.push(await uploadImage(buffer, "vault"));
      }
    }

    // 🚨 THE FIX: Delete the raw form File objects FIRST
    delete data.photo;
    delete data.gallery;
    delete data.documents;

    if (galleryUrls.length > 0) data.gallery = galleryUrls;
    if (documentUrls.length > 0) data.documents = documentUrls;

    if (!data.status) data.status = "IN_CARE";

    await Child.create(data);

    revalidatePath("/children");

    return { success: true, error: null };

  } catch (error: any) {
    console.error("Failed to create child record:", error);
    return { success: false, error: "Failed to create child record: " + error.message };
  }
}


export async function updateChild(prevState: any, formData: FormData) {
  await dbConnect();
  const data = Object.fromEntries(formData.entries()) as any;
  const id = data._id;

  const photo = formData.get("photo") as File;
  const galleryFiles = formData.getAll("gallery") as File[];
  const docFiles = formData.getAll("documents") as File[];

  const newGalleryUrls: string[] = [];
  const newDocumentUrls: string[] = [];

  try {
    if (photo && photo.size > 0) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      data.profileImageUrl = await uploadImage(buffer, "profiles");
    }

    for (const file of galleryFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        newGalleryUrls.push(await uploadImage(buffer, "gallery"));
      }
    }

    for (const file of docFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        newDocumentUrls.push(await uploadImage(buffer, "vault"));
      }
    }

    delete data._id;
    delete data.photo;
    delete data.gallery;
    delete data.documents;

    const updatePayload: any = { $set: data };

    if (newGalleryUrls.length > 0 || newDocumentUrls.length > 0) {
      updatePayload.$push = {};
      if (newGalleryUrls.length > 0) updatePayload.$push.gallery = { $each: newGalleryUrls };
      if (newDocumentUrls.length > 0) updatePayload.$push.documents = { $each: newDocumentUrls };
    }

    await Child.findByIdAndUpdate(id, updatePayload, { runValidators: true });

    revalidatePath("/children");
    revalidatePath(`/children/${id}`);
    return { success: true, error: null };

  } catch (error: any) {
    console.error("Failed to update child record:", error);
    return { success: false, error: "Failed to update child record: " + error.message };
  }
}

export async function quickUploadMedia(prevState: any, formData: FormData) {
  await dbConnect();
  const childId = formData.get("childId") as string;
  const uploadType = formData.get("uploadType") as string;
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0 || files[0].size === 0) {
    return { error: "Please select at least one file to upload.", success: false };
  }

  const uploadedUrls: string[] = [];

  try {
    // ✨ Folder logic: Match folder name to the upload type
    const folderName = uploadType === "documents" ? "vault" : "gallery";

    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        uploadedUrls.push(await uploadImage(buffer, folderName));
      }
    }

    if (uploadedUrls.length > 0) {
      const updatePayload: any = { $push: {} };
      if (uploadType === "documents") {
        updatePayload.$push.documents = { $each: uploadedUrls };
      } else {
        updatePayload.$push.gallery = { $each: uploadedUrls };
      }

      await Child.findByIdAndUpdate(childId, updatePayload);
    }

    revalidatePath(`/children/${childId}`);
    revalidatePath(`/children`);
    return { success: true, error: null };

  } catch (error: any) {
    console.error("Quick upload error:", error);
    return { error: "Failed to upload files: " + error.message, success: false };
  }
}