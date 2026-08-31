// app/my-finances/page.tsx
import { MyFinancesDashboard } from "@/components/organisms/staffs/MyfinancesDashBoard";
import dbConnect from "@/lib/db";
import Staff from "@/models/Staff";
import Transaction from "@/models/Transaction";
import "@/models/AccountHead";
import "@/models/paymentCategory"; // ✨ Ensure model is registered
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function MyFinancesPage() {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/");

    const userId = session.user.id;

    // 1. Fetch Data & Populate Payment Category
    const staffProfile = await Staff.findOne({ userId }).lean();
    const rawTransactions = await Transaction.find({ createdBy: userId })
        .populate("accountHead", "name code")
        .populate("paymentCategory", "name type") // ✨ Need the category type (CASH, BANK, etc.)
        .sort({ date: -1 })
        .lean();

    // 2. Logic Overhaul: Balance Calculations
    let netBalance = 0;
    let pendingReimbursement = 0;

    rawTransactions.forEach((tx: any) => {
        // We look at the Category Type instead of a hardcoded string
        const categoryType = tx.paymentCategory?.type; 
        
        const isExpense = tx.type === "EXPENSE";
        const isIncome = tx.type === "INCOME";
        
        // "OUT_OF_POCKET" is now a PaymentCategory with type "DEBT" or "PERSONAL"
        // "CASH" is a PaymentCategory with type "CASH"
        const isPersonalDebt = categoryType === "PERSONAL" || categoryType === "DEBT";
        const isCashHandled = categoryType === "CASH";

        if (tx.status === "VERIFIED" && !tx.isSettled) {
            // Case A: Staff spent their own money (Orphanage owes Staff)
            if (isPersonalDebt && isExpense) netBalance += tx.amount;
            
            // Case B: Staff spent orphanage cash or collected donation (Staff owes Orphanage)
            if (isCashHandled && isExpense) netBalance -= tx.amount;
            if (isCashHandled && isIncome) netBalance -= tx.amount;
        }

        // Tracking PENDING items for UI visibility
        if (tx.status === "PENDING") {
            if (isPersonalDebt && isExpense) pendingReimbursement += tx.amount;
        }
    });

    // 3. Clean Serialization
    const sanitizedTx = JSON.parse(JSON.stringify(rawTransactions));
    const sanitizedProfile = staffProfile ? JSON.parse(JSON.stringify(staffProfile)) : null;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <MyFinancesDashboard
                transactions={sanitizedTx}
                netBalance={netBalance}
                pendingAmount={pendingReimbursement}
                profile={sanitizedProfile}
                userName={session.user.name || "Personnel"}
            />
        </div>
    );
}