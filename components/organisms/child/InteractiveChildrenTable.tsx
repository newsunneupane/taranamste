"use client";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";
import { Search, Filter } from "lucide-react"; // ✨ Added Icons
import { formatNepaliDateShort } from "@/lib/nepaliDate";

export default function InteractiveChildrenTable({ children }: { children: any[] }) {
    const { openChildModal, openChildProfile } = useUIModals();
    
    // ✨ 1. State for Search and Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    
    // ✨ 2. The Filtering Logic
    const filteredChildren = useMemo(() => {
        return children.filter((child) => {
            // Check Search
            const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm.toLowerCase());
            
            // Check Status
            const matchesStatus = statusFilter === "ALL" || child.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [children, searchTerm, statusFilter]);

    // Format helper
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return formatNepaliDateShort(dateString);
    };

    // If zero children exist in the database at all
    if (children.length === 0) return <EmptyChildrenState />;

    return (
        <div className="flex flex-col gap-4">
            {/* =========================================
                THE FILTER TOOLBAR
                ========================================= */}
            <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-[1.5rem] border border-border shadow-sm">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background border border-border/50 text-text placeholder:text-text-muted text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                    />
                </div>

                {/* Status Dropdown */}
                <div className="relative shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                        <Filter size={16} />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-48 bg-background border border-border/50 text-text text-sm rounded-xl pl-10 pr-10 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer shadow-inner font-bold"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="IN_CARE">In Care</option>
                        <option value="ADOPTED">Adopted</option>
                        <option value="FOSTERED">Fostered</option>
                        <option value="GRADUATED">Graduated</option>
                    </select>
                    {/* Custom Dropdown Chevron */}
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* If filters yield no results */}
            {filteredChildren.length === 0 && (
                <div className="bg-card p-12 rounded-[2rem] border border-border text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-shaded rounded-full flex items-center justify-center text-text-muted mb-2">🔍</div>
                    <p className="text-text font-bold text-lg">No matches found</p>
                    <p className="text-text-muted text-sm">Try adjusting your search or filters.</p>
                    <Button variant="ghost" onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }} className="mt-4 text-primary hover:bg-primary/10">
                        Clear Filters
                    </Button>
                </div>
            )}

            {/* =========================================
                DESKTOP VIEW (Hidden on Mobile) 
                ========================================= */}
            {filteredChildren.length > 0 && (
                <div className="hidden md:block bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden transition-colors duration-500">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <TableHead />
                            <tbody className="divide-y divide-border">
                                {/* ✨ Changed from children.map to filteredChildren.map */}
                                {filteredChildren.map((child) => (
                                    <tr key={child._id} className="hover:bg-shaded/80 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar child={child} />
                                                <span className="font-bold text-text group-hover:text-primary transition-colors capitalize">
                                                    {child.firstName} {child.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <ChildStatusBadge status={child.status} />
                                        </td>
                                        <td className="p-4 text-xs font-medium text-text-muted">
                                            {formatDate(child.admissionDate)}
                                        </td>
                                        <td className="p-4 text-xs font-medium text-text-muted">
                                            {formatDate(child.dateOfBirth)}
                                        </td>
                                        <td className="p-4">
                                            <ActionButtons 
                                                child={child} 
                                                openChildModal={openChildModal} 
                                                openChildProfile={openChildProfile} 
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* =========================================
                MOBILE VIEW (Individual Floating Cards)
                ========================================= */}
            {filteredChildren.length > 0 && (
                <div className="flex flex-col md:hidden">
                    {/* ✨ Changed from children.map to filteredChildren.map */}
                    {filteredChildren.map((child, index) => (
                        <div 
                            key={child._id} 
                            className={`border border-border shadow-sm flex flex-col overflow-hidden transition-all ${
                                index % 2 === 0 ? "bg-card" : "bg-alt"
                            }`}
                        >
                            <div className="p-5 flex items-center gap-4 border-b border-border bg-shaded">
                                <div className="shrink-0">
                                    <Avatar child={child} className="w-14 h-14 text-lg" />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0 gap-1.5">
                                    <h3 className="font-black text-text text-xl tracking-tight truncate leading-none capitalize">
                                        {child.firstName} {child.lastName}
                                    </h3>
                                    <div className="self-start">
                                        <ChildStatusBadge status={child.status} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4 bg-surface p-4 rounded-2xl border border-border shadow-inner">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-ubuntu text-[9px] font-black text-text-muted uppercase tracking-widest">Admitted</span>
                                        <span className="text-sm font-bold text-text">{formatDate(child.admissionDate)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-ubuntu text-[9px] font-black text-text-muted uppercase tracking-widest">D.O.B.</span>
                                        <span className="text-sm font-bold text-text">{formatDate(child.dateOfBirth)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <Button
                                        variant="ghost"
                                        onClick={() => openChildModal({ data: child })}
                                        className="flex-1 text-sm font-bold text-text-muted bg-surface hover:bg-warning/10 hover:text-warning rounded-xl border border-border shadow-sm transition-all py-3 flex justify-center items-center gap-2"
                                    >
                                        ✏️ Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => openChildProfile({ child })}
                                        className="flex-1 text-sm font-bold text-text-invert bg-primary hover:opacity-90 rounded-xl shadow-glow transition-all py-3 flex justify-center items-center gap-2"
                                    >
                                        👁️ View
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* =========================================
   REUSABLE SUB-COMPONENTS (Keep these exactly the same)
   ========================================= */

const Avatar = ({ child, className = "w-10 h-10 text-sm" }: { child: any, className?: string }) => {
    if (child.profileImageUrl) {
        return <img src={child.profileImageUrl} alt={`${child.firstName} ${child.lastName}`} className={`${className} rounded-full object-cover border border-border shadow-sm`} />;
    }
    return <div className={`${className} rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shadow-sm capitalize`}>{child.firstName?.charAt(0) || "👤"}</div>;
};

const ActionButtons = ({ child, openChildModal, openChildProfile }: any) => (
    <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={() => openChildModal({ data: child })} className="text-xs font-bold text-text-muted bg-card hover:bg-warning/10 hover:text-warning rounded-xl px-3 border border-border shadow-sm hover:border-warning/30 transition-all">✏️ Edit</Button>
        <Button variant="ghost" onClick={() => openChildProfile({ child })} className="text-xs font-bold text-text-muted bg-card hover:bg-primary/10 hover:text-primary rounded-xl px-3 border border-border shadow-sm hover:border-primary/30 transition-all">👁️ View</Button>
    </div>
);

function ChildStatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { color: string, icon: string, label: string }> = {
        IN_CARE: { color: "bg-primary/10 text-primary border-primary/20", icon: "🏠", label: "In Care" },
        ADOPTED: { color: "bg-success/10 text-success border-success/20", icon: "🕊️", label: "Adopted" },
        FOSTERED: { color: "bg-accent/10 text-accent border-accent/20", icon: "🤝", label: "Fostered" },
        GRADUATED: { color: "bg-warning/10 text-warning border-warning/20", icon: "🎓", label: "Graduated" }
    };
    const config = statusMap[status] || { color: "bg-shaded text-text-muted border-border", icon: "📌", label: status ? status.replace("_", " ") : "UNKNOWN" };
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest shadow-sm ${config.color}`}><span className="text-[12px] leading-none">{config.icon}</span>{config.label}</span>;
}

const TableHead = () => (
    <thead>
        <tr className="bg-shaded/50 border-b border-border">
            <th className="p-5 font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Name & Profile</th>
            <th className="p-5 font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Care Status</th>
            <th className="p-5 font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Admitted</th>
            <th className="p-5 font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">DOB</th>
            <th className="p-5 font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
        </tr>
    </thead>
);

function EmptyChildrenState() {
    return (
        <div className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden p-16 text-center flex flex-col items-center gap-3 transition-colors duration-500">
            <div className="w-16 h-16 bg-shaded rounded-full flex items-center justify-center text-3xl shadow-sm border border-border text-text-muted">🧸</div>
            <div>
                <p className="text-text font-bold">No children registered yet.</p>
                <p className="text-sm text-text-muted mt-1">Click "Admit Child" to create the first profile.</p>
            </div>
        </div>
    );
}