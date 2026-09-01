"use client";
import React, { useState } from "react";
import ReportCenter from "../Report/ReportCenter";
import TransactionTable from "./TransactionTable";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";


export default function FinanceLedger({ transactions, accounts, inventory }: any) {
    const {openTransactionForm}=useUIModals()
    return (
        <div className="space-y-5 transition-colors duration-500">

            <ReportCenter transactions={transactions} accounts={accounts} />

            <div className="flex justify-between items-center px-1">
                <h2 className="font-ubuntu text-[13px] font-black text-text tracking-tight">
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