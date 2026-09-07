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

    const rawItems = await InventoryItem.find({}).populate("category", "name").sort({ name: 1 }).lean();
    const safeItems = JSON.parse(JSON.stringify(rawItems));
    const items = safeItems;

    const rawLogs = await InventoryLog.find({})
        .populate("item", "name")
        .populate({ path: "item", populate: { path: "category", select: "name" } })
        .populate("createdBy", "name")
        .sort({ date: -1 })
        .lean();
    const logs = JSON.parse(JSON.stringify(rawLogs));

    const rawCats = await InventoryCategory.find({ isActive: true }).sort({ name: 1 }).lean();
    const categories = JSON.parse(JSON.stringify(rawCats));

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 md:p-6 rounded-2xl shadow-card border border-border">
                <div className="flex items-center gap-4 w-full">
                    <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-xl border border-primary/15 shrink-0">
                        📦
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <h1 className="text-base md:text-lg font-bold text-text tracking-tight truncate">
                            Inventory
                        </h1>
                        <p className="text-sm text-text-muted truncate">
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