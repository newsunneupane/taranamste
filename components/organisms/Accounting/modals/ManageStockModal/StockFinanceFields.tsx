"use client";
import React, { useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";
import SelectPaymentCategory from "@/components/molecules/selects/SelectPaymentCategory";
import SelectAccountHead from "@/components/molecules/selects/SelectAccontHead" // Fixed import typo

interface FinanceBridgeProps {
    transaction?: any;
    transactionType: "INCOME" | "EXPENSE" | "ASSET" | "LIABILITY";
}

export const StockFinanceFields: React.FC<FinanceBridgeProps> = ({
    transaction,
    transactionType
}) => {
    const [costEntered, setCostEntered] = useState<number | string>(transaction?.amount || "");
    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        transaction?.accountHead?._id || transaction?.accountHead || ""
    );

    const isAsset = transactionType === "ASSET";
    const isPurchase = transactionType === "EXPENSE" || isAsset;

    const theme = isAsset ? { bg:"bg-primary/5", border:"border-primary/20", text:"text-primary", badgeBg:"bg-primary/20 text-primary border-primary/30"} : { bg:"bg-success/5", border:"border-success/20", text:"text-success", badgeBg:"bg-success/20 text-success border-success/30"};

    return (
        <div className={`${theme.bg} p-6 rounded-2xl border ${theme.border} flex flex-col gap-6 animate-in fade-in duration-500`}>
            
            {/* AUDIT HEADER */}
            <div className={`border-b ${theme.border} pb-3 flex justify-between items-end`}>
                <div>
                    <p className={`text-[10px] uppercase font-black tracking-[0.2em] ${theme.text}`}>
                        {isAsset ? "Capitalized Asset" : "Linked Transaction"}
                    </p>
                    <p className="text-[9px] text-text-muted uppercase font-bold mt-1 opacity-70">
                        {isAsset ? "Purchase Price — adds to Net Worth" : isPurchase ? "Inventory Purchase" : "Stock Value"}
                    </p>
                </div>
                {Number(costEntered) > 0 && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${theme.badgeBg}`}>
                        Entry Required
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. THE COST — single Amount with dynamic label (keep what is good) */}
                <FormField
                    id="cost"
                    label={isAsset ? "Purchase Price (NPR) — Capitalized *" : isPurchase ? "Total Purchase Cost (NPR)" : "Estimated Value (NPR)"}
                    name="cost"
                    type="number"
                    value={costEntered}
                    onChange={(e) => setCostEntered(e.target.value)} 
                    placeholder={isAsset ? "e.g. 120000 for Furniture" : "Enter 0 if donated/no cost"}
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