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

  // 1. INITIALIZE TRANSACTION TYPE
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">(
    initialData?.type === "INCOME" || initialData?.type === "IN" ? "INCOME" : "EXPENSE"
  );

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

      {/* TYPE SWITCH */}
      <div className="flex bg-shaded p-1 rounded-xl border border-border shrink-0">
        <button
          type="button"
          onClick={() => { setTransactionType("EXPENSE"); setSelectedAccountId(""); }}
          disabled={!!initialData}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all duration-300 ${transactionType === "EXPENSE" ? "bg-card text-danger shadow-sm border border-border/50" : "text-text-muted"}`}
        >
          EXPENSE (Money Out)
        </button>
        <button
          type="button"
          onClick={() => { setTransactionType("INCOME"); setSelectedAccountId(""); }}
          disabled={!!initialData}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all duration-300 ${transactionType === "INCOME" ? "bg-card text-success shadow-sm border border-border/50" : "text-text-muted"}`}
        >
          INCOME (Money In)
        </button>
      </div>

      <div className="grid bg-shaded rounded-xl p-4 grid-cols-1 md:grid-cols-2 gap-4 border border-border">
        <FormField
          id="amount"
          label="Amount (NPR) *"
          name="amount"
          type="number"
          required
          placeholder="e.g. 5000"
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
          label={transactionType === "INCOME" ? "Donor / Source" : "Vendor Name"}
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
          className={`px-6 font-black text-[11px] uppercase tracking-widest text-text-invert h-9 ${transactionType === "INCOME" ? "bg-success" : "bg-danger"
            }`}
        >
          {isPending ? "PROCESSING..." : (initialData ? "Update Record" : "Save Transaction")}
        </Button>
      </div>
    </form>
  );
};