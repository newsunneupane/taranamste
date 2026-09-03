"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { addTransaction } from "@/app/actions/transactions";
import SelectPaymentCategory from "@/components/molecules/selects/SelectPaymentCategory";
import SelectAccountHead from "@/components/molecules/selects/SelectAccontHead";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";

interface AddTransactionModalProps {
  closeModal: () => void;
  initialData?: any;
}

export const TransactionForm: React.FC<AddTransactionModalProps> = ({
  closeModal,
  initialData
}) => {
  const { data: session } = useSession();

  const [state, formAction, isPending] = useActionState(
    addTransaction as any,
    { error: null, success: false }
  );

  // 1. INITIALIZE TRANSACTION TYPE — 4-way true capitalization, single Amount field with dynamic label
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE" | "ASSET" | "LIABILITY">(
    (["INCOME","EXPENSE","ASSET","LIABILITY"].includes(initialData?.type) ? initialData.type : (initialData?.type === "IN" ? "INCOME" : "EXPENSE")) as any
  );
  const amountMeta = {
    INCOME: { label: "Amount (NPR) — Money In *", placeholder: "e.g. 50000 donation", helper: "" },
    EXPENSE: { label: "Amount (NPR) — Money Out *", placeholder: "e.g. 5000 for Food", helper: "" },
    ASSET: { label: "Purchase Price (NPR) — Capitalized *", placeholder: "e.g. 120000 for Furniture", helper: "You now own it — adds to Net Worth = Assets−Liabilities" },
    LIABILITY: { label: "Amount Owed (NPR) *", placeholder: "e.g. 80000 loan", helper: "Adds to Liabilities — shown in Net Worth" },
  }[transactionType];
  const vendorLabel = transactionType === "INCOME" ? "Donor / Source" : transactionType === "ASSET" ? "Seller / Vendor" : transactionType === "LIABILITY" ? "Lender" : "Vendor Name";
  const submitColor = transactionType === "INCOME" ? "bg-success" : transactionType === "ASSET" ? "bg-primary" : transactionType === "LIABILITY" ? "bg-warning text-text" : "bg-danger";

  // 2. ACCOUNT SELECTION STATE
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initialData?.accountHead?._id || initialData?.accountHead || ""
  );

  // AUTO-CLOSE ON SUCCESS
  useEffect(() => {
    if (state?.success) closeModal();
  }, [state?.success, closeModal]);

  // COMPUTED VALUES
  const defaultDate = initialData?.date
    ? new Date(initialData.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return (
    <form action={formAction} className="w-full flex flex-col gap-4">

      {/* HIDDEN FIELDS */}
      {initialData?._id && <input type="hidden" name="id" value={initialData._id} />}
      <input type="hidden" name="type" value={transactionType} />
      <input type="hidden" name="createdBy" value={session?.user?.id} />
      <input
        type="hidden"
        name="status"
        value={session?.user?.role === "ADMIN" ? "VERIFIED" : "PENDING"}
      />

      {/* ERROR BANNER */}
      {state?.error && (
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-danger bg-danger/10 p-4 rounded-xl border border-danger/20 font-black">
          <span className="text-lg">⚠️</span>
          <span>System Alert: {state.error}</span>
        </div>
      )}

      {/* TYPE SWITCH — 4-way true capitalization, single Amount field keeps what is good */}
      <div className="grid grid-cols-2 bg-shaded p-1 rounded-xl border border-border shrink-0 gap-1">
        <button type="button" onClick={() => { setTransactionType("EXPENSE"); setSelectedAccountId(""); }} disabled={!!initialData} className={`py-2 text-xs font-black rounded-lg transition-all ${transactionType === "EXPENSE" ? "bg-card text-danger shadow-sm border border-border/50" : "text-text-muted hover:bg-card/50"}`}>EXPENSE</button>
        <button type="button" onClick={() => { setTransactionType("INCOME"); setSelectedAccountId(""); }} disabled={!!initialData} className={`py-2 text-xs font-black rounded-lg transition-all ${transactionType === "INCOME" ? "bg-card text-success shadow-sm border border-border/50" : "text-text-muted hover:bg-card/50"}`}>INCOME</button>
        <button type="button" onClick={() => { setTransactionType("ASSET"); setSelectedAccountId(""); }} disabled={!!initialData} className={`py-2 text-xs font-black rounded-lg transition-all ${transactionType === "ASSET" ? "bg-card text-primary shadow-sm border border-border/50" : "text-text-muted hover:bg-card/50"}`}>ASSET Bought</button>
        <button type="button" onClick={() => { setTransactionType("LIABILITY"); setSelectedAccountId(""); }} disabled={!!initialData} className={`py-2 text-xs font-black rounded-lg transition-all ${transactionType === "LIABILITY" ? "bg-card text-warning shadow-sm border border-border/50" : "text-text-muted hover:bg-card/50"}`}>LIABILITY</button>
      </div>
      {amountMeta.helper && <p className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">{amountMeta.helper}</p>}

      <div className="grid bg-shaded rounded-xl p-4 grid-cols-1 md:grid-cols-2 gap-4 border border-border">
        <FormField
          id="amount"
          label={amountMeta.label}
          name="amount"
          type="number"
          required
          placeholder={amountMeta.placeholder}
          className="text-text font-mono"
          defaultValue={initialData?.amount || ""}
        />

        <div className="flex flex-col gap-2">
          <SelectAccountHead transactionType={transactionType}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            initialData={initialData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-shaded p-4 rounded-xl border border-border">
        {/* ✨ UPDATED: Unified Category Selector */}
        <SelectPaymentCategory
          name="paymentCategoryId" // Ensure your component uses this name prop
          defaultValue={initialData?.paymentCategory?._id || initialData?.paymentCategory || ""}
        />

        <NepaliDateField
          label="Transaction Date"
          name="date"
          required
          defaultValue={defaultDate}
          className="text-text font-mono"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          id="donorOrVendorName"
          label={vendorLabel}
          name="donorOrVendorName"
          placeholder="e.g. John Doe"
          defaultValue={initialData?.donorOrVendorName || ""}
        />
        <FormField
          id="referenceNumber"
          label="Reference No."
          name="referenceNumber"
          placeholder="Cheque / Bill No."
          defaultValue={initialData?.referenceNumber || ""}
        />
      </div>

      <FormField
        id="description"
        label="Description *"
        name="description"
        required
        placeholder="What was this for?"
        defaultValue={initialData?.description || ""}
      />

      <div className="shrink-0 flex justify-end gap-2 pt-4 border-t border-border mt-2">
        <Button variant="ghost" onClick={closeModal} className="text-text-muted hover:text-text font-bold text-[11px] uppercase h-9">
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isPending || !selectedAccountId}
          className={`px-6 font-black text-[11px] uppercase tracking-widest h-9 ${submitColor} ${transactionType==="LIABILITY" ? "text-text" : "text-text-invert"}`}
        >
          {isPending ? "PROCESSING..." : (initialData ? "Update Record" : "Save Transaction")}
        </Button>
      </div>
    </form>
  );
};