"use client";
import React, { useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";
import SelectPaymentCategory from "@/components/molecules/selects/SelectPaymentCategory";
import SelectAccountHead from "@/components/molecules/selects/SelectAccontHead" // Fixed import typo

interface FinanceBridgeProps {
    transaction?: any;
    transactionType: "INCOME" | "EXPENSE"; 
}

export const StockFinanceFields: React.FC<FinanceBridgeProps> = ({
    transaction,
    transactionType
}) => {
    const [costEntered, setCostEntered] = useState<number | string>(transaction?.amount || "");
    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        transaction?.accountHead?._id || transaction?.accountHead || ""
    );

    // Dynamic label logic for clarity
    const isPurchase = transactionType === "EXPENSE";

    return (
        <div className="bg-success/5 p-6 rounded-2xl border border-success/20 flex flex-col gap-6 animate-in fade-in duration-500">
            
            {/* AUDIT HEADER */}
            <div className="border-b border-success/20 pb-3 flex justify-between items-end">
                <div>
                    <p className="text-[10px] uppercase font-black text-success tracking-[0.2em]">
                        Linked Transaction
                    </p>
                    <p className="text-[9px] text-text-muted uppercase font-bold mt-1 opacity-70">
                        {isPurchase ? "Inventory Purchase" : "Stock Value"}
                    </p>
                </div>
                {Number(costEntered) > 0 && (
                    <span className="text-[9px] font-black bg-success/20 text-success px-2 py-0.5 rounded border border-success/30 uppercase tracking-tighter">
                        Entry Required
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. THE COST */}
                <FormField
                    id="cost"
                    label={isPurchase ? "Total Purchase Cost (NPR)" : "Estimated Value (NPR)"}
                    name="cost"
                    type="number"
                    value={costEntered}
                    onChange={(e) => setCostEntered(e.target.value)} 
                    placeholder="Enter 0 if donated/no cost"
                    className="text-text font-mono"
                />

                <SelectAccountHead 
                    transactionType={transactionType}
                    selectedAccountId={selectedAccountId}
                    setSelectedAccountId={setSelectedAccountId}
                    initialData={transaction}
                    required={Number(costEntered) > 0}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/50">
                {/* 3. THE PAYMENT SOURCE (Bank/Cash/Personal - New Model) */}
                <div className="flex flex-col w-full">
                     <SelectPaymentCategory 
                        name="paymentCategoryId" 
                        defaultValue={transaction?.paymentCategory?._id || transaction?.paymentCategory || ""}
                        label={isPurchase ? "Paid From" : "Received Into"}
                    />
                </div>

                {/* 4. DATE */}
                <NepaliDateField
                    label="Transaction Date"
                    name="date"
                    className="text-text font-mono"
                    defaultValue={
                        transaction?.date
                            ? new Date(transaction.date).toISOString().split("T")[0]
                            : new Date().toISOString().split("T")[0]
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    id="donorOrVendorName"
                    label={isPurchase ? "Vendor Name" : "Donor Name"}
                    name="donorOrVendorName"
                    defaultValue={transaction?.donorOrVendorName}
                    placeholder={isPurchase ? "e.g. BhatBhateni" : "e.g. Anonymous"}
                />
                <FormField
                    id="referenceNumber"
                    label="Ref / Bill / Receipt No."
                    name="referenceNumber"
                    defaultValue={transaction?.referenceNumber}
                    placeholder="Optional tracking number"
                />
            </div>
        </div>
    );
};