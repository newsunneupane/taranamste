"use client";
import React, { useState } from "react";
import ReportCenter from "../Report/ReportCenter";
import TransactionTable from "./TransactionTable";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";


export default function FinanceLedger({ transactions, accounts, inventory }: any) {
    const {openTransactionForm}=useUIModals()
    return (
        <div className="space-y-8 transition-colors duration-500">

            {/* REPORT SECTION - Already Themed */}
            <ReportCenter transactions={transactions} accounts={accounts} />

            {/* HEADER */}
            <div className="flex justify-between items-center px-2">
                {/* Typography: text-zinc-900 -> text-text */}
                <h2 className="text-xl md:text-2xl font-black text-text tracking-tighter">
                    All Transactions
                </h2>

            </div>

            {/* TABLE - Already Themed */}
            <TransactionTable
                transactions={transactions}
                onEdit={(txn) => openTransactionForm({initialData:txn})}
            />

        </div>
    );
}