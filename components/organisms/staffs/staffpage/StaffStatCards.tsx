import React from "react";

export default function StaffStatCards({ staffMembers }: { staffMembers: any[] }) {
    // ✨ THE FIXES: Updated to match the new boolean schema, and added the System Access check
    const ssfCount = staffMembers.filter(s => s.ssf?.enrolled).length;
    const linkedAccessCount = staffMembers.filter(s => s.userId).length; 
    const activeCount = staffMembers.filter(s => s.status === "ACTIVE").length;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            
            {/* Active */}
            <div className="bg-card p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-primary/30 shadow-sm">
                <div className="flex justify-between items-center mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg md:text-xl border border-primary/20 shrink-0">👥</div>
                    <span className="font-ubuntu text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">Active</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-text tracking-tighter leading-none">{activeCount}</div>
                <div className="hidden md:block font-ubuntu text-xs text-text-muted mt-2">Total Employees</div>
            </div>

            {/* SSF */}
            <div className="bg-card p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-border shadow-sm">
                <div className="flex justify-between items-center mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-success/10 text-success flex items-center justify-center text-lg md:text-xl border border-success/20 shrink-0">🛡️</div>
                    <span className="font-ubuntu text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">SSF</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-text tracking-tighter leading-none">{ssfCount}</div>
                <div className="hidden md:block font-ubuntu text-xs text-text-muted mt-2">SSF Enrolled</div>
            </div>

            {/* ✨ NEW: System Access Card */}
            <div className="bg-card p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-border shadow-sm">
                <div className="flex justify-between items-center mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center text-lg md:text-xl border border-warning/20 shrink-0">🔐</div>
                    <span className="font-ubuntu text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">Access</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-text tracking-tighter leading-none">{linkedAccessCount}</div>
                <div className="hidden md:block font-ubuntu text-xs text-text-muted mt-2">Linked Logins</div>
            </div>

        </div>
    );
}