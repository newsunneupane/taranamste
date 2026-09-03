"use client";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";
import React from "react";

export default function StaffHomeTop() {
    const { openStaffForm } = useUIModals();
    
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 md:p-6 rounded-[2rem] shadow-sm border border-border transition-colors duration-500">
            <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shrink-0">
                    👔
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <h1 className="font-ubuntu text-xl md:text-2xl font-black text-text tracking-tight truncate">
                        Employees
                    </h1>
                    <p className="font-ubuntu text-xs md:text-sm text-text-muted font-medium truncate">
                        Manage workforce, roles & compliance
                    </p>
                </div>
            </div>

            <Button
                onClick={() => openStaffForm()}
                className="w-full sm:w-auto bg-primary text-text-invert hover:opacity-90 shadow-glow font-bold py-3 sm:py-2.5 px-6 rounded-xl transition-all"
            >
                + Add Employee
            </Button>
        </div>
    );
}