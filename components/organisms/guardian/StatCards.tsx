"use client";
import React from "react";

export default function StatCards({ guardians }: { guardians: any[] }) {
    const stats = [
        { label: "Total Applicants", val: guardians.length, color: "text-text-muted", bg: "bg-shaded", icon: "👥" },
        { label: "Under Review", val: guardians.filter(g => g.vettingStatus === "VETTING").length, color: "text-warning", bg: "bg-warning/10", icon: "🔍" },
        { label: "Approved", val: guardians.filter(g => g.vettingStatus === "APPROVED").length, color: "text-success", bg: "bg-success/10", icon: "✅" },
        { label: "Blacklisted", val: guardians.filter(g => g.vettingStatus === "BLACKLISTED").length, color: "text-danger", bg: "bg-danger/10", icon: "🚫" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {stats.map((s) => (
                <div key={s.label} className="bg-card p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center text-lg md:text-xl border border-border/50 shrink-0`}>
                            {s.icon}
                        </div>
                        <span className={`font-ubuntu text-[9px] md:text-[10px] font-black uppercase tracking-widest ${s.color}`}>
                            {s.label.split(' ')[1] || s.label}
                        </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-text tracking-tighter leading-none">
                        {s.val}
                    </div>
                    <div className="hidden md:block font-ubuntu text-xs text-text-muted mt-2">{s.label}</div>
                </div>
            ))}
        </div>
    );
}