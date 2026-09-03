"use client";
import React, { useState, useMemo } from "react";
import { Search, Download, XCircle } from "lucide-react";
import { formatNepaliDateShort } from "@/lib/nepaliDate";
import { generateStandardPDF } from "@/lib/generatePDF";
import { generateExcelReport } from "@/lib/generateExcel";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";

export default function InventoryHistoryTable({ logs = [], categories = [], items = [] }: { logs: any[]; categories: any[]; items: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | IN | OUT
    const [timeframe, setTimeframe] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [itemFilter, setItemFilter] = useState("ALL");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [format, setFormat] = useState("PDF");
    const [reportError, setReportError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 30;

    const getCategoryName = (c: any) => typeof c === 'string' ? c : c?.name || '—';
    const getItemCategoryId = (item: any) => item?.category?._id || item?.category || "";

    const filteredItemsByCategory = useMemo(() => {
        if (categoryFilter === "ALL") return items;
        return items.filter((it: any) => String(getItemCategoryId(it)) === String(categoryFilter));
    }, [items, categoryFilter]);

    React.useEffect(() => {
        if (itemFilter !== "ALL") {
            const it = items.find((i:any)=> String(i._id) === String(itemFilter));
            if (it && categoryFilter !== "ALL" && String(getItemCategoryId(it)) !== String(categoryFilter)) {
                setItemFilter("ALL");
            }
        }
    }, [categoryFilter, itemFilter, items]);

    React.useEffect(() => { setItemFilter("ALL"); }, [categoryFilter]);

    const filteredLogs = useMemo(() => {
        const now = new Date();
        return logs.filter((log:any) => {
            const itemName = log.item?.name || "";
            const catName = getCategoryName(log.item?.category || log.item?.category);
            // when item is populated, category is inside item
            const catName2 = log.item?.category?.name || "";
            const searchStr = `${itemName} ${catName} ${catName2} ${log.reason||""} ${log.donorOrVendorName||""} ${log.createdBy?.name||""}`.toLowerCase();
            const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === "ALL" || log.type === typeFilter;
            const d = new Date(log.date);
            const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let inTime = true;
            if (timeframe === "DAY") inTime = dOnly.getTime() === nowOnly.getTime();
            else if (timeframe === "WEEK") { const ago = new Date(nowOnly); ago.setDate(nowOnly.getDate()-7); inTime = dOnly >= ago; }
            else if (timeframe === "MONTH") inTime = d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
            else if (timeframe === "YEAR") inTime = d.getFullYear()===now.getFullYear();
            else if (timeframe === "CUSTOM") {
                if (!customStart || !customEnd) inTime = false;
                else { const s=new Date(customStart); s.setHours(0,0,0,0); const e=new Date(customEnd); e.setHours(23,59,59,999); inTime = d>=s && d<=e; }
            }
            const logCatId = String(log.item?.category?._id || log.item?.category || "");
            const matchesCat = categoryFilter==="ALL" || logCatId===String(categoryFilter);
            const matchesItem = itemFilter==="ALL" || String(log.item?._id || log.item)===String(itemFilter);
            return matchesSearch && matchesType && inTime && matchesCat && matchesItem;
        });
    }, [logs, searchTerm, typeFilter, timeframe, categoryFilter, itemFilter, customStart, customEnd]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
    React.useEffect(()=>{ setCurrentPage(1); }, [searchTerm, typeFilter, timeframe, categoryFilter, itemFilter, customStart, customEnd, logs.length]);
    const paginated = useMemo(()=> {
        const s=(currentPage-1)*PAGE_SIZE;
        return filteredLogs.slice(s, s+PAGE_SIZE);
    }, [filteredLogs, currentPage]);
    const pageRange = useMemo(()=> ({ start:(currentPage-1)*PAGE_SIZE+1, end: Math.min(currentPage*PAGE_SIZE, filteredLogs.length)}), [currentPage, filteredLogs.length]);

    const handleDownload = () => {
        setReportError(null);
        if(!filteredLogs.length){ setReportError("No logs for current filters"); return; }
        if(format==="PDF"){
            generateStandardPDF({
                title:`Inventory History — ${timeframe}`,
                filename:`Inventory_History_${Date.now()}`,
                headers:[["Date","Item","Category","Type","Qty","Reason","Donor","User"]],
                data: filteredLogs.map((l:any)=> [
                    formatNepaliDateShort(l.date),
                    l.item?.name||"—",
                    getCategoryName(l.item?.category),
                    l.type,
                    String(l.quantity),
                    l.reason||"",
                    l.donorOrVendorName||"—",
                    l.createdBy?.name||""
                ])
            });
        } else {
            generateExcelReport(filteredLogs.map((l:any)=> ({
                Date: formatNepaliDateShort(l.date),
                Item: l.item?.name||"—",
                Category: getCategoryName(l.item?.category),
                Type: l.type,
                Qty: l.quantity,
                Reason: l.reason||"",
                Donor: l.donorOrVendorName||"",
                User: l.createdBy?.name||""
            })), ["Date","Item","Category","Type","Qty","Reason","Donor","User"], "Inventory_History");
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary text-xs">📋</span>
                    <div>
                        <h2 className="font-ubuntu text-[12px] font-black text-text tracking-tight">Inventory History — Global Timeline</h2>
                        <p className="text-[10px] font-bold text-text-muted">All additions & subtractions, including donated (cost 0)</p>
                    </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted bg-shaded px-2.5 py-1 rounded-full border border-border">{filteredLogs.length} in report</span>
            </div>
            {reportError && <div className="p-2.5 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-2 text-danger text-[11px] font-bold"><XCircle size={14}/>{reportError}</div>}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-shaded/20 border-b border-border/40">
                    <div className="flex flex-col gap-1 col-span-2 lg:col-span-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Search</label>
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted"/>
                            <input type="text" placeholder="Item, reason, donor..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-7 pr-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8"/>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Time</label>
                        <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="ALL">All Time</option><option value="DAY">Daily</option><option value="WEEK">Weekly</option><option value="MONTH">Monthly</option><option value="YEAR">Yearly</option><option value="CUSTOM">Custom</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Movement</label>
                        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="ALL">All</option><option value="IN">IN (Addition)</option><option value="OUT">OUT (Subtraction)</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Category</label>
                        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="ALL">All Categories</option>
                            {categories.map((c:any)=> <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Item</label>
                        <select value={itemFilter} onChange={e=>setItemFilter(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="ALL">All Items</option>
                            {filteredItemsByCategory.map((it:any)=> <option key={it._id} value={it._id}>{it.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Format</label>
                        <select value={format} onChange={e=>setFormat(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8"><option value="PDF">PDF</option><option value="EXCEL">Excel</option></select>
                    </div>
                </div>
                {timeframe==="CUSTOM" && <div className="grid grid-cols-2 gap-3 px-4 pb-3 bg-shaded/20"><NepaliDateField label="From (BS)" value={customStart} onChange={setCustomStart} placeholder="Select BS From" className="h-8 text-xs"/><NepaliDateField label="To (BS)" value={customEnd} onChange={setCustomEnd} placeholder="Select BS To" className="h-8 text-xs"/></div>}
            </div>

            {filteredLogs.length===0 && <div className="bg-card p-10 rounded-2xl border border-border text-center flex flex-col items-center gap-1.5 shadow-sm"><span className="text-3xl grayscale opacity-50 mb-1">📦</span><p className="text-sm font-black text-text uppercase tracking-tighter">No History Found</p><p className="text-xs text-text-muted">Adjust filters or add stock via Manage.</p></div>}

            {filteredLogs.length>0 && (
                <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-shaded/40 border-b border-border flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">History List — {filteredLogs.length} records (Date | Item | Category | Type | Qty | Reason)</span>
                        <span className="text-[11px] font-bold text-text-muted">Page {currentPage}/{totalPages} · {pageRange.start}-{pageRange.end}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr_120px_70px_70px_1fr_110px] gap-0 bg-[#0f172a] text-white text-[9px] font-black uppercase tracking-[0.12em] px-2 py-2.5">
                        <span className="px-2 border-r border-white/10">Date</span><span className="px-2 border-r border-white/10">Item</span><span className="px-2 border-r border-white/10">Category</span><span className="px-2 border-r border-white/10 text-center">Type</span><span className="px-2 border-r border-white/10 text-right">Qty</span><span className="px-2 border-r border-white/10">Reason / Donor</span><span className="px-2 text-center">User</span>
                    </div>
                    <div className="divide-y divide-border/50">
                        {paginated.map((log:any, idx:number)=>{
                            const globalIdx=(currentPage-1)*PAGE_SIZE+idx;
                            const isIn=log.type==="IN";
                            return (
                                <div key={log._id} className={`grid grid-cols-[110px_1fr_120px_70px_70px_1fr_110px] gap-0 items-center px-2 py-2.5 text-xs hover:bg-primary/[0.06] transition-colors ${globalIdx%2===0?"bg-card":"bg-shaded/[0.14]"}`}>
                                    <span className="px-2 font-mono text-[11px] text-text-muted border-r border-border/30 truncate">{formatNepaliDateShort(log.date)}</span>
                                    <span className="px-2 font-bold text-xs truncate border-r border-border/30">{log.item?.name||"—"}</span>
                                    <span className="px-2 text-[11px] truncate border-r border-border/30">{getCategoryName(log.item?.category)}</span>
                                    <span className="px-2 flex justify-center border-r border-border/30"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${isIn?"bg-success/10 text-success border-success/20":"bg-warning/10 text-warning border-warning/20"}`}>{log.type}</span></span>
                                    <span className={`px-2 font-black font-mono text-xs text-right border-r border-border/30 ${isIn?"text-success":"text-warning"}`}>{isIn?`+${log.quantity}`:`-${log.quantity}`}</span>
                                    <span className="px-2 text-[11px] truncate border-r border-border/30" title={`${log.reason||""} ${log.donorOrVendorName?`· Donor: ${log.donorOrVendorName}`:""}${log.cost?` · Cost: ${log.cost}`:" · Donated"}`}>{log.reason||"—"}{log.donorOrVendorName?` · ${log.donorOrVendorName}`:""}</span>
                                    <span className="px-2 text-[11px] truncate text-center">{log.createdBy?.name||"—"}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-shaded/20 border-t border-border">
                        <span className="text-[11px] font-bold text-text-muted">Showing {pageRange.start}-{pageRange.end} of {filteredLogs.length}</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="px-3 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40">Prev</button>
                                {Array.from({length: totalPages},(_,i)=>i+1).slice(Math.max(0,currentPage-3),Math.min(totalPages,currentPage+2)).map(n=> <button key={n} onClick={()=>setCurrentPage(n)} className={`w-7 h-7 text-xs font-black rounded-lg border ${currentPage===n?"bg-primary text-white border-primary":"bg-card border-border"}`}>{n}</button>)}
                                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40">Next</button>
                            </div>
                            <button onClick={handleDownload} className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-primary text-white text-[11px] font-black uppercase tracking-widest"><Download size={12}/> Download ({filteredLogs.length})</button>
                        </div>
                    </div>
                </div>
            )}

            {filteredLogs.length>0 && (
                <div className="flex flex-col gap-3 md:hidden">
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="grid grid-cols-5 gap-1 px-3 py-2.5 bg-[#0f172a] text-white text-[8px] font-black uppercase tracking-widest">
                            <span>Date</span><span>Item</span><span>Type</span><span className="text-right">Qty</span><span>Reason</span>
                        </div>
                        <div className="divide-y divide-border/50">
                            {paginated.map((log:any)=> (
                                <div key={log._id} className="grid grid-cols-5 gap-1 px-3 py-2.5 text-[11px] items-center bg-card">
                                    <span className="font-mono text-text-muted truncate">{formatNepaliDateShort(log.date).split("·")[0].trim()}</span>
                                    <span className="font-bold truncate">{log.item?.name||"—"}</span>
                                    <span className="flex justify-center"><span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black border ${log.type==="IN"?"bg-success/10 text-success border-success/20":"bg-warning/10 text-warning border-warning/20"}`}>{log.type}</span></span>
                                    <span className={`text-right font-black font-mono ${log.type==="IN"?"text-success":"text-warning"}`}>{log.type==="IN"?`+${log.quantity}`:`-${log.quantity}`}</span>
                                    <span className="truncate text-[10px]">{log.reason||"—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-text-muted font-bold">Showing {pageRange.start}-{pageRange.end} of {filteredLogs.length}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="px-2.5 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40">Prev</button>
                            <span className="text-[11px] font-black px-2">{currentPage}/{totalPages}</span>
                            <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="px-2.5 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40">Next</button>
                        </div>
                    </div>
                    <button onClick={handleDownload} className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest"><Download size={12}/> Download ({filteredLogs.length})</button>
                </div>
            )}
        </div>
    );
}
