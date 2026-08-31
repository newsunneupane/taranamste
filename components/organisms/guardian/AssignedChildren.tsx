"use client"; // 🚨 This is now a pure UI component

import React from 'react';
import { UserPlus, Baby, ShieldCheck } from 'lucide-react';
import { useUIModals } from '@/hooks/useUIModal';

interface AssignedChildrenProps {
    guardian: any;
}

export const AssignedChildren = ({ guardian }: AssignedChildrenProps) => {
    // We use the data passed down from the Dossier Modal
    const assignedIds = new Set(guardian.assignedChildren?.map((c: any) => c._id) || []);
    const { openAssignChildrenModal, openModifyPlacementsModal } = useUIModals()
    return (
        <div className="bg-card rounded-dashboard border border-border shadow-glow flex flex-col overflow-hidden transition-all duration-500">

            {/* HEADER */}
            <div className="p-6 border-b border-border bg-shaded/30 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
                        Assigned Children
                    </h3>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest opacity-60">
                        Current: {assignedIds.size}
                    </p>
                </div>
                <Baby className="text-primary w-5 h-5 opacity-40" />
            </div>

            {/* CONTENT */}
            <div className="p-6 flex flex-col gap-4">
                {guardian.assignedChildren?.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-border/50 rounded-2xl">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                            No active placements found
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {guardian.assignedChildren.map((child: any) => (
                            <div
                                key={child._id}
                                className="flex items-center justify-between p-4 bg-bg border border-border rounded-2xl group hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-shaded border border-border flex items-center justify-center overflow-hidden">
                                        {child.profileImageUrl ? (
                                            <img src={child.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Baby className="w-5 h-5 text-text-muted/30" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text text-xs group-hover:text-primary transition-colors">
                                            {child.firstName} {child.lastName}
                                        </p>
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                            Status: <span className="text-success">{child.status}</span>
                                        </p>
                                    </div>
                                </div>
                                <ShieldCheck className="w-4 h-4 text-success opacity-40" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ACTION FOOTER */}
            <div className="p-4 bg-shaded/20 border-t border-border/50">
                <button
                    onClick={() => openModifyPlacementsModal({guardian})}
                    className="w-full py-3 rounded-xl bg-bg border border-border text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-primary hover:border-primary/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    Modify Placements →
                </button>
                <button
                    onClick={() => openAssignChildrenModal({guardianId:guardian._id})}
                    className="w-full py-3 rounded-xl bg-bg border border-border text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-primary hover:border-primary/40 transition-all active:scale-95">
                    Assign Children
                </button>
            </div>
        </div>
    );
};