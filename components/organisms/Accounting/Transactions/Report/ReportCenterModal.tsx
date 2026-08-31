"use client";
import React from "react";
import { Button } from "@/components/atoms/Button";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";

const ReportCenterModal: React.FC<{
    filter: any;
    setFilter: (filter: any) => void;
    setIsModalOpen: (isOpen: boolean) => void;
}> = ({ filter, setFilter, setIsModalOpen }) => {

    return (
        // Overlay: bg-zinc-900/60 -> bg-bg-invert/20
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-invert/20 backdrop-blur-md p-4 animate-in fade-in duration-200">

            {/* Modal Shell: bg-white -> bg-card, border-zinc-200 -> border-border */}
            <div className="bg-card w-full max-w-md rounded-dashboard shadow-glow border border-border flex flex-col overflow-hidden animate-in zoom-in-95 transition-colors duration-500">

                {/* HEADER: bg-zinc-50 -> bg-shaded, border-b -> border-border */}
                <div className="p-6 md:p-8 border-b border-border bg-shaded shrink-0 transition-colors">
                    {/* Typography: text-zinc-900 -> text-text, text-zinc-500 -> text-text-muted */}
                    <h3 className="text-xl font-black text-text tracking-tight">
                        Select Custom Range
                    </h3>
                    <p className="text-xs text-text-muted font-medium mt-1">
                        Choose start and end dates for report generation
                    </p>
                </div>

                {/* BODY */}
                <div className="p-6 md:p-8 flex flex-col gap-6">

                    {/* START DATE */}
                    <div className="flex flex-col gap-2">
                        {/* Label: Upgraded to Micro-caps aesthetic */}
                        <label className="text-[10px] uppercase font-black text-text-muted tracking-[0.15em]">
                            Start Date
                        </label>
                        <NepaliDateField
                            label=""
                            value={filter.startDate}
                            onChange={(adIso) => setFilter({ ...filter, startDate: adIso })}
                            placeholder="Select Nepali Date"
                        />
                    </div>

                    {/* END DATE */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase font-black text-text-muted tracking-[0.15em]">
                            End Date
                        </label>
                        <NepaliDateField
                            label=""
                            value={filter.endDate}
                            onChange={(adIso) => setFilter({ ...filter, endDate: adIso })}
                            placeholder="Select Nepali Date"
                        />
                    </div>

                </div>

                {/* FOOTER: bg-white -> bg-card, border-t -> border-border */}
                <div className="p-6 md:px-8 border-t border-border flex justify-end gap-3 bg-card transition-colors">

                    {/* Cancel Button: Updated text and hover to match theme */}
                    <Button
                        variant="ghost"
                        className="px-6 font-bold text-text-muted hover:bg-shaded hover:text-text transition-colors"
                        onClick={() => {
                            setIsModalOpen(false);

                            if (!filter.startDate) {
                                setFilter({ ...filter, timeframe: "MONTH" });
                            }
                        }}
                    >
                        Cancel
                    </Button>

                    {/* Apply Button: Replaced manual classes with global utility */}
                    <Button
                        className="btn-primary px-8"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Apply Range
                    </Button>

                </div>
            </div>
        </div>
    );
};

export default ReportCenterModal;