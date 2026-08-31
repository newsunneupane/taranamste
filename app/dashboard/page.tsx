import Link from "next/link";
import dbConnect from "@/lib/db";
import Child from "@/models/Child";
import Staff from "@/models/Staff";
import Transaction from "@/models/Transaction";
import InventoryItem from "@/models/InventoryItem";
import ActionPlan from "@/models/ActionPlan";
import { Sparkles,  Activity } from "lucide-react";
import QuickActionSidebar from "@/components/organisms/ActionButtonsDashboard";
import AlertStatCard from "@/components/organisms/dashboard/AlertStatCard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  await dbConnect();

  const [kidsCount, staffCount, financeStats, lowStockItemsRaw, urgentActionsRaw] = await Promise.all([
    Child.countDocuments({ status: "IN_CARE" }),
    Staff.countDocuments({ status: "ACTIVE" }),
    Transaction.aggregate([
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
      .sort({ dueDate: 1 }).limit(4).lean()
  ]);

  const income = financeStats[0]?.totalIncome || 0;
  const expense = financeStats[0]?.totalExpense || 0;
  const currentBalance = income - expense;
  const lowStockItems = JSON.parse(JSON.stringify(lowStockItemsRaw));
  const urgentActions = JSON.parse(JSON.stringify(urgentActionsRaw));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto  md:p-6 md:pt-6 lg:p-8 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 md:p-6 rounded-[2rem] shadow-sm border border-border">
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shrink-0">
            <Sparkles className="animate-pulse" size={24} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="font-ubuntu text-xl md:text-2xl font-black text-text tracking-tight truncate">
              System Overview
            </h1>
            <p className="font-ubuntu text-[10px] text-text-muted uppercase tracking-[0.3em] font-black opacity-60">
              Tara Namaste Baal gram // Management Portal
            </p>
          </div>
        </div>
      </div>

      {/* --- COMPACT KPI GRID (2x2 on Mobile) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard icon="👧" label="Children" value={kidsCount} sub="Active Intake" variant="primary" />
        <StatCard icon="👩‍🏫" label="Staff" value={staffCount} sub="On-Duty" variant="secondary" />

        {/* Finance Balance */}
        <div className="bg-card p-4 md:p-6 rounded-2xl md:rounded-dashboard border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center md:items-start mb-2 md:mb-4">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-[9px] md:text-[10px] font-black border ${currentBalance < 0 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'}`}>
              NPR
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">Funds</span>
          </div>
          <span className={`text-xl md:text-2xl font-black truncate tracking-tighter ${currentBalance < 0 ? 'text-danger' : 'text-success'}`}>
            Rs. {currentBalance.toLocaleString()}
          </span>
          <p className="hidden md:block text-[10px] font-black text-text-muted mt-2 uppercase tracking-widest opacity-60">Available Balance</p>
        </div>
        <AlertStatCard count={urgentActions.length} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <QuickActionSidebar />

        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-10">
          {/* URGENT CARE FEED */}
          <div id="urgent" className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
            <div className="p-5 md:p-6 border-b border-border bg-shaded flex justify-between items-center">
              <h2 className="font-ubuntu font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 text-text">
                <Activity className={`w-4 h-4 ${urgentActions.length > 0 ? 'text-danger animate-pulse' : 'text-success'}`} />
                Critical Care Feed
              </h2>
              <Link href="/children" className="text-[9px] font-black text-primary hover:tracking-widest transition-all uppercase">View All →</Link>
            </div>

            <div className="flex flex-col">
              {urgentActions.length === 0 ? (
                <div className="p-16 text-center opacity-30">
                  <p className="font-black uppercase tracking-widest text-[10px]">Security Protocol Nominal // No Alerts</p>
                </div>
              ) : (
                urgentActions.map((plan: any, idx: number) => (
                  <Link
                    key={plan._id}
                    href={`/children/${plan.childId?._id}/documents?planId=${plan._id}`}
                    className={`p-5 md:p-6 flex justify-between items-center group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary transition-all ${idx % 2 === 0 ? 'bg-card' : 'bg-alt'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-surface border border-border flex items-center justify-center text-lg group-hover:border-primary/50 transition-all">
                        {plan.category === 'MEDICAL' ? '⚕️' : '⚖️'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text group-hover:text-primary transition-colors truncate">{plan.title}</p>
                        <p className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">
                          {plan.childId?.firstName} {plan.childId?.lastName} // <span className="text-primary">{plan.category}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="bg-danger/10 text-danger text-[9px] font-black px-3 py-1.5 rounded-lg border border-danger/20 uppercase">
                        {plan.priority}
                      </span>
                      <span className="text-[8px] font-black text-primary uppercase opacity-0 group-hover:opacity-100 transition-opacity tracking-tighter">
                        Open File →
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* INVENTORY TRAY */}
          <div className="bg-card rounded-[2rem] border border-border p-6 md:p-8 shadow-sm">
            <h2 className="font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-6">Stock Depletion</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {lowStockItems.map((item: any) => (
                <Link
                  key={item._id}
                  href={`/inventory?search=${encodeURIComponent(item.name)}`}
                  className="bg-surface border border-border p-4 rounded-2xl group hover:border-danger/30 transition-all"
                >
                  <p className="text-[9px] font-black text-danger uppercase mb-1 tracking-widest">{item.currentStock} {item.unit} left</p>
                  <p className="font-bold text-xs md:text-sm text-text truncate group-hover:text-danger transition-colors capitalize">{item.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

function StatCard({ icon, label, value, sub, variant }: any) {
  const isPrimary = variant === "primary";
  return (
    <div className="bg-card p-4 md:p-6 rounded-2xl md:rounded-dashboard border border-border shadow-sm hover:translate-y-[-2px] transition-all duration-300 group">
      <div className="flex justify-between items-center md:items-start mb-2 md:mb-4">
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${isPrimary ? 'bg-primary/10 text-primary border-primary/20' : 'bg-shaded text-text-muted border-border'}`}>
          {icon}
        </div>
        <span className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-2xl md:text-4xl font-black text-text tracking-tighter">{value || 0}</span>
      <p className="hidden md:block text-[10px] font-black text-text-muted mt-2 uppercase tracking-widest opacity-60">{sub}</p>
    </div>
  );
}