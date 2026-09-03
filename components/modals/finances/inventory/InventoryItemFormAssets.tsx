"use client";
import React, { useActionState, useEffect } from "react";
import { FormField } from "@/components/molecules/FormField";
import { SelectField } from "@/components/molecules/selects/SelectField";
import { Button } from "@/components/atoms/Button";
import { addInventoryItem, updateInventoryItem } from "@/app/actions/inventory";
import { MapPin, ClipboardCheck } from "lucide-react";
import { SelectAssetCategory } from "@/components/molecules/selects/SelectInventoryAssetsCategory";

export const FixedAssetItemForm = ({ item, closeModal }: { item?: any; closeModal: () => void; }) => {
    const action = item ? updateInventoryItem : addInventoryItem;
    const [state, formAction, isPending] = useActionState(action as any, { error: null, success: false });

     useEffect(() => { if (state?.success) closeModal(); }, [state?.success, closeModal]);

    return (
        <form action={formAction} className="flex flex-col h-full w-full animate-in slide-in-from-right-4 duration-500">
            {state?.error && <div className="mx-4 mt-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-[11px] font-bold text-danger">{state.error}</div>}
            {item?._id && <input type="hidden" name="id" value={item._id} />}
            <input type="hidden" name="type" value="ASSET" />

            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-8 custom-scrollbar">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Identity */}
                    <div className="lg:col-span-6 bg-card p-8 rounded-[2rem] border border-border space-y-6">
                        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] flex items-center gap-2">
                            <ClipboardCheck size={14}/> Asset Info
                        </h3>
                        <FormField label="Asset Name *" name="name" required placeholder="e.g. Study Table" defaultValue={item?.name} />
                        <SelectAssetCategory name="category" defaultValue={item?.category?._id || item?.category || ""} required />
                    </div>

                    {/* Stewardship - Using accent/5 for the tinted well */}
                    <div className="lg:col-span-6 bg-accent/5 p-8 rounded-[2rem] border border-accent/20 space-y-6">
                        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] flex items-center gap-2">
                            <MapPin size={14}/> Placement
                        </h3>
                        <FormField label="Room / Area" name="location" placeholder="e.g. Boys Dorm" defaultValue={item?.location} />
                        <SelectField label="Initial Condition" name="condition" defaultValue={item?.condition || "NEW"} 
                            options={[
                                { label: "Brand New / Sealed", value: "NEW" },
                                { label: "Functional / Used", value: "GOOD" },
                                { label: "Needs Maintenance", value: "REPAIR" }
                            ]} 
                        />
                    </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border">
                    <FormField label="Audit Description" name="description" placeholder="Serial numbers..." defaultValue={item?.description} />
                </div>
            </div>

            {/* Footer handles blur and card bg */}
            <div className="shrink-0 flex justify-end gap-5 p-6 border-t border-border bg-card/80 backdrop-blur-md rounded-t-[2.5rem]">
                <button type="button" onClick={closeModal} className="text-[10px] font-black uppercase text-text-muted hover:text-text tracking-widest transition-colors">Cancel</button>
                <Button type="submit" disabled={isPending} className="px-14 h-14 font-black text-xs uppercase tracking-[0.2em] text-text-invert bg-accent shadow-glow transition-all active:scale-95">
                    {isPending ? "REGISTERING..." : "COMMIT_ASSET"}
                </Button>
            </div>
        </form>
    );
};