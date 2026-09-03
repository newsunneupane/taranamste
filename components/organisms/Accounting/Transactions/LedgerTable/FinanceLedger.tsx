"use client";
import React from "react";
import TransactionTable from "./TransactionTable";
import { useUIModals } from "@/hooks/useUIModal";


export default function FinanceLedger({ transactions, accounts, inventory }: any) {
    const {openTransactionForm}=useUIModals()
    return (
        <div className="space-y-5 transition-colors duration-500">
            {/* All Transactions now IS the report — report section removed, filtering + download lives inside table */}
            <TransactionTable
                transactions={transactions}
                accounts={accounts}
                onEdit={(txn) => openTransactionForm({initialData:txn})}
            />

        </div>
    );
}