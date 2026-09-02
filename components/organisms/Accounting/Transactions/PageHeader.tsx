"use client";
import React from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";

const PageHeader = ({ accounts, categories }: { accounts?: any[]; categories?: any[] }) => {
    const { openTransactionForm, openBulkExpenseUpload } = useUIModals();
    
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

            {/* ACTIONS — grid even on desktop, smaller */}
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[300px]">
                <Button
                    onClick={() => openBulkExpenseUpload({ accounts, categories })}
                    size="sm"
                    variant="secondary"
                    className="font-black text-[10px] tracking-widest h-8 px-3"
                >
                    Bulk Upload
                </Button>
                <Button
                    onClick={() => openTransactionForm()}
                    size="sm"
                    className="font-black text-[10px] tracking-widest h-8 px-3"
                >
                    + NEW
                </Button>
            </div>
        </div>
    );
};

export default PageHeader;