"use client";

import React, { useActionState, useEffect, useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { SelectField } from "@/components/molecules/selects/SelectField";
import { Button } from "@/components/atoms/Button";
import { CreditCard, Building2, Smartphone } from "lucide-react";
import { savePaymentCategory } from "@/app/actions/addCategory";

interface PaymentCategoryFormProps {
  initialData?: any;
  closeModal: () => void;
  onSaved?: () => void;
  defaultIdentifier?: any; // ✨ This matches what you pass from the Select
}

const PaymentCategoryForm: React.FC<PaymentCategoryFormProps> = ({
  initialData,
  closeModal,
  onSaved,
  defaultIdentifier // ✨ Destructure it here
}) => {
  const [categoryType, setCategoryType] = useState(
    initialData?.type || defaultIdentifier || "CASH"
  );

  useEffect(() => { setCategoryType(initialData?.type || defaultIdentifier || "CASH"); }, [initialData?._id, initialData?.type, defaultIdentifier]);

  const [state, formAction, isPending] = useActionState(
    savePaymentCategory,
    { error: null, success: false }
  );

  useEffect(() => {
    if (state?.success) {
      if (onSaved) onSaved();
      closeModal();
    }
  }, [state?.success, closeModal, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      
      {/* HIDDEN INPUT: Ensure the default identifier is sent to the server even if select is disabled */}
      <input type="hidden" name="type" value={categoryType} />

      {/* HEADER */}
      <div className="flex items-center gap-4 bg-shaded p-5 rounded-2xl border border-border shrink-0">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
          <CreditCard size={20} />
        </div>
        <div>
          <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Finance Setup</h2>
          <p className="text-sm font-black text-text">
            {defaultIdentifier ? `Register New ${defaultIdentifier}` : "Payment Method Configuration"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Method Name *"
          name="name"
          required
          placeholder={categoryType === "BANK" ? "e.g. Nabil Bank" : "e.g. Office Safe"}
          defaultValue={initialData?.name || ""}
        />

        <SelectField
          label="System Type *"
          // Removed 'name' here because we are using the hidden input above to prevent double-submitting 
          // and to handle the 'disabled' state logic properly
          required
          value={categoryType}
          disabled={!!defaultIdentifier} // ✨ Lock the field if a type was forced
          onChange={(e) => setCategoryType(e.target.value)}
          options={[
            { label: "Physical Cash", value: "CASH" },
            { label: "Bank Account", value: "BANK" },
            { label: "Mobile Wallet", value: "WALLET" },
            { label: "In-Kind / Physical Goods", value: "KIND" }
          ]}
        />
      </div>

      {/* DYNAMIC DETAILS BLOCK */}
      {(categoryType === "BANK" || categoryType === "WALLET") && (
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/10 pb-3">
            {categoryType === "BANK" ? <Building2 size={16} className="text-primary" /> : <Smartphone size={16} className="text-primary" />}
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">
              {categoryType === "BANK" ? "Bank Credentials" : "Wallet Details"}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              label={categoryType === "BANK" ? "Account Number *" : "Wallet Phone Number *"}
              name="accountIdentifier"
              required
              placeholder={categoryType === "BANK" ? "Enter Account No." : "e.g. 98XXXXXXXX"}
              className="font-mono"
              defaultValue={initialData?.accountIdentifier || ""}
            />
            <FormField
              label={categoryType === "BANK" ? "Branch Name" : "Provider Name"}
              name="providerDetail"
              placeholder={categoryType === "BANK" ? "e.g. Birtamode Branch" : "e.g. eSewa"}
              defaultValue={initialData?.providerDetail || ""}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="GL Mapping Code"
          name="identifier"
          placeholder="e.g. ASSET-BANK-01"
          className="font-mono uppercase"
          // If forced to BANK, we can suggest a prefix
          defaultValue={initialData?.identifier || (defaultIdentifier ? `${defaultIdentifier}-` : "")}
        />
        <div className="flex items-center pt-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialData?.isActive ?? true}
              className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary/20"
            />
            <span className="text-xs font-bold text-text-muted group-hover:text-text">
              Available for Transactions
            </span>
          </label>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end items-center gap-4 pt-6 border-t border-border mt-2">
        <button type="button" onClick={closeModal} className="px-6 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text transition-colors">
          Discard
        </button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary text-text-invert px-10 h-12 rounded-xl font-black shadow-glow active:scale-95 transition-all"
        >
          {isPending ? "Loading..." : "SAVE CATEGORY"}
        </Button>
      </div>
    </form>
  );
};

export default PaymentCategoryForm;