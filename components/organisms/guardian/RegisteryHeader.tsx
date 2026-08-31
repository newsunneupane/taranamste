"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";

export default function RegistryHeader() {
    const { openGuardianModal } = useUIModals();

    return (
        <>
  
            {/* HEADER: Updated bg-white -> bg-card, border-zinc-200 -> border-border */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-dashboard shadow-glow border border-border transition-colors duration-500">

                {/* LEFT SECTION */}
                <div className="flex items-center gap-5">

                    {/* ICON BOX: Updated bg-zinc-50 -> bg-shaded, border-zinc-200 -> border-border */}
                    <div className="w-12 h-12 bg-shaded rounded-2xl flex items-center justify-center text-2xl border border-border shrink-0 shadow-inner">
                        🤝
                    </div>

                    <div>
                        {/* TYPOGRAPHY: Updated zinc-900 -> text-text, zinc-500 -> text-text-muted */}
                        <h1 className="text-2xl font-black text-text tracking-tight">
                            Guardians
                        </h1>
                        <p className="text-sm text-text-muted font-medium mt-0.5">
                            Manage family applications and placements.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => openGuardianModal()}
                    className="btn-primary shrink-0"
                >
                    + Register Family
                </Button>
            </div>
        </>
    );
}