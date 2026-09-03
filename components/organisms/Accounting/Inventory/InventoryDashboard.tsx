"use client";
import React, { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { useUIModals } from "@/hooks/useUIModal";
import { 
    Edit2, 
    PackageOpen, 
    LayoutGrid, 
    List, 
    AlertTriangle, 
    TrendingUp, 
    Package 
} from "lucide-react";

const getCategoryName = (c:any) => typeof c === 'string' ? c : c?.name || 'Uncategorized';

export default function InventoryDashboard({ items }: { items: any[] }) {
    const { openManageStock, openInventoryItemForm } = useUIModals();
    const [view, setView] = useState<"GRID" | "TABLE">("GRID");

    if (items.length === 0) return <EmptyInventoryState openForm={openInventoryItemForm} />;

    const lowStockItems = items.filter(i => i.currentStock <= i.minimumStockLevel);

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            
            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Total Categories" 
                    value={new Set(items.map(i => (i.category?._id || i.category || 'uncat'))).size} 
                    icon={<Package className="text-primary" size={20} />} 
                />
                <StatCard 
                    label="Items in Stock" 
                    value={items.reduce((acc, i) => acc + i.currentStock, 0)} 
                    icon={<TrendingUp className="text-success" size={20} />} 
                />
                <StatCard 
                    label="Low Stock Alerts" 
                    value={lowStockItems.length} 
                    icon={<AlertTriangle className="text-danger" size={20} />} 
                    isAlert={lowStockItems.length > 0}
                />
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-[1.5rem] border border-border shadow-sm">
                <div className="flex bg-shaded p-1 rounded-xl">
                    <button 
                        onClick={() => setView("GRID")}
                        className={`p-2 rounded-lg transition-all ${view === "GRID" ? "bg-card shadow-sm text-primary" : "text-text-muted"}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setView("TABLE")}
                        className={`p-2 rounded-lg transition-all ${view === "TABLE" ? "bg-card shadow-sm text-primary" : "text-text-muted"}`}
                    >
                        <List size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button onClick={() => openInventoryItemForm()} className="btn-primary flex-1 md:flex-none py-2.5 px-6 text-xs">
                        + Register New Item
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {view === "GRID" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <InventoryCard 
                            key={item._id} 
                            item={item} 
                            onEdit={openInventoryItemForm} 
                            onManage={openManageStock} 
                        />
                    ))}
                </div>
            ) : (
                <InventoryTable 
                    items={items} 
                    onEdit={openInventoryItemForm} 
                    onManage={openManageStock} 
                />
            )}
        </div>
    );
}

/* =========================
   NEW SUB-COMPONENTS
========================= */

const StatCard = ({ label, value, icon, isAlert }: any) => (
    <div className={`bg-card p-6 rounded-[2rem] border border-border flex items-center gap-5 transition-all ${isAlert ? 'ring-2 ring-danger/20 border-danger/30' : ''}`}>
        <div className="w-12 h-12 rounded-2xl bg-shaded flex items-center justify-center border border-border/50">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-text font-mono">{value}</p>
        </div>
    </div>
);

const InventoryTable = ({ items, onEdit, onManage }: any) => (
    <div className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-shaded border-b border-border">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Item Detail</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Category</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Current Stock</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {items.map((item:any) => (
                        <tr key={item._id} className="hover:bg-shaded/30 transition-colors group">
                            <td className="px-6 py-4">
                                <p className="font-black text-text capitalize">{item.name}</p>
                                <p className="text-[10px] text-text-muted truncate max-w-[200px]">{item.description || "No description"}</p>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[9px] font-black uppercase bg-shaded px-2.5 py-1 rounded-lg border border-border">{getCategoryName(item.category)}</span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold">
                                {item.currentStock}
                            </td>
                            <td className="px-6 py-4">
                                {item.currentStock <= item.minimumStockLevel ? (
                                    <span className="flex items-center gap-1.5 text-danger text-[10px] font-black uppercase tracking-widest">
                                        <AlertTriangle size={12} /> Low Stock
                                    </span>
                                ) : (
                                    <span className="text-success text-[10px] font-black uppercase tracking-widest">Optimal</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onEdit({item})} className="p-2 text-text-muted hover:text-primary transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <Button onClick={() => onManage({item})} className="h-8 px-3 text-[9px] uppercase tracking-tighter">Manage</Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
/* =========================================
   RE-ADDED SUB-COMPONENTS
   ========================================= */

const InventoryCard = ({ item, onEdit, onManage }: any) => (
    <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between card-hover group transition-all">
        <div>
            <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                    {getCategoryName(item.category)}
                </span>
                <div className="flex items-center gap-2">
                    {item.currentStock <= item.minimumStockLevel && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-danger bg-danger/10 border border-danger/20 px-2.5 py-1 rounded-lg">
                            ⚠️ Low
                        </span>
                    )}
                    <button 
                        onClick={() => onEdit({item})} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-primary transition-all"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
            </div>
            <h3 className="font-black text-text text-xl tracking-tight group-hover:text-primary transition-colors capitalize">
                {item.name}
            </h3>
            {item.description && (
                <p className="text-[10px] text-text-muted mt-1 line-clamp-1 opacity-70">
                    {item.description}
                </p>
            )}
        </div>
        <div className="mt-8 flex items-end justify-between border-t border-border pt-5">
            <div>
                <p className="font-ubuntu text-[9px] text-text-muted font-black uppercase tracking-widest">In Stock</p>
                <p className="font-black font-mono text-3xl text-text tracking-tighter mt-1">
                    {item.currentStock}
                </p>
            </div>
            <Button onClick={() => onManage({item})} className="btn-primary h-9 px-4 text-[10px]">Manage</Button>
        </div>
    </div>
);

function EmptyInventoryState({ openForm }: any) {
    return (
        <div className="py-20 text-center bg-card border border-border rounded-[2rem] shadow-sm flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-shaded rounded-full flex items-center justify-center mb-2">
                <PackageOpen size={40} className="text-text-muted opacity-20" />
            </div>
            <div>
                <p className="text-text font-black text-xl uppercase tracking-tight">Warehouse Empty</p>
                <p className="text-sm text-text-muted mt-1">No items registered in the inventory system yet.</p>
            </div>
            <Button onClick={openForm} className="btn-primary mt-4">+ Register First Item</Button>
        </div>
    );
}