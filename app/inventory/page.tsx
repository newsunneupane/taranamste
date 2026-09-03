import dbConnect from "@/lib/db";
import InventoryItem from "@/models/InventoryItem";
import InventoryLog from "@/models/InventoryLog";
import InventoryCategory from "@/models/InventoryCategory";
import "@/models/InventoryCategory";
import InventoryDashboard from "@/components/organisms/Accounting/Inventory/InventoryDashboard";
import InventoryHistoryTable from "@/components/organisms/Accounting/Inventory/InventoryHistoryTable";
import { requirePageAccess } from "@/lib/guards";

export default async function InventoryPage() {
    await requirePageAccess("/inventory");
    await dbConnect();

    const rawItems = await InventoryItem.find({}).populate("category", "name type").sort({ name: 1 }).lean();
    const safeItems = JSON.parse(JSON.stringify(rawItems));
    const items = safeItems.map((item: any) => ({
        ...item,
        type: item.type || "CONSUMABLE",
    }));

    const rawLogs = await InventoryLog.find({})
        .populate("item", "name")
        .populate({ path: "item", populate: { path: "category", select: "name type" } })
        .populate("createdBy", "name")
        .sort({ date: -1 })
        .lean();
    const logs = JSON.parse(JSON.stringify(rawLogs));

    const rawCats = await InventoryCategory.find({ isActive: true }).sort({ name: 1 }).lean();
    const categories = JSON.parse(JSON.stringify(rawCats));

    return (
        // ✨ FIX: Added pt-20 and standardized padding
        <div className="max-w-7xl mx-auto space-y-8 md:p-6 md:pt-6 lg:p-8 transition-colors duration-500">
            
            {/* ✨ Standardized Header Wrapper */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 md:p-6 rounded-[2rem] shadow-sm border border-border">
                <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shrink-0">
                        📦
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <h1 className="font-ubuntu text-xl md:text-2xl font-black text-text tracking-tight truncate">
                            Inventory
                        </h1>
                        <p className="font-ubuntu text-xs md:text-sm text-text-muted font-medium truncate">
                            Track stock levels for food, medical supplies, and more.
                        </p>
                    </div>
                </div>
            </div>

            <InventoryDashboard items={items} />

            <InventoryHistoryTable logs={logs} categories={categories} items={items} />
        </div>
    );
}