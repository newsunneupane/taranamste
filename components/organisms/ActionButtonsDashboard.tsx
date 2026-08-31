"use client"

import { useUIModals } from "@/hooks/useUIModal";
import { Button } from "../atoms/Button"
import { UserPlus, BookOpen, Package, } from "lucide-react";
import Link from "next/link";


function ActionBtn({ open, href, title, sub, icon, variant }: any) {
    const variants: any = {
        primary: "border-primary/20 text-primary hover:bg-primary/5 hover:border-primary",
        success: "border-success/20 text-success hover:bg-success/5 hover:border-success",
        warning: "border-warning/20 text-warning hover:bg-warning/5 hover:border-warning",
    }
    const Inside = () => (
        <>
            <div className="flex flex-col">
                <span className="font-black text-xs uppercase tracking-[0.15em]">{title}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase mt-1 opacity-70 group-hover:text-current transition-colors">{sub}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text-muted group-hover:text-current group-hover:scale-110 group-hover:border-current transition-all">
                {icon}
            </div>
        </>
    )

    if (href) return (
        <Link href={href} className={`group flex items-center justify-between p-6 bg-card rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-glow ${variants[variant]}`}>
            <Inside />
        </Link>
    )


    return (
        <button onClick={() => { open() }} className={`group flex items-center justify-between p-6 bg-card rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-glow ${variants[variant]}`}>
            <Inside />
        </button>
    )
}

const QuickActionSidebar = () => {
    const { openChildModal } = useUIModals()
    return (
        <div className="lg:col-span-1 flex flex-col gap-5">
            <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Quick Actions</h2>
            <ActionBtn open={openChildModal} title="Admit Child" sub="Add a new child" icon={<UserPlus size={18} />} variant="primary" />
            <ActionBtn href="/finance" title="View Finances" sub="Money in & out" icon={<BookOpen size={18} />} variant="success" />
            <ActionBtn href="/inventory" title="Manage Inventory" sub="Supplies in stock" icon={<Package size={18} />} variant="warning" />
        </div>
    )
}

export default QuickActionSidebar