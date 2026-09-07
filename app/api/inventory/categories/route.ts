import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import InventoryCategory from "@/models/InventoryCategory";

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Fetch categories sorted alphabetically — type filter removed (only consumables now)
        const categories = await InventoryCategory.find({ isActive: true })
            .sort({ name: 1 })
            .lean();

        return NextResponse.json(categories);
    } catch (error: any) {
        console.error("API_REGISTRY_ERROR:", error);
        return NextResponse.json(
            { error: "Failed to sync registry categories." },
            { status: 500 }
        );
    }
}