"use client";
import React, { useActionState, useEffect } from "react";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { saveInventoryCategory } from "@/app/actions/inventoryCategory";
import { Box, ShieldAlert } from "lucide-react";

export const ConsumableForm = ({ closeModal, onSaved }: any) => {
    const [state, formAction, isPending] = useActionState(saveInventoryCategory, { 
        success: false, 
        error: null, 
        data: null 
    });

    useEffect(() => {
        if (state?.success && state.data) {
            if (onSaved && typeof onSaved === 'function') {
                onSaved(state.data);
            }
            closeModal();
        }
    }, [state, closeModal, onSaved]);

    return (
        <form action={formAction} className="flex flex-col gap-6 w-full p-1 animate-in fade-in duration-300">
            {/* HIDDEN TYPE DISCRIMINATOR */}
            <input type="hidden" name="type" value="CONSUMABLE" />
            
            <header className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Box size={18} />
                </div>
                <div>
                    <h2 className="text-[10px] font-black text-primary uppercase tracking-widest">Consumable Registry</h2>
                    <p className="text-[9px] text-text-muted uppercase font-bold">Add a new category label</p>
                </div>
            </header>

            <FormField 
                label="Category Name *" 
                name="name" 
                required 
                placeholder="e.g. Grains, Toiletries, Stationery" 
                autoFocus
            />

            {state?.error && (
                <div className="flex items-center gap-2 p-3 bg-danger/5 border border-danger/20 rounded-xl text-danger text-[10px] font-bold uppercase tracking-tight">
                    <ShieldAlert size={12} /> {state.error}
                </div>
            )}

            <div className="flex justify-end gap-5 mt-2 border-t border-border pt-5">
                <button 
                    type="button" 
                    onClick={closeModal} 
                    className="text-[10px] font-black uppercase text-text-muted hover:text-text transition-colors"
                >
                    Cancel
                </button>
                <Button 
                    type="submit" 
                    disabled={isPending} 
                    className="bg-primary px-10 h-10 font-black text-[10px] tracking-widest text-text-invert rounded-xl"
                >
                    {isPending ? "Loading..." : "ADD_CATEGORY"}
                </Button>
            </div>
        </form>
    );
};