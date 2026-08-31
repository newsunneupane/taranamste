"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { executeTransfer } from "@/app/actions/transfers";
import { ArrowRightLeft, ShieldCheck } from "lucide-react";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";

interface InternalTransferProps {
  closeModal: () => void;
}

export const InternalTransferForm: React.FC<InternalTransferProps> = ({ closeModal }) => {
  const { data: session } = useSession();

  const [state, formAction, isPending] = useActionState(
    executeTransfer as any,
    { error: null, success: false }
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");

  // ✨ FETCH: Now pulling from Payment Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Updated API endpoint to fetch categories (ensure this exists)
        const response = await fetch('/api/finances/payment-categories'); 
        const data = await response.json();
        
        // Filter out non-liquid types if necessary (e.g., keeping CASH, BANK, WALLET)
        // We usually exclude PERSONAL here as transfers are between official funds
        const liquidCategories = data.filter((cat: any) => 
            cat.isActive === true && cat.type !== "KIND"
        );
        
        setCategories(liquidCategories);
      } catch (error) {
        console.error("Error fetching payment categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (state?.success) closeModal();
  }, [state?.success, closeModal]);

  return (
    <form action={formAction} className="w-full flex flex-col gap-6">
      
      {/* AUTH TRACKING */}
      <input type="hidden" name="createdBy" value={session?.user?.id} />

      {/* ERROR BANNER */}
      {state?.error && (
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-danger bg-danger/10 p-4 rounded-xl border border-danger/20 font-black">
          <span className="text-lg">⚠️</span>
          <span>System Alert: {state.error}</span>
        </div>
      )}

      {/* AUDIT HEADER */}
      <div className="flex items-center gap-4 bg-zinc-900/5 p-4 rounded-xl border border-border">
        <div className="p-2 bg-zinc-900 text-white rounded-lg shadow-sm">
           <ArrowRightLeft size={18} />
        </div>
        <div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text">Moving Money</p>
           <p className="text-[9px] text-text-muted font-bold uppercase mt-0.5">Moving liquidity between system-defined payment categories.</p>
        </div>
      </div>

      {/* ROUTING LOGIC: FROM -> TO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-shaded p-6 rounded-2xl border border-border relative">
        
        {/* Visual Link */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-card border border-border rounded-full items-center justify-center text-text-muted z-10 shadow-sm">
            <ArrowRightLeft size={12} />
        </div>

        {/* FROM CATEGORY */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] uppercase font-black text-danger tracking-widest">
            Source Category (Credit)
          </label>
          <select
            name="fromAccount"
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            required
            className="w-full p-3 text-xs border border-border rounded-xl bg-bg text-text focus:ring-1 focus:ring-primary outline-none transition-all font-bold uppercase tracking-tight"
          >
            <option value="">Select Source...</option>
            {categories.map((cat: any) => (
              <option key={cat._id} value={cat._id} disabled={cat._id === toAccount}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        </div>

        {/* TO CATEGORY */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] uppercase font-black text-success tracking-widest">
            Destination Category (Debit)
          </label>
          <select
            name="toAccount"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            required
            className="w-full p-3 text-xs border border-border rounded-xl bg-bg text-text focus:ring-1 focus:ring-primary outline-none transition-all font-bold uppercase tracking-tight"
          >
            <option value="">Select Destination...</option>
            {categories.map((cat: any) => (
              <option key={cat._id} value={cat._id} disabled={cat._id === fromAccount}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TRANSACTION QUANTUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          id="amount"
          label="Transfer Amount (NPR) *"
          name="amount"
          type="number"
          required
          placeholder="0.00"
          className="text-text font-mono text-xl font-black"
        />
        <NepaliDateField
          label="Recording Date *"
          name="date"
          required
          className="text-text font-mono"
          defaultValue={new Date().toISOString().split('T')[0]}
        />
      </div>

      <FormField
        id="description"
        label="Audit Note / Reason *"
        name="description"
        required
        placeholder="e.g., Re-stocking Petty Cash from Nabil Bank"
        className="text-text"
      />

      {/* STATUS INDICATOR */}
      <div className="flex items-center gap-2 px-4 py-3 bg-success/5 rounded-xl border border-success/20">
        <ShieldCheck size={14} className="text-success" />
        <p className="text-[9px] font-black text-success uppercase tracking-widest">
            Status: Auto-Verified Entry (Non-Revenue Impacting)
        </p>
      </div>

      {/* SUBMISSION */}
      <div className="flex justify-end gap-3.5 pt-6 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={closeModal}
          className="text-text-muted hover:text-text font-bold text-[10px] uppercase tracking-widest"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isPending || !fromAccount || !toAccount}
          className="px-10 font-black text-[10px] uppercase tracking-[0.2em] text-text-invert bg-zinc-900 hover:bg-zinc-800 shadow-glow h-12"
        >
          {isPending ? "COMMITING..." : "Execute Transfer"}
        </Button>
      </div>
    </form>
  );
};