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
            <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-[1.5rem] border border-border shadow-sm">
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
                        className="w-full bg-background border border-border/50 text-text placeholder:text-text-muted text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
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
                        className="w-full sm:w-48 bg-background border border-border/50 text-text text-sm rounded-xl pl-10 pr-10 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer shadow-inner font-bold"
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

            {/* Empty State */}
            {filteredTxns.length === 0 && (
                <div className="bg-card p-16 rounded-[2rem] border border-border text-center flex flex-col items-center gap-2 shadow-sm">
                    <span className="text-4xl grayscale opacity-50 mb-2">💸</span>
                    <p className="text-lg font-black text-text uppercase tracking-tighter">No Transactions Found</p>
                    <p className="text-sm text-text-muted">Adjust your search filters or record a new entry.</p>
                </div>
            )}

            {/* =========================================
                DESKTOP VIEW (Hidden on Mobile) 
                ========================================= */}
            {filteredTxns.length > 0 && (
                <div className="hidden md:block bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden transition-colors duration-500">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-shaded/50 border-b border-border text-text-muted font-black uppercase text-[9px] tracking-[0.15em]">
                                <tr>
                                    <th className="p-4 pl-6">Date</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4 text-right">Amount (NPR)</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredTxns.map((txn) => {
                                    const isIncome = txn.type === "INCOME";
                                    return (
                                        <tr key={txn._id} className="group text-xs hover:bg-shaded/40 transition-colors duration-300">
                                            <td className="p-4 pl-6 text-text-muted font-medium">
                                                {formatNepaliDateShort(txn.date)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full shadow-sm ${isIncome ? "bg-success" : "bg-danger"}`} />
                                                    <span className="font-bold text-text group-hover:text-primary transition-colors">
                                                        {txn.accountHead?.name || "Unknown"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-text-muted truncate max-w-[220px]">
                                                {txn.description}
                                            </td>
                                            <td className={`p-4 text-right font-black font-mono tracking-tight ${isIncome ? "text-success" : "text-danger"}`}>
                                                <span className="text-[10px] mr-1 opacity-70">{isIncome ? "+" : "-"}</span>
                                                {Number(txn.amount).toLocaleString()}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(txn)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-all active:scale-90" title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(txn._id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all active:scale-90" title="Delete">
                                                        <Trash2 size={14} />
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
                                {/* HEADER: Account Name & Date */}
                                <div className="p-4 flex items-center justify-between border-b border-border ">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${isIncome ? "bg-success" : "bg-danger"}`} />
                                        <h3 className="font-black text-text text-base tracking-tight truncate">
                                            {txn.accountHead?.name || "Unknown"}
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest shrink-0">
                                        {formatNepaliDateShort(txn.date)}
                                    </span>
                                </div>

                                {/* BODY: Description & Amount */}
                                <div className="p-4 flex flex-col gap-4">
                                    <div className="grid grid-cols-1 gap-4 bg-surface p-4 rounded-xl border border-border shadow-inner">
                                        {txn.description && (
                                            <div className="flex flex-col gap-1 border-b border-border pb-3">
                                                <span className="font-ubuntu text-[9px] font-black text-text-muted uppercase tracking-widest">Description</span>
                                                <span className="text-xs text-text italic">"{txn.description}"</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <span className="font-ubuntu text-[9px] font-black text-text-muted uppercase tracking-widest">Amount</span>
                                            <span className={`text-xl font-black font-mono tracking-tight ${isIncome ? "text-success" : "text-danger"}`}>
                                                <span className="text-xs mr-1 opacity-70">{isIncome ? "+" : "-"}</span>
                                                NPR {Number(txn.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(txn)}
                                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-text-muted bg-surface hover:bg-success/10 hover:text-success border border-border shadow-sm transition-all flex justify-center items-center gap-2"
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(txn._id)}
                                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-text-muted bg-surface hover:bg-danger/10 hover:text-danger border border-border shadow-sm transition-all flex justify-center items-center gap-2"
                                        >
                                            <Trash2 size={14} /> Delete
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