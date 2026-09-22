"use client";
import React, { useActionState, useEffect, useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { SelectField } from "@/components/molecules/selects/SelectField";
import { Button } from "@/components/atoms/Button";
import { Landmark } from "lucide-react";
import { addAccountHead } from "@/app/actions/accounts";

interface AccountHeadFormProps {
    closeModal: () => void;
    initialData?: any;
    defaultType?: string;
    onSaved?: () => void;
}

export const AccountHeadForm: React.FC<AccountHeadFormProps> = ({
    closeModal,
    initialData,
    defaultType,
    onSaved
}) => {
    const [isBank, setIsBank] = useState<boolean>(!!initialData?.isBankAccount);
    const [state, formAction, isPending] = useActionState(
        addAccountHead as any,
        { error: null, success: false }
    );

    useEffect(() => {
        setIsBank(!!initialData?.isBankAccount);
    }, [initialData?._id, initialData?.isBankAccount]);

    useEffect(() => {
        if (state?.success) {
            if (onSaved) onSaved();
            closeModal();
        }
    }, [state?.success, closeModal, onSaved]);

    return (
        <form action={formAction} className="flex flex-col flex-1 min-h-0 w-full">
            {initialData?._id && <input type="hidden" name="id" value={initialData._id} />}

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-4">

                {state?.error && (
                    <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 p-3 rounded-xl border border-danger/20 font-bold animate-in slide-in-from-top-2 shrink-0">
                        <span>⚠️</span>
                        <span>{state.error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                    <FormField
                        id="name"
                        label="Account Name *"
                        name="name"
                        required
                        placeholder="e.g. Education Grant"
                        defaultValue={initialData?.name || ""}
                    />
                    <FormField
                        id="code"
                        label="GL Code *"
                        name="code"
                        required
                        placeholder="e.g. INC-1001"
                        className="font-mono uppercase"
                        defaultValue={initialData?.code || ""}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-shaded p-4 rounded-xl border border-border shrink-0">
                    <SelectField
                        id="type"
                        label="Root Type *"
                        name="type"
                        required
                        defaultValue={initialData?.type || defaultType || "INCOME"}
                        options={[
                            { label: "Income", value: "INCOME" },
                            { label: "Expense", value: "EXPENSE" }
                        ]}
                    />
                    <SelectField
                        id="fundCategory"
                        label="Fund Governance *"
                        name="fundCategory"
                        required
                        defaultValue={initialData?.fundCategory || "UNRESTRICTED"}
                        options={[
                            { label: "Unrestricted", value: "UNRESTRICTED" },
                            { label: "Restricted", value: "RESTRICTED" }
                        ]}
                    />
                </div>

                {/* 04. BANK TOGGLE — keep INCOME|EXPENSE + isBankAccount flag */}
                <div className="flex items-center gap-3 p-3 bg-shaded/50 border border-border rounded-xl shrink-0">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                        <input
                            type="checkbox"
                            name="isBankAccount"
                            checked={isBank}
                            onChange={(e) => setIsBank(e.target.checked)}
                            className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary/20"
                        />
                        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted group-hover:text-text">
                            <Landmark size={14} className="text-primary" />
                            Is Bank Account
                        </span>
                    </label>
                    <span className="text-[10px] text-text-muted">Tick to store bank details with this head</span>
                </div>

                {isBank && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl animate-in slide-in-from-top-2 duration-300 shrink-0">
                        <div className="flex items-center gap-2 mb-3 border-b border-primary/10 pb-2">
                            <Landmark size={14} className="text-primary" />
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Bank Details</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="accountNumber"
                                label="Account Number *"
                                name="accountNumber"
                                required={isBank}
                                placeholder="e.g. 0123456789012345"
                                className="font-mono"
                                defaultValue={initialData?.bankDetails?.accountNumber || ""}
                            />
                            <FormField
                                id="bankName"
                                label="Bank Name"
                                name="bankName"
                                placeholder="e.g. Nabil Bank"
                                defaultValue={initialData?.bankDetails?.bankName || ""}
                            />
                            <FormField
                                id="branch"
                                label="Branch"
                                name="branch"
                                placeholder="e.g. Birtamode"
                                defaultValue={initialData?.bankDetails?.branch || ""}
                                className="md:col-span-2"
                            />
                        </div>
                    </div>
                )}

                {/* 05. ADDITIONAL INFO */}
                <FormField
                    id="description"
                    label="Description"
                    name="description"
                    placeholder="Optional notes for audit trail"
                    className="shrink-0 pb-4"
                    defaultValue={initialData?.description || ""}
                />
            </div>

            <div className="shrink-0 flex justify-end gap-2 pt-4 border-t border-border bg-card mt-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={closeModal}
                    className="text-text-muted hover:text-text hover:bg-shaded font-bold text-[11px] uppercase tracking-wider h-9"
                >
                    CANCEL
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="px-6 font-black text-[11px] uppercase tracking-widest text-text-invert bg-primary hover:bg-primary/90 shadow-glow active:scale-95 transition-all h-9"
                >
                    {isPending ? "PROCESSING..." : (initialData ? "UPDATE HEAD" : "SAVE HEAD")}
                </Button>
            </div>
        </form>
    );
};