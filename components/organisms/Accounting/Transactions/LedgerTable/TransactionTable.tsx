"use client";
import React, { useState, useMemo } from "react";
import { Search, Filter, Trash2, Edit2 } from "lucide-react";
import { deleteTransaction } from "@/app/actions/transactions";
import { formatNepaliDateShort } from "@/lib/nepaliDate";

export default function TransactionTable({
    transactions,
    onEdit
}: {
    transactions: any[];
    onEdit: (t: any) => void;
}) {
    // ✨ 1. Local Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    // ✨ 2. Filtering Logic
    const filteredTxns = useMemo(() => {
        return transactions.filter((txn) => {
            const searchString = `${txn.accountHead?.name || ""} ${txn.description || ""}`.toLowerCase();
            const matchesSearch = searchString.includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === "ALL" || txn.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [transactions, searchTerm, typeFilter]);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            await deleteTransaction(id);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* =========================================
                THE FILTER TOOLBAR
                ========================================= */}
            <div className="flex flex-col sm:flex-row gap-2 bg-card p-2.5 rounded-xl border border-border shadow-sm">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search category or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background border border-border/50 text-text placeholder:text-text-muted text-[13px] rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                    />
                </div>

                {/* Type Dropdown */}
                <div className="relative shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                        <Filter size={16} />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full sm:w-44 bg-background border border-border/50 text-text text-[13px] rounded-lg pl-9 pr-8 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer shadow-inner font-bold"
                    >
                        <option value="ALL">All Transactions</option>
                        <option value="INCOME">Income Only</option>
                        <option value="EXPENSE">Expenses Only</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {filteredTxns.length === 0 && (
                <div className="bg-card p-10 rounded-2xl border border-border text-center flex flex-col items-center gap-1.5 shadow-sm">
                    <span className="text-3xl grayscale opacity-50 mb-1">💸</span>
                    <p className="text-sm font-black text-text uppercase tracking-tighter">No Transactions Found</p>
                    <p className="text-xs text-text-muted">Adjust your search filters or record a new entry.</p>
                </div>
            )}

            {/* =========================================
                DESKTOP VIEW (Hidden on Mobile) 
                ========================================= */}
            {filteredTxns.length > 0 && (
                <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-colors duration-500">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-shaded/50 border-b border-border text-text-muted font-black uppercase text-[8px] tracking-[0.12em]">
                                <tr>
                                    <th className="p-3 pl-5 text-primary">Date</th>
                                    <th className="p-3 text-primary">Category</th>
                                    <th className="p-3 text-primary">Description</th>
                                    <th className="p-3 text-right text-primary">Amount (NPR)</th>
                                    <th className="p-3 text-right pr-5 text-primary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredTxns.map((txn) => {
                                    const isIncome = txn.type === "INCOME";
                                    return (
                                        <tr key={txn._id} className="group text-[11px] hover:bg-shaded/40 transition-colors duration-300">
                                            <td className="p-3 pl-5 text-text-muted font-medium text-[11px]">
                                                {formatNepaliDateShort(txn.date)}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${isIncome ? "bg-success" : "bg-danger"}`} />
                                                    <span className="font-bold text-text group-hover:text-primary transition-colors text-xs">
                                                        {txn.accountHead?.name || "Unknown"}
                                                        {txn.subType && (
                                                            <span className="text-[10px] font-semibold text-text-muted/70"> · {txn.subType}</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-text-muted truncate max-w-[200px] text-[11px]">
                                                {txn.description}
                                            </td>
                                            <td className={`p-3 text-right font-black font-mono tracking-tight text-xs ${isIncome ? "text-success" : "text-danger"}`}>
                                                <span className="text-[9px] mr-1 opacity-70">{isIncome ? "+" : "-"}</span>
                                                {Number(txn.amount).toLocaleString()}
                                            </td>
                                            <td className="p-3 pr-5 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(txn)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-all active:scale-90" title="Edit">
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button onClick={() => handleDelete(txn._id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all active:scale-90" title="Delete">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* =========================================
                MOBILE VIEW (Individual Floating Cards)
                ========================================= */}
            {filteredTxns.length > 0 && (
                <div className="flex flex-col md:hidden">
                    {filteredTxns.map((txn, index) => {
                        const isIncome = txn.type === "INCOME";
                        return (
                            <div 
                                key={txn._id} 
                                className={`border border-border shadow-sm flex flex-col overflow-hidden transition-all ${
                                    index % 2 === 0 ? "bg-card" : "bg-alt"
                                }`}
                            >
                                <div className="p-3 flex items-center justify-between border-b border-border ">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full shadow-sm shrink-0 ${isIncome ? "bg-success" : "bg-danger"}`} />
                                        <h3 className="font-black text-text text-sm tracking-tight truncate">
                                            {txn.accountHead?.name || "Unknown"}
                                            {txn.subType && (
                                                <span className="text-[9px] font-semibold text-text-muted/70"> · {txn.subType}</span>
                                            )}
                                        </h3>
                                    </div>
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest shrink-0">
                                        {formatNepaliDateShort(txn.date)}
                                    </span>
                                </div>

                                <div className="p-3 flex flex-col gap-3">
                                    <div className="grid grid-cols-1 gap-3 bg-surface p-3 rounded-xl border border-border shadow-inner">
                                        {txn.description && (
                                            <div className="flex flex-col gap-1 border-b border-border pb-3">
                                                <span className="font-ubuntu text-[9px] font-black text-text-muted uppercase tracking-widest">Description</span>
                                                <span className="text-xs text-text italic">"{txn.description}"</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <span className="font-ubuntu text-[8px] font-black text-primary uppercase tracking-widest">Amount</span>
                                            <span className={`text-lg font-black font-mono tracking-tight ${isIncome ? "text-success" : "text-danger"}`}>
                                                <span className="text-[10px] mr-1 opacity-70">{isIncome ? "+" : "-"}</span>
                                                NPR {Number(txn.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(txn)}
                                            className="flex-1 py-2 rounded-xl text-[11px] font-bold text-text-muted bg-surface hover:bg-success/10 hover:text-success border border-border shadow-sm transition-all flex justify-center items-center gap-1.5"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(txn._id)}
                                            className="flex-1 py-2 rounded-xl text-[11px] font-bold text-text-muted bg-surface hover:bg-danger/10 hover:text-danger border border-border shadow-sm transition-all flex justify-center items-center gap-1.5"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}