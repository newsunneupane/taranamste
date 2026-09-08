"use client";
import React from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";

export function ChildrenHeader() {
    const { openChildModal } = useUIModals()
    
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 md:p-6 rounded-2xl shadow-card border border-border">
            <div className="flex items-center gap-4 w-full">
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-xl border border-primary/15 shrink-0">
                    👧👦
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <h1 className="text-base md:text-lg font-bold text-text tracking-tight truncate">
                        Children in Care
                    </h1>
                    <p className="text-sm text-text-muted truncate">
                        Manage admissions & profiles
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <Button
                    onClick={() => openChildModal()}
                    className="flex-1 sm:flex-none w-full sm:w-auto"
                >
                    + Admit Child
                </Button>
            </div>
        </div>
    );
}