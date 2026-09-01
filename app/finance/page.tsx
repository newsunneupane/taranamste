import dbConnect from "@/lib/db";
import AccountHead from "@/models/AccountHead";
import Transaction from "@/models/Transaction";
import InventoryItem from "@/models/InventoryItem";
import "@/models/AccountHead";
import "@/models/InventoryLog";
import "@/models/InventoryItem";

import PageHeader from "@/components/organisms/Accounting/Transactions/PageHeader";
import FinanceLedger from "@/components/organisms/Accounting/Transactions/LedgerTable/FinanceLedger";
import { requirePageAccess } from "@/lib/guards";

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
    await requirePageAccess("/finance");
    await dbConnect();

    const rawAccounts = await AccountHead.find({}).lean();
    const accounts = JSON.parse(JSON.stringify(rawAccounts));

    const rawInventory = await InventoryItem.find({}).lean();
    const inventory = JSON.parse(JSON.stringify(rawInventory));

    const rawTransactions = await Transaction.find({})
        .populate("accountHead", "name code")
        .populate("paymentCategory") 

        .populate({
            path: "logId",
            populate: { path: "item" },
        })
        .sort({ date: -1 })
        .lean();

    const safeTransactions = JSON.parse(JSON.stringify(rawTransactions));

    let totalIncome = 0;
    let totalExpense = 0;

    const transactions = safeTransactions.map((txn: any) => {
        if (txn.type === "INCOME") totalIncome += txn.amount;
        if (txn.type === "EXPENSE") totalExpense += txn.amount;
        return txn;
    });

    const netBalance = totalIncome - totalExpense;

    return (
        <div className="max-w-7xl mx-auto space-y-5 w-full p-3 md:p-5 lg:p-6 transition-colors duration-500">
            <PageHeader />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4">
                <SummaryCard
                    label="Available Balance"
                    value={netBalance}
                    variant={netBalance >= 0 ? "default" : "danger"}
                    className="col-span-2 md:col-span-1" // ✨ Makes Balance span full-width on mobile!
                />
                <SummaryCard
                    label="Total Inflow"
                    value={totalIncome}
                    variant="success"
                    prefix="+ "
                />
                <SummaryCard
                    label="Total Outflow"
                    value={totalExpense}
                    variant="warning"
                    prefix="- "
                />
            </div>
            <FinanceLedger
                transactions={transactions}
                accounts={accounts}
                inventory={inventory}
            />
        </div>
    );
}

/* =========================
   SUMMARY CARD COMPONENT
========================= */

type Variant = "default" | "success" | "warning" | "danger";

function SummaryCard({
    label,
    value,
    variant = "default",
    prefix = "",
    className = "", // ✨ Added className prop for grid spanning
}: {
    label: string;
    value: number;
    variant?: Variant;
    prefix?: string;
    className?: string;
}) {
    const containerStyles: Record<Variant, string> = {
        default: "bg-card border-border",
        success: "bg-success/10 border-success/20",
        warning: "bg-warning/10 border-warning/20",
        danger: "bg-danger/10 border-danger/20",
    };

    const valueStyles: Record<Variant, string> = {
        default: "text-text",
        success: "text-success",
        warning: "text-warning",
        danger: "text-danger",
    };

    return (
        <div
            className={`p-3 md:p-4 rounded-xl border shadow-sm flex flex-col justify-center gap-1 transition-colors duration-500 ${containerStyles[variant]} ${className}`}
        >
            <p className="font-ubuntu text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary">
                {label}
            </p>

            <p className={`text-lg md:text-xl font-black tracking-tight leading-none ${valueStyles[variant]}`}>
                <span className="opacity-80 pr-1 text-[11px]">{prefix}</span>
                NPR {Number(value).toLocaleString("en-IN")}
            </p>
        </div>
    );
}