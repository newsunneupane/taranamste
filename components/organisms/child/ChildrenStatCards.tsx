import React from "react";

export default function ChildrenStatCards({ children }: { children: any[] }) {
    // 🧮 Calculate the live metrics
    const totalRecords = children.length;
    const inCare = children.filter(child => child.status === "IN_CARE").length;
    const placed = children.filter(child => child.status === "ADOPTED" || child.status === "FOSTERED").length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAdmissions = children.filter(child => new Date(child.admissionDate) >= thirtyDaysAgo).length;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-card p-4 md:p-5 rounded-2xl border border-primary/20 shadow-card">
                <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg border border-primary/15 shrink-0">🏠</div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">Active</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-text tracking-tight leading-none">{inCare}</div>
                <div className="hidden md:block text-xs font-medium text-text-muted mt-1.5">Children currently in care</div>
            </div>

            <div className="bg-card p-4 md:p-5 rounded-2xl border border-border shadow-card">
                <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 rounded-xl bg-shaded text-text-muted flex items-center justify-center text-lg border border-border shrink-0">🗂️</div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Total</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-text tracking-tight leading-none">{totalRecords}</div>
                <div className="hidden md:block text-xs font-medium text-text-muted mt-1.5">Lifetime registry records</div>
            </div>

            <div className="bg-card p-4 md:p-5 rounded-2xl border border-border shadow-card">
                <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center text-lg border border-success/20 shrink-0">🕊️</div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Placed</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-text tracking-tight leading-none">{placed}</div>
                <div className="hidden md:block text-xs font-medium text-text-muted mt-1.5">Adopted or fostered</div>
            </div>

            <div className="bg-card p-4 md:p-5 rounded-2xl border border-border shadow-card">
                <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-lg border border-accent/20 shrink-0">🌟</div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">New</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-text tracking-tight leading-none">{recentAdmissions}</div>
                <div className="hidden md:block text-xs font-medium text-text-muted mt-1.5">Admissions in last 30 days</div>
            </div>
        </div>
    );
}