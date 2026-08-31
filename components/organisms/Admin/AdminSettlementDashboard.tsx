"use client";

import React, { useActionState } from "react";
import { Wallet, ArrowRightLeft, UserCheck } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { settleStaffCash } from "@/app/actions/settlements";
import SelectPaymentCategory from "@/components/molecules/selects/SelectPaymentCategory";

// ✨ 1. Updated Interface to match our new Aggregation
interface StaffBalance {
  _id: string;
  name: string;
  role: string;
  netBalance: number; // Replaced 'unsettledCash' with 'netBalance'
  totalOutOfPocket?: number;
}

export const SettlementDashboard = ({ 
  staffBalances, 
  bankAccounts 
}: { 
  staffBalances: StaffBalance[], 
  bankAccounts: any[] 
}) => {
  // Filter out anyone who has exactly a 0 balance to keep the UI clean
  const activeBalances = staffBalances.filter(staff => staff.netBalance !== 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 md:p-8 rounded-dashboard border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text uppercase tracking-widest">
              Payments & Balances
            </h2>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1 opacity-70">
              Pay staff and deposit collected cash
            </p>
          </div>
        </div>
      </div>

      {/* DATA TRAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeBalances.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border/50 rounded-dashboard bg-card/50">
             <Wallet className="mx-auto text-success/50 mb-4" size={32} />
             <p className="text-sm font-black text-text-muted uppercase tracking-widest">All Balanced</p>
             <p className="text-[10px] text-text-muted font-bold opacity-60">No payments are needed right now.</p>
          </div>
        ) : (
          activeBalances.map((staff) => (
            <SettlementCard key={staff._id} staff={staff} bankAccounts={bankAccounts} />
          ))
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Individual Staff Card ---
const SettlementCard = ({ staff, bankAccounts }: { staff: StaffBalance, bankAccounts: any[] }) => {
  const [state, formAction, isPending] = useActionState(settleStaffCash as any, { error: null, success: false });

  // ✨ 2. The Logic to determine if it's a Deposit or Reimbursement
  const isOwedToStaff = staff.netBalance < 0;
  const displayAmount = Math.abs(staff.netBalance); // Remove the negative sign for display

  if (state?.success) {
    return (
      <div className="bg-success/10 p-6 rounded-2xl border border-success/30 flex flex-col items-center justify-center text-center h-full min-h-[250px] animate-in zoom-in-95">
         <UserCheck className="text-success mb-2" size={32} />
         <span className="text-xs font-black text-success uppercase tracking-widest">Settled</span>
      </div>
    );
  }

  return (
    <form action={formAction} className={`bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-6 group transition-all relative overflow-hidden ${
        isOwedToStaff ? 'border-warning/30 hover:border-warning' : 'border-border hover:border-primary/30'
    }`}>
      
      {state?.error && (
        <div className="absolute top-0 left-0 right-0 bg-danger text-white text-[9px] font-black uppercase text-center py-1">
          {state.error}
        </div>
      )}

      {/* Staff Identity */}
      <div className="flex flex-col gap-1 mt-2">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{staff.role}</span>
        <h3 className="text-lg font-black text-text truncate">{staff.name}</h3>
      </div>

      {/* Financial Display ✨ Dynamic Colors & Labels */}
      <div className={`p-4 rounded-xl border ${isOwedToStaff ? 'bg-warning/5 border-warning/20' : 'bg-shaded/50 border-border/50'}`}>
        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isOwedToStaff ? 'text-warning' : 'text-text-muted'}`}>
          {isOwedToStaff ? "Money Owed to Staff" : "Cash Not Yet Paid In"}
        </p>
        <p className={`text-2xl font-mono font-black ${isOwedToStaff ? 'text-warning' : 'text-text'}`}>
          NPR {displayAmount.toLocaleString()}
        </p>
      </div>

      {/* ✨ 3. Smart Hidden Fields */}
      <input type="hidden" name="staffId" value={staff._id} />
      {/* We pass the absolute amount because your Transaction schema doesn't allow negative numbers */}
      <input type="hidden" name="totalAmount" value={displayAmount} />
      {/* Tell the server action what kind of settlement this is */}
      <input type="hidden" name="settlementType" value={isOwedToStaff ? "REIMBURSEMENT" : "DEPOSIT"} />

      {/* Action Controls */}
      <div className="flex flex-col gap-3 mt-auto">
       <SelectPaymentCategory forceType="BANK"/>

        <Button 
          type="submit" 
          disabled={isPending}
          className={`w-full h-12 shadow-glow font-black uppercase tracking-widest text-[10px] text-text-invert ${
            isOwedToStaff ? 'bg-warning hover:bg-warning/90' : 'btn-primary'
          }`}
        >
          {isPending ? "PROCESSING..." : (isOwedToStaff ? "Pay Staff" : "Deposit to Bank")}
        </Button>
      </div>
    </form>
  );
};