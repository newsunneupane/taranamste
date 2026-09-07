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
import PaymentCategory from "@/models/paymentCategory";

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
    await requirePageAccess("/finance");
    await dbConnect();

    const rawAccounts = await AccountHead.find({}).lean();
    const accounts = JSON.parse(JSON.stringify(rawAccounts));

    const rawInventory = await InventoryItem.find({}).lean();
    const inventory = JSON.parse(JSON.stringify(rawInventory));

    const rawCategories = await PaymentCategory.find({ isActive: true }).lean();
    const categories = JSON.parse(JSON.stringify(rawCategories));

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
        const isMoneyMovement = !txn.accountHead && String(txn.referenceNumber || "").startsWith("CONTRA-");
        if (!isMoneyMovement) {
            if (txn.type === "INCOME") totalIncome += txn.amount;
            if (txn.type === "EXPENSE") totalExpense += txn.amount;
        }
        return txn;
    });

    const netBalance = totalIncome - totalExpense; // Available Balance (cash)

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            <PageHeader accounts={accounts} categories={categories} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <SummaryCard
                    label="Available Balance"
                    value={netBalance}
                    variant={netBalance >= 0 ? "default" : "danger"}
                    className="col-span-2 md:col-span-1"
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
            className={`p-4 md:p-5 rounded-2xl border shadow-card flex flex-col justify-center gap-1.5 ${containerStyles[variant]} ${className}`}
        >
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                {label}
            </p>
            <p className={`text-xl md:text-2xl font-bold tracking-tight leading-none ${valueStyles[variant]}`}>
                <span className="opacity-60 pr-1 text-sm font-medium">{prefix}</span>
                NPR {Number(value).toLocaleString("en-IN")}
            </p>
        </div>
    );
}