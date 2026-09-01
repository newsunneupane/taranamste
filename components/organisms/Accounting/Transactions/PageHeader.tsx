"use client";
import React from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";

const PageHeader = () => {
    const { openTransactionForm } = useUIModals();
    
    return (
        // ✨ Compact header - distinct hierarchy
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-4 md:p-5 rounded-2xl shadow-sm border border-border transition-colors duration-500 mb-6 md:mb-0">
            
            {/* BRANDING & TITLE */}
            <div className="flex items-center gap-3 w-full">
                {/* ✨ Compact icon */}
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg border border-primary/20 shrink-0">
                    📊
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                    <h1 className="font-ubuntu text-[15px] md:text-lg font-black text-text tracking-tight truncate">
                        Finances
                    </h1>
                    <p className="font-ubuntu text-[11px] font-semibold text-primary/70 tracking-wide truncate">
                        Track all money coming in and going out
                    </p>
                </div>
            </div>

            {/* ACTION */}
            <Button
                onClick={() => openTransactionForm()}
                className="w-full sm:w-auto bg-primary text-text-invert hover:opacity-90 shadow-glow font-bold py-2 sm:py-2 px-5 rounded-xl text-xs transition-all"
            >
                + New Transaction
            </Button>
        </div>
    );
};

export default PageHeader;