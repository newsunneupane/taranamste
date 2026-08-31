"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { verifyTransaction, rejectTransaction } from "@/app/actions/transactionVerification";
import { formatNepaliDateShort } from "@/lib/nepaliDate";

export const VerificationDashboard = ({ pendingTransactions }: { pendingTransactions: any[] }) => {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setProcessingId(id);
    startTransition(async () => {
      await verifyTransaction(id);
      setProcessingId(null);
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    setProcessingId(id);
    startTransition(async () => {
      await rejectTransaction(id, reason);
      setProcessingId(null);
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 md:p-8 rounded-dashboard border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning/10 text-warning rounded-2xl flex items-center justify-center border border-warning/20">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text uppercase tracking-widest">
              Pending Approvals
            </h2>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1 opacity-70">
              Money records waiting for your approval
            </p>
          </div>
        </div>
        <div className="px-6 py-2 bg-shaded rounded-xl border border-border">
          <span className="text-xs font-black text-text-muted uppercase tracking-widest">
            Pending Items: <span className="text-warning ml-2">{pendingTransactions.length}</span>
          </span>
        </div>
      </div>

      {/* DATA TRAY */}
      {pendingTransactions.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border/50 rounded-dashboard bg-card/50">
          <CheckCircle className="mx-auto text-success/50 mb-4" size={32} />
          <p className="text-sm font-black text-text-muted uppercase tracking-widest">All Clear</p>
          <p className="text-[10px] text-text-muted font-bold opacity-60">No records waiting for approval.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingTransactions.map((tx) => (
            <div key={tx._id} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-warning/30 transition-all">

              {/* DETAILS */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 ${tx.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  <FileText size={18} />
                </div>
                <div className="flex flex-col gap-1">

                  {/* AMOUNT & TYPE BADGES */}
                  <div className="flex items-center flex-wrap gap-2 md:gap-3">
                    <span className="text-lg font-black text-text font-mono">
                      NPR {tx.amount.toLocaleString()}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${tx.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {tx.type}
                    </span>

                    {/* ✨ UPDATED: Now shows the Name of the Account (Nabil Bank, Personal Cash, etc.) */}
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border ${tx.paymentCategory?.type === 'PERSONAL'
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-shaded text-text-muted border-border'
                      }`}>
                      {tx.paymentCategory?.name || "Uncategorized"}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-text-muted mt-1">{tx.description}</p>

                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                    Category: {tx.accountHead?.name} ({tx.accountHead?.code})
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-text-muted/60 uppercase tracking-widest">
                    <span>Submitted By: <span className="text-text">{tx.createdBy?.name || "Unknown"}</span></span>
                    <span>Date: {formatNepaliDateShort(tx.date)}</span>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                <Button
                  variant="ghost"
                  onClick={() => handleReject(tx._id)}
                  disabled={isPending}
                  className="!text-danger border-danger/20 hover:bg-danger/10 px-4 h-10"
                >
                  <XCircle size={16} />
                </Button>
                <Button
                  onClick={() => handleApprove(tx._id)}
                  disabled={isPending}
                  className="bg-warning hover:bg-warning/90 text-text-invert shadow-glow px-6 h-10 font-black tracking-widest"
                >
                  {processingId === tx._id ? "APPROVING..." : "APPROVE"}
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};