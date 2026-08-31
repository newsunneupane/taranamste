"use client";
import React from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";

const PageHeader = () => {
    const { openTransactionForm } = useUIModals();
    
    return (
        // ✨ Upgraded to the standardized Card Wrapper layout
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 md:p-6 rounded-[2rem] shadow-sm border border-border transition-colors duration-500 mb-8 md:mb-0">
            
            {/* BRANDING & TITLE */}
            <div className="flex items-center gap-4 w-full">
                {/* ✨ Added the standard Module Icon block */}
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shrink-0">
                    📊
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                    <h1 className="font-ubuntu text-xl md:text-2xl font-black text-text tracking-tight truncate">
                        Finances
                    </h1>
                    <p className="font-ubuntu text-xs md:text-sm text-text-muted font-medium truncate">
                        Track all money coming in and going out
                    </p>
                </div>
            </div>

            {/* ACTION */}
            {/* ✨ Made button full-width on mobile (w-full sm:w-auto) and slightly taller for thumb-tapping */}
            <Button
                onClick={() => openTransactionForm()}
                className="w-full sm:w-auto bg-primary text-text-invert hover:opacity-90 shadow-glow font-bold py-3 sm:py-2.5 px-6 rounded-xl transition-all"
            >
                + New Transaction
            </Button>
        </div>
    );
};

export default PageHeader;