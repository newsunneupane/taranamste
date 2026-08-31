import { VerificationDashboard } from "@/components/organisms/Admin/VerificationDashboard";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import AccountHead from "@/models/AccountHead"; // ✨ Ensure this is imported so Mongoose registers it
import { requirePageAccess } from "@/lib/guards";

export default async function ApprovalsPage() {
    await requirePageAccess("/approvals");
    await dbConnect();
    
    // ✨ Fetch PENDING transactions and populate the user, account head and payment category
    const pendingData = await Transaction.find({ status: "PENDING" })
        .populate("createdBy", "name email role")
        .populate("accountHead", "name code")
        .populate("paymentCategory", "name type identifier")
        .sort({ date: -1 })
        .lean();

    // Convert MongoDB _ids to strings and strip non-serializable values for Client Components
    const sanitizedData = pendingData.map((tx: any) => {
        const safe = { ...tx };
        safe._id = tx._id.toString();
        safe.createdBy = tx.createdBy
            ? { name: tx.createdBy.name, email: tx.createdBy.email, role: tx.createdBy.role, _id: tx.createdBy._id?.toString() }
            : null;
        safe.accountHead = tx.accountHead
            ? { name: tx.accountHead.name, code: tx.accountHead.code, _id: tx.accountHead._id?.toString() }
            : "Unknown Category";
        safe.paymentCategory = tx.paymentCategory
            ? { name: tx.paymentCategory.name, type: tx.paymentCategory.type, identifier: tx.paymentCategory.identifier }
            : null;
        safe.verifiedBy = tx.verifiedBy ? tx.verifiedBy.toString() : null;
        safe.date = tx.date ? new Date(tx.date).toISOString() : null;
        safe.createdAt = tx.createdAt ? new Date(tx.createdAt).toISOString() : null;
        safe.updatedAt = tx.updatedAt ? new Date(tx.updatedAt).toISOString() : null;
        return safe;
    });

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <VerificationDashboard pendingTransactions={sanitizedData} />
        </div>
    );
}