"use client";
import React, { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { adjustStock } from "@/app/actions/inventory";
import { StockFinanceFields } from "../../../organisms/Accounting/modals/ManageStockModal/StockFinanceFields";
import { StockFormFields } from "../../../organisms/Accounting/modals/ManageStockModal/StockFormFields";

import { TInventoryItem } from "@/types/Transaction";
import { useSession } from "next-auth/react";

interface ManageStockProps {
    closeModal: () => void;
    item: TInventoryItem | any;
}

export const ManageStockModal: React.FC<ManageStockProps> = ({ closeModal, item }) => {
    const { data: session } = useSession();
    const [accounts, setAccounts] = useState<any[]>([]);
    
    // ✨ NEW: Local state to pass to the finance bridge
    const [actionType, setActionType] = useState<"IN" | "OUT">(
        item?.logId?.type || "IN" 
    );

    const [state, formAction, isPending] = useActionState(adjustStock as any, {
        error: null, success: false,
    });

    // ✨ FETCH ACCOUNT HEADS (For the Expense Account dropdown)
    useEffect(() => {
        if (actionType === "IN") {
            const loadHeads = async () => {
                try {
                    const res = await fetch("/api/finances/accountHead");
                    const data = await res.json();
                    setAccounts(data);
                } catch (e) {
                    console.error("Finance Fetch Error:", e);
                }
            };
            loadHeads();
        }
    }, [actionType]);

    const isFromFinance = !!item?.logId;
    const inventoryItem = isFromFinance ? item.logId.item : item;
    const logId = isFromFinance ? item.logId : null;
    const linkedTransaction = isFromFinance ? item : null;

    useEffect(() => {
        if (state?.success) closeModal();
    }, [state?.success, closeModal]);

    return (
        <form action={formAction} className="flex flex-col">
            <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
                {state?.error && <ErrorBox error={state.error} />}

                {/* HIDDEN LOGIC FIELDS */}
                <input type="hidden" name="itemId" value={inventoryItem._id} />
                <input type="hidden" name="type" value={actionType} />
                {logId && <input type="hidden" name="logId" value={logId._id} />}
                <input type="hidden" name="createdBy" value={session?.user?.id} />
                <input
                    type="hidden"
                    name="status"
                    value={session?.user?.role === "ADMIN" ? "VERIFIED" : "PENDING"}
                />

                <TypeToggle current={actionType} set={setActionType} disabled={!!linkedTransaction} />

                {/* PROTOCOL WARNING */}
                {session?.user?.role !== "ADMIN" && actionType === "IN" && (
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl">
                        <p className="text-[9px] font-black text-warning uppercase tracking-widest leading-relaxed">
                            Verification Protocol: Inbound stock with cost requires administrative audit.
                        </p>
                    </div>
                )}

                {/* PHYSICAL STOCK FIELDS */}
                <StockFormFields 
                    actionType={actionType} 
                    defaultValue={logId} 
                />

                {/* FINANCIAL LINKAGE — true capitalization: asset stock IN → ASSET head */}
                {actionType === "IN" && (
                    <div className="animate-in slide-in-from-top-2 duration-500">
                        <StockFinanceFields
                            transaction={linkedTransaction}
                            transactionType={inventoryItem?.type === "ASSET" ? "ASSET" : "EXPENSE"}
                        />
                    </div>
                )}
            </div>

            <Footer isPending={isPending} type={actionType} closeModal={closeModal} />
        </form>
    );
};

/* ---------------- UI COMPONENTS ---------------- */

const TypeToggle = ({ current, set, disabled }: any) => (
    <div className={`flex bg-shaded p-1 rounded-xl border border-border transition-all ${disabled ? "opacity-50 grayscale pointer-events-none" : ""}`}>
        {["OUT", "IN"].map((t) => (
            <button
                key={t}
                type="button"
                onClick={() => set(t)}
                className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-black rounded-lg transition-all ${
                    current === t ? "bg-card shadow-sm border border-border/50 text-text" : "text-text-muted"
                }`}
            >
                {t === "OUT" ? "STOCK OUT (Consumption)" : "STOCK IN (Purchase/Donation)"}
            </button>
        ))}
    </div>
);

const Footer = ({ isPending, type, closeModal }: any) => (
    <div className="flex justify-end gap-3.5 pt-8 mt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={closeModal} className="font-bold text-text-muted text-xs uppercase">
            Cancel
        </Button>
        <Button
            type="submit"
            disabled={isPending}
            className={`font-black px-10 h-11 text-xs uppercase tracking-widest text-text-invert ${
                type === "IN" ? "bg-success shadow-glow-success" : "bg-warning shadow-glow-warning"
            }`}
        >
            {isPending ? "SAVING..." : `Confirm ${type}`}
        </Button>
    </div>
);

const ErrorBox = ({ error }: { error: string }) => (
    <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl mb-4 animate-in shake-200">
        <p className="text-[10px] font-black text-danger uppercase tracking-widest flex items-center gap-2">
            <span>⚠️</span> System Alert: {error}
        </p>
    </div>
);