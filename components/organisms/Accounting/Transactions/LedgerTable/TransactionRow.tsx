"use client";
import React from "react";
import { deleteTransaction } from "@/app/actions/transactions";
import { formatNepaliDateShort } from "@/lib/nepaliDate";

export default function TransactionRow({
    txn,
    onEdit
}: {
    txn: any;
    onEdit: (t: any) => void;
}) {
    const isIncome = txn.type === "INCOME";

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this transaction?")) {
            await deleteTransaction(txn._id);
        }
    };

    return (
        // Row: hover:bg-zinc-50/60 -> hover:bg-shaded/40
        <tr className="group text-xs hover:bg-shaded/40 transition-colors duration-300">

            {/* DATE: BS primary + AD alongside */}
            <td className="p-4 pl-6 text-text-muted font-medium whitespace-nowrap">
                {formatNepaliDateShort(txn.date)}
            </td>

            {/* ACCOUNT */}
            <td className="p-4">
                <div className="flex items-center gap-3">
                    {/* Status Dot: Using success/danger variables */}
                    <span
                        className={`w-2 h-2 rounded-full shadow-sm ${
                            isIncome ? "bg-success" : "bg-danger"
                        }`}
                    />
                    {/* Account Name: text-zinc-800 -> text-text */}
                    <span className="font-bold text-text group-hover:text-primary transition-colors">
                        {txn.accountHead?.name || "Unknown"}
                    </span>
                </div>
            </td>

            {/* DESCRIPTION: text-zinc-600 -> text-text-muted */}
            <td className="p-4 text-text-muted truncate max-w-[220px]">
                {txn.description}
            </td>

            {/* AMOUNT: text-emerald-600 -> text-success, text-rose-600 -> text-danger */}
            <td
                className={`p-4 text-right font-black font-mono tracking-tight ${
                    isIncome ? "text-success" : "text-danger"
                }`}
            >
                <span className="text-[10px] mr-1 opacity-70">
                    {isIncome ? "+" : "-"}
                </span>
                {Number(txn.amount).toLocaleString()}
            </td>

            {/* ACTIONS */}
            <td className="p-4 pr-6 text-right">
                <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">

                    <button
                        onClick={() => onEdit(txn)}
                        // Edit: text-zinc-400 -> text-text-muted, hover:bg-emerald-50 -> hover:bg-success/10
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-all active:scale-90"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        onClick={handleDelete}
                        // Delete: hover:bg-rose-50 -> hover:bg-danger/10
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all active:scale-90"
                        title="Delete"
                    >
                        🗑️
                    </button>

                </div>
            </td>
        </tr>
    );
}