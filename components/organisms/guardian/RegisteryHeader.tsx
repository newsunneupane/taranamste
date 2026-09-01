"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";

export default function RegistryHeader() {
    const { openGuardianModal } = useUIModals();

    return (
        <>
  
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 md:p-5 rounded-2xl shadow-sm border border-border transition-colors duration-500">

                {/* LEFT SECTION */}
                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg border border-primary/20 shrink-0">
                        🤝
                    </div>

                    <div>
                        <h1 className="font-ubuntu text-[15px] md:text-lg font-black text-text tracking-tight">
                            Guardians
                        </h1>
                        <p className="font-ubuntu text-[11px] font-semibold text-primary/70 tracking-wide">
                            Manage family applications and placements.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => openGuardianModal()}
                    className="bg-primary text-text-invert hover:opacity-90 shadow-glow font-bold py-2 px-5 rounded-xl text-xs shrink-0"
                >
                    + Register Family
                </Button>
            </div>
        </>
    );
}