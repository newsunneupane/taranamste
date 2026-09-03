"use client";
import React, { useActionState, useEffect } from "react";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { addInventoryItem, updateInventoryItem } from "@/app/actions/inventory";
import { Zap, AlertTriangle } from "lucide-react";
import { SelectConsumableCategory } from "@/components/molecules/selects/SelectInventoryConsumableCategory";

export const ConsumableItemForm = ({ item, closeModal }: { item?: any; closeModal: () => void; }) => {
    const action = item ? updateInventoryItem : addInventoryItem;
    const [state, formAction, isPending] = useActionState(action as any, { error: null, success: false });

     useEffect(() => { if (state?.success) closeModal(); }, [state?.success, closeModal]);

    return (
        <form action={formAction} className="flex flex-col h-full w-full animate-in fade-in duration-500">
            {state?.error && <div className="mx-4 mt-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-[11px] font-bold text-danger">{state.error}</div>}
            {item?._id && <input type="hidden" name="id" value={item._id} />}
            <input type="hidden" name="type" value="CONSUMABLE" />

            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-8 custom-scrollbar">
               
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Identification */}
                    <div className="lg:col-span-7 bg-card p-8 rounded-[2rem] border border-border space-y-6 shadow-sm">
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={14}/> Basic Specs</h3>
                        <FormField label="Item Name *" name="name" required placeholder="e.g. Rice" defaultValue={item?.name} />
                        <SelectConsumableCategory name="category" defaultValue={item?.category?._id || item?.category || ""} required />
                    </div>

                    {/* Inventory Logic */}
                    <div className="lg:col-span-5 bg-shaded p-8 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-6">
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><AlertTriangle size={14}/> Thresholds</h3>
                        <FormField label="Unit (kg/pkt)" name="unit" required defaultValue={item?.unit || "kg"} />
                        <FormField label="Low Stock Alert" name="minimumStockLevel" type="number" defaultValue={item?.minimumStockLevel} placeholder="0" />
                    </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border">
                    <FormField label="Brand / Remarks" name="description" defaultValue={item?.description} />
                </div>
            </div>

            <div className="shrink-0 flex justify-end gap-5 p-6 border-t border-border bg-card/80 backdrop-blur-md rounded-t-[2.5rem]">
                <button type="button" onClick={closeModal} className="text-[10px] font-black uppercase text-text-muted hover:text-text tracking-widest transition-colors">Discard</button>
                <Button type="submit" disabled={isPending} className="px-14 h-14 font-black text-xs uppercase tracking-[0.2em] text-text-invert bg-primary shadow-glow transition-all active:scale-95">
                    {isPending ? "Loading..." : "COMMIT_GOODS"}
                </Button>
            </div>
        </form>
    );
};