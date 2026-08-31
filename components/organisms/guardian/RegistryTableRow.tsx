"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import VettingBadge from "@/components/organisms/guardian/VettingBadge";
import { User } from "lucide-react";
import { useUIModals } from "@/hooks/useUIModal";

export function RegistryTableRow({ guardian }: { guardian: any }) {
    const { openGuardianDossier } = useUIModals()
    return (
        <tr className="
            bg-card 
            hover:bg-shaded/40 
            transition-all 
            group 
            cursor-default 
            border-b border-border/40 
            last:border-0
        ">

            {/* APPLICANT IDENTITY */}
            <td className="p-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl border border-border shadow-sm bg-bg flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary/40 transition-all duration-300">
                        {guardian.profileImageUrl ? (
                            <img
                                src={guardian.profileImageUrl}
                                alt={guardian.primaryName}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <User className="text-text-muted opacity-30 w-6 h-6" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-text group-hover:text-primary transition-colors text-sm tracking-tight">
                            {guardian.primaryName}
                        </span>
                        <span className="text-[11px] text-text-muted font-bold tracking-tight opacity-70">
                            {guardian.phone}
                        </span>
                    </div>
                </div>
            </td>

            {/* TYPE BADGE */}
            <td className="p-5">
                <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                    {guardian.type}
                </span>
            </td>

            {/* VETTING STATUS */}
            <td className="p-5">
                <VettingBadge status={guardian.vettingStatus} />
            </td>

            {/* ASSIGNED COUNT */}
            <td className="p-5">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-text bg-shaded w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center shadow-inner group-hover:border-primary/30 transition-all">
                        {guardian.assignedChildren?.length || 0}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase font-black tracking-[0.15em] opacity-60">
                        Placed
                    </span>
                </div>
            </td>

            {/* ACTION */}
            <td className="p-5 text-right">
                {/* <Link href={`/guardians/${guardian._id}`}> */}
                <Button
                    onClick={()=>openGuardianDossier({guardianId:guardian._id})}
                    variant="ghost"
                    size="sm"
                    className="border border-border bg-bg group-hover:border-primary/40 group-hover:text-primary shadow-sm rounded-xl transition-all"
                >
                    View Profile →
                </Button>
                {/* </Link> */}

            </td>
        </tr>
    );
}