"use client"

import { useUIModals } from "@/hooks/useUIModal";
import { Button } from "../atoms/Button"
import { UserPlus, BookOpen, Package, } from "lucide-react";
import Link from "next/link";


function ActionBtn({ open, href, title, sub, icon, variant }: any) {
    const variants: any = {
        primary: "border-primary/15 bg-primary/[0.04] text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-glow",
        success: "border-success/15 bg-success/[0.04] text-success hover:bg-success hover:text-white hover:border-success hover:shadow-glow-success",
        warning: "border-warning/15 bg-warning/[0.04] text-warning hover:bg-warning hover:text-white hover:border-warning",
    }
    const Inside = () => (
        <>
            <div className="flex flex-col text-left min-w-0 flex-1">
                <span className="font-black text-[11px] uppercase tracking-[0.12em] leading-none truncate">{title}</span>
                <span className="text-[9px] font-bold uppercase mt-1 opacity-60 group-hover:opacity-90 transition-colors truncate">{sub}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-card border border-border/60 flex items-center justify-center shrink-0 group-hover:bg-white/20 group-hover:border-white/30 group-hover:text-white transition-all">
                {icon}
            </div>
        </>
    )

    const base = "group flex items-center gap-3 p-3.5 bg-card rounded-xl border shadow-sm transition-all duration-300 active:scale-[0.98]";

    if (href) return (
        <Link href={href} className={`${base} ${variants[variant]}`}>
            <Inside />
        </Link>
    )

    return (
        <button onClick={() => { open() }} className={`${base} ${variants[variant]} w-full text-left`}>
            <Inside />
        </button>
    )
}

const QuickActionSidebar = () => {
    const { openChildModal } = useUIModals()
    return (
        <div className="w-full flex flex-col gap-3">
            <h2 className="text-[9px] font-black text-text-muted uppercase tracking-[0.25em] ml-1">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
                <ActionBtn open={openChildModal} title="Admit Child" sub="New intake" icon={<UserPlus size={15} />} variant="primary" />
                <ActionBtn href="/finance" title="Finances" sub="In & out" icon={<BookOpen size={15} />} variant="success" />
                <ActionBtn href="/inventory" title="Inventory" sub="Stock" icon={<Package size={15} />} variant="warning" />
            </div>
        </div>
    )
}

export default QuickActionSidebar