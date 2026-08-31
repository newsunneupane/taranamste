// app/finance/settlements/page.tsx
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import PaymentCategory from "@/models/paymentCategory"; // ✨ NEW: Import the category model
import { SettlementDashboard } from "@/components/organisms/Admin/AdminSettlementDashboard";
import { requirePageAccess } from "@/lib/guards";

export default async function SettlementsPage() {
    await requirePageAccess("/settlements");
    await dbConnect();

    // 1. Get Destination Accounts
    // These are the accounts an admin can "deposit" money into (Bank or Main Vault)
    const destinationAccounts = await PaymentCategory.find({ 
        type: { $in: ["BANK", "CASH"] }, 
        isActive: true 
    }).lean();

    // 2. Aggregate Unsettled Balances using the new Category logic
    const aggregatedBalances = await Transaction.aggregate([
        // Stage 1: Filter for unverified/unsettled entries
        {
            $match: {
                status: "VERIFIED",
                isSettled: false
            }
        },
        // Stage 2: Join with PaymentCategory to get the "Type" (CASH vs PERSONAL)
        {
            $lookup: {
                from: "paymentcategories", 
                localField: "paymentCategory",
                foreignField: "_id",
                as: "catInfo"
            }
        },
        { $unwind: "$catInfo" },
        // Stage 3: Filter for only Cash collections or Staff Out-of-Pocket
        {
            $match: {
                $or: [
                    { "catInfo.type": "CASH", type: "INCOME" },
                    { "catInfo.type": "PERSONAL", type: "EXPENSE" }
                ]
            }
        },
        // Stage 4: Group by Staff member
        {
            $group: {
                _id: "$createdBy",
                netBalance: {
                    $sum: {
                        $cond: [
                            { $eq: ["$catInfo.type", "CASH"] }, 
                            "$amount", 
                            { $multiply: ["$amount", -1] }
                        ]
                    }
                },
                totalOutOfPocket: {
                    $sum: {
                        $cond: [
                            { $eq: ["$catInfo.type", "PERSONAL"] }, 
                            "$amount", 
                            0
                        ]
                    }
                }
            }
        },
        // Stage 5: Get User Names
        {
            $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "staffDetails" }
        },
        { $unwind: "$staffDetails" },
        {
            $project: {
                _id: { $toString: "$_id" },
                name: "$staffDetails.name",
                role: "$staffDetails.role",
                netBalance: 1,
                totalOutOfPocket: 1
            }
        }
    ]);

    // Sanitize for Client
    const sanitizedBanks = JSON.parse(JSON.stringify(destinationAccounts));

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <SettlementDashboard
                staffBalances={aggregatedBalances}
                bankAccounts={sanitizedBanks} // UI uses this for the "Deposit To" dropdown
            />
        </div>
    );
}