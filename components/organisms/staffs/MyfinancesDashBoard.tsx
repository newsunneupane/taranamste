"use client";

import React from "react";
import { Wallet, Clock, CheckCircle, XCircle, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";
import { formatNepaliDateShort } from "@/lib/nepaliDate";

export const MyFinancesDashboard = ({ 
    transactions, 
    netBalance, 
    pendingAmount = 0, 
    profile, 
    userName 
}: { 
    transactions: any[], 
    netBalance: number, 
    pendingAmount?: number, 
    profile: any, 
    userName: string 
}) => {
    const { openTransactionForm } = useUIModals();

    const isOwedToStaff = netBalance > 0; 
    const displayBalance = Math.abs(netBalance);
    const advanceLimit = profile?.financialControls?.maxAdvanceLimit || 0;
    
    const isHoldingCash = netBalance < 0;
    const isNearLimit = isHoldingCash && displayBalance > (advanceLimit * 0.8);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 md:p-8 rounded-dashboard border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-text uppercase tracking-widest">
                            My Money
                        </h2>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1 opacity-70">
                            {userName} // {profile?.designation || "Staff Member"}
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={() => openTransactionForm()} 
                    className="btn-primary shadow-glow shrink-0 flex items-center gap-2 h-12 px-6 font-black uppercase tracking-widest text-[10px]"
                >
                    <Plus size={16} /> Log Expense
                </Button>
            </div>

            {/* LIVE BALANCE CARD */}
            <div className={`p-8 rounded-[2rem] border shadow-sm relative overflow-hidden transition-all duration-500 ${
                netBalance === 0 
                    ? 'bg-card border-border' 
                    : isOwedToStaff 
                        ? 'bg-success/10 border-success/30' 
                        : 'bg-warning/10 border-warning/30'
            }`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                            netBalance === 0 ? 'text-text-muted' : isOwedToStaff ? 'text-success' : 'text-warning'
                        }`}>
                            {netBalance === 0 ? "All Balanced" : isOwedToStaff ? "Money Owed to You" : "Orphanage Cash You Hold"}
                        </p>
                        
                        {pendingAmount > 0 && (
                            <span className="flex items-center gap-1 text-[9px] font-black bg-warning/20 text-warning px-2 py-0.5 rounded border border-warning/30 animate-pulse">
                                <Clock size={10} /> NPR {pendingAmount.toLocaleString()} PENDING
                            </span>
                        )}
                    </div>

                    <p className={`text-4xl md:text-5xl font-mono font-black tracking-tighter ${
                        netBalance === 0 ? 'text-text' : isOwedToStaff ? 'text-success' : 'text-warning'
                    }`}>
                        NPR {displayBalance.toLocaleString()}
                    </p>
                    
                    {isHoldingCash && advanceLimit > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden max-w-[200px]">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isNearLimit ? 'bg-danger' : 'bg-warning'}`} 
                                    style={{ width: `${Math.min((displayBalance / advanceLimit) * 100, 100)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                Limit: NPR {advanceLimit.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* TRANSACTION HISTORY */}
            <div className="bg-card rounded-[2rem] border border-border shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-border bg-shaded flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Receipt size={18} className="text-text-muted" />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-text">My Transactions</h3>
                    </div>
                </div>

                <div className="flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar">
                    {transactions.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
                            <Receipt size={48} strokeWidth={1} />
                            <p className="font-black uppercase tracking-widest text-xs">Waiting for first entry...</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx._id} className="p-5 border-b border-border/50 hover:bg-shaded/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-mono font-black ${tx.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                                            {tx.type === 'INCOME' ? '+' : '-'} NPR {tx.amount.toLocaleString()}
                                        </span>
                                        {/* ✨ UPDATED: Pulls category name instead of  string */}
                                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border ${
                                            tx.paymentCategory?.type === 'PERSONAL' 
                                                ? 'bg-primary/5 border-primary/20 text-primary' 
                                                : 'bg-surface border-border text-text-muted'
                                        }`}>
                                            {tx.paymentCategory?.name || "Uncategorized"}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-text truncate max-w-[300px]">{tx.description}</p>
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                        {formatNepaliDateShort(tx.date)} • {tx.accountHead?.name || "Uncategorized"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {tx.status === 'PENDING' && <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-warning/10 text-warning border border-warning/20"><Clock size={12}/> Pending</span>}
                                    {tx.status === 'VERIFIED' && <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/20"><CheckCircle size={12}/> Verified</span>}
                                    {tx.status === 'REJECTED' && <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-danger/10 text-danger border border-danger/20"><XCircle size={12}/> Rejected</span>}
                                    
                                    {tx.isSettled && (
                                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                            Settled
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};