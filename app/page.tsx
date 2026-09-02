import Link from "next/link";
import dbConnect from "@/lib/db";
import Child from "@/models/Child";
import Staff from "@/models/Staff";
import Transaction from "@/models/Transaction";
import InventoryItem from "@/models/InventoryItem";
import ActionPlan from "@/models/ActionPlan";
import User from "@/models/User";
import { Sparkles, Activity, ShieldAlert, Clock, Wallet } from "lucide-react";
import QuickActionSidebar from "@/components/organisms/ActionButtonsDashboard";
import AlertStatCard from "@/components/organisms/dashboard/AlertStatCard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export const dynamic = 'force-dynamic';

export default async function Home() {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const isAdmin = !!(session?.user as any)?.isSuperAdmin;

  const [
    kidsCount, 
    staffCount, 
    financeStats, 
    lowStockItems, 
    urgentActions,
    pendingUsersCount,
    pendingTransactionsCount,
    unsettledCashResult
  ] = await Promise.all([
    Child.countDocuments({ status: "IN_CARE" }),
    Staff.countDocuments({ status: "ACTIVE" }),
    
    // Main Balance: Sum of all VERIFIED transactions
    Transaction.aggregate([
      { $match: { status: "VERIFIED" } }, 
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } }
        }
      }
    ]),
    
    InventoryItem.find({ $expr: { $lte: ["$currentStock", "$minimumStockLevel"] } })
      .sort({ currentStock: 1 }).limit(3).lean(),
    
    ActionPlan.find({ status: { $in: ['PENDING', 'IN_PROGRESS'] }, priority: { $in: ['HIGH', 'URGENT'] } })
      .populate('childId', 'firstName lastName')
      .populate('assignedStaff', 'fullName')
      .sort({ dueDate: 1 }).limit(4).lean(),

    User.countDocuments({ isActive: false }),
    Transaction.countDocuments({ status: "PENDING" }),

    // ✨ UPDATED: Unsettled Cash Logic
    // We join with PaymentCategory to find 'CASH' type accounts that aren't settled
    Transaction.aggregate([
      {
        $lookup: {
          from: "paymentcategories", // Name of your collection in MongoDB
          localField: "paymentCategory",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      { 
        $match: { 
          status: "VERIFIED", 
          "categoryDetails.type": "CASH", 
          isSettled: false, 
          type: "INCOME" 
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  ]);

  const income = financeStats[0]?.totalIncome || 0;
  const expense = financeStats[0]?.totalExpense || 0;
  const currentBalance = income - expense;
  const totalUnsettledCash = unsettledCashResult[0]?.total || 0;

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto p-3 md:p-5 lg:p-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-4 md:p-5 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg border border-primary/20 shrink-0">
            <Sparkles className="animate-pulse" size={20} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="font-ubuntu text-[15px] md:text-lg font-black text-text tracking-tight truncate">System Overview</h1>
            <p className="font-ubuntu text-[11px] font-semibold text-primary/70 tracking-wide truncate">Tara Namaste Baalgram // Management Portal</p>
          </div>
        </div>
      </div>

      {/* --- EXECUTIVE ADMIN ALERTS ROW — flex grid, not full width --- */}
      {isAdmin && (pendingUsersCount > 0 || pendingTransactionsCount > 0 || totalUnsettledCash > 0) && (
        <div className="flex flex-wrap gap-3">
            {pendingUsersCount > 0 && (
                <Link href="/usersmanagement" className="flex-1 min-w-[240px] max-w-[360px] p-3.5 rounded-xl border bg-warning/5 border-warning/20 flex justify-between items-center group hover:bg-warning/10 transition-all">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="text-warning" size={18} />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-warning">New Member Requests</span>
                            <span className="text-[11px] font-bold text-text-muted">Review {pendingUsersCount} new people</span>
                        </div>
                    </div>
                    <span className="text-lg font-black text-warning">{pendingUsersCount}</span>
                </Link>
            )}

            {pendingTransactionsCount > 0 && (
                <Link href="/approvals" className="flex-1 min-w-[240px] max-w-[360px] p-3.5 rounded-xl border bg-danger/5 border-danger/20 flex justify-between items-center group hover:bg-danger/10 transition-all">
                    <div className="flex items-center gap-3">
                        <Clock className="text-danger" size={18} />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-danger">Pending Approvals</span>
                            <span className="text-[11px] font-bold text-text-muted">Awaiting your approval</span>
                        </div>
                    </div>
                    <span className="text-lg font-black text-danger">{pendingTransactionsCount}</span>
                </Link>
            )}

            {totalUnsettledCash > 0 && (
                <Link href="/settlements" className="flex-1 min-w-[240px] max-w-[360px] p-3.5 rounded-xl border bg-primary/5 border-primary/20 flex justify-between items-center group hover:bg-primary/10 transition-all">
                    <div className="flex items-center gap-3">
                        <Wallet className="text-primary" size={18} />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Cash Not Yet Paid In</span>
                            <span className="text-[11px] font-bold text-text-muted">Money collected but not deposited</span>
                        </div>
                    </div>
                    <span className="text-base font-black font-mono text-primary">Rs. {totalUnsettledCash.toLocaleString()}</span>
                </Link>
            )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
        <StatCard icon="👧" label="Children" value={kidsCount} sub="Living Here" variant="primary" />
        <StatCard icon="👩‍🏫" label="Staff" value={staffCount} sub="Working Now" variant="secondary" />

        <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm flex flex-col transition-all">
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-[9px] md:text-[10px] font-black border ${currentBalance < 0 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'}`}>
              NPR
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">Available Balance</span>
          </div>
          <span className={`text-xl md:text-2xl font-black truncate tracking-tighter ${currentBalance < 0 ? 'text-danger' : 'text-success'}`}>
            Rs. {currentBalance.toLocaleString()}
          </span>
          <p className="hidden md:block text-[10px] font-black text-text-muted mt-2 uppercase tracking-widest opacity-60">Money Available</p>
        </div>
        <AlertStatCard count={urgentActions.length} />
      </div>

      {/* --- QUICK ACTIONS — full-width grid row (3 in same row) --- */}
      <QuickActionSidebar />

      {/* --- FEED SECTION — 2-col grid, not full-width stack --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* URGENT CARE FEED */}
          <div className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
            <div className="p-5 md:p-6 border-b border-border bg-shaded flex justify-between items-center">
              <h2 className="font-ubuntu font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
                <Activity className={`w-4 h-4 ${urgentActions.length > 0 ? 'text-danger animate-pulse' : 'text-success'}`} />
                Critical Alerts
              </h2>
              <Link href="/children" className="text-[9px] font-black text-primary uppercase">View All →</Link>
            </div>

            <div className="flex flex-col">
              {urgentActions.length === 0 ? (
                <div className="p-16 text-center opacity-30 italic text-[10px] uppercase tracking-widest">No Alerts</div>
              ) : (
                urgentActions.map((plan: any, idx: number) => (
                  <Link key={plan._id} href={`/children/${plan.childId?._id}/documents`} className={`p-5 flex justify-between items-center border-l-4 border-l-transparent hover:border-l-primary transition-all ${idx % 2 === 0 ? 'bg-card' : 'bg-alt'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-lg">{plan.category === 'MEDICAL' ? '⚕️' : '⚖️'}</div>
                      <div>
                        <p className="font-bold text-sm">{plan.title}</p>
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{plan.childId?.firstName} // <span className="text-primary">{plan.category}</span></p>
                      </div>
                    </div>
                    <span className="bg-danger/10 text-danger text-[9px] font-black px-3 py-1.5 rounded-lg border border-danger/20 uppercase">{plan.priority}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* STOCK DEPLETION */}
          <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm">
            <h2 className="font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-6">Stock Alerts</h2>
            <div className="grid grid-cols-2 gap-3">
              {lowStockItems.length === 0 ? (
                  <p className="text-[10px] font-black text-text-muted uppercase opacity-50">Supply lines stable.</p>
              ) : (
                lowStockItems.map((item: any) => (
                  <Link key={item._id} href={`/inventory?search=${item.name}`} className="bg-surface border border-border p-4 rounded-2xl group hover:border-danger/30 transition-all">
                    <p className="text-[9px] font-black text-danger uppercase mb-1 tracking-widest">{item.currentStock} {item.unit} left</p>
                    <p className="font-bold text-xs truncate group-hover:text-danger capitalize">{item.name}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, variant }: any) {
  const isPrimary = variant === "primary";
  return (
    <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm hover:translate-y-[-2px] transition-all duration-300 group">
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg border ${isPrimary ? 'bg-primary/10 text-primary border-primary/20' : 'bg-shaded text-text-muted border-border'}`}>{icon}</div>
        <span className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-2xl md:text-4xl font-black text-text tracking-tighter">{value || 0}</span>
      <p className="hidden md:block text-[10px] font-black text-text-muted mt-2 uppercase tracking-widest opacity-60">{sub}</p>
    </div>
  );
}