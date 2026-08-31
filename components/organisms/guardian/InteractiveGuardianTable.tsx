"use client";
import React, { useState, useMemo } from "react";
import { Search, Filter, User } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import Link from "next/link";
import { RegistryTableRow } from "./RegistryTableRow"; // ✨ Importing our custom component
import { useUIModals } from "@/hooks/useUIModal";

export default function InteractiveGuardianTable({ guardians }: { guardians: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const {openGuardianDossier,openGuardianModal}=useUIModals()

    const filtered = useMemo(() => {
        return guardians.filter(g => {
            const matchesSearch = `${g.firstName} ${g.lastName} ${g.email}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || g.vettingStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [guardians, searchTerm, statusFilter]);

    return (
        <div className="flex flex-col gap-4">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-[1.5rem] border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full bg-background border border-border/50 text-text text-sm rounded-xl pl-10 py-3 outline-none focus:ring-1 focus:ring-primary shadow-inner font-ubuntu"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="bg-background border border-border/50 text-text text-sm rounded-xl px-4 py-3 outline-none font-black uppercase tracking-widest shadow-inner cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="VETTING">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="BLACKLISTED">Blacklisted</option>
                </select>
            </div>

            {/* =========================================
                DESKTOP VIEW (Using our Custom Row)
                ========================================= */}
            <div className="hidden md:block bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-shaded/50 border-b border-border">
                        <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                            <th className="p-6">Family / Applicant</th>
                            <th className="p-6">Type</th>
                            <th className="p-6">Application Status</th>
                            <th className="p-6">Assigned</th>
                            <th className="p-6 text-right pr-10">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {filtered.map(g => (
                            <RegistryTableRow key={g._id} guardian={g} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* =========================================
                MOBILE VIEW (Alternating Compact Cards)
                ========================================= */}
            <div className="flex flex-col md:hidden overflow-hidden rounded-[2rem] border border-border">
                {filtered.map((g, idx) => (
                    <div
                        key={g._id}
                        className={`p-5 flex flex-col gap-4 border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-card' : 'bg-alt'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                {/* Mobile Avatar */}
                                <div className="w-12 h-12 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                                    {g.profileImageUrl ? (
                                        <img src={g.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-text-muted opacity-30 w-6 h-6" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="font-ubuntu font-black text-text text-lg capitalize leading-none mb-1">{g.firstName} {g.lastName}</h3>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{g.guardianType || 'Applicant'}</span>
                                </div>
                            </div>
                            <StatusBadge status={g.vettingStatus} />
                        </div>

                        {/* Mobile Data Well */}
                        <div className="grid grid-cols-2 gap-3 bg-surface p-3 rounded-xl border border-border/50 shadow-inner">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.1em]">Contact</span>
                                <span className="text-[11px] font-bold text-text truncate">{g.phone || g.email}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.1em]">Assigned</span>
                                <span className="text-[11px] font-black text-primary uppercase">{g.assignedChildren?.length || 0} Placed</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={()=>openGuardianModal({data:g})} className="flex-1 bg-background text-text border border-border py-3 rounded-xl text-xs font-bold transition-all active:scale-95">
                                Edit
                            </Button>
                            <Button onClick={()=>openGuardianDossier({guardianId:g._id})} className="w-full bg-primary text-text-invert py-3 rounded-xl text-xs font-bold shadow-glow transition-all active:scale-95">
                                View Profile
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Internal Helper for Mobile Status
function StatusBadge({ status }: { status: string }) {
    const config: any = {
        VETTING: "bg-warning/10 text-warning border-warning/20",
        APPROVED: "bg-success/10 text-success border-success/20",
        BLACKLISTED: "bg-danger/10 text-danger border-danger/20",
    };
    return (
        <span className={`px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${config[status] || 'bg-shaded text-text-muted border-border'}`}>
            {status}
        </span>
    );
}