"use client";
import React, { useState, useMemo } from "react";
import { Search, Filter, Trash2, Edit2, Eye, Download, XCircle } from "lucide-react";
import { deleteTransaction } from "@/app/actions/transactions";
import { formatNepaliDateShort } from "@/lib/nepaliDate";
import { useUIModals } from "@/hooks/useUIModal";
import { generateStandardPDF } from "@/lib/generatePDF";
import { generateExcelReport } from "@/lib/generateExcel";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";

export default function TransactionTable({
    transactions,
    accounts = [],
    onEdit
}: {
    transactions: any[];
    accounts?: any[];
    onEdit: (t: any) => void;
}) {
    const { openTransactionDetail } = useUIModals();
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [timeframe, setTimeframe] = useState("ALL");
    const [accountFilter, setAccountFilter] = useState("ALL");
    const [subHeadFilter, setSubHeadFilter] = useState("ALL");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [format, setFormat] = useState("PDF");
    const [reportError, setReportError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 30;

    // Heads filtered by Cashflow Type — so when Income selected, only Income heads appear (and same for Expense), like Head→SubHead cascade
    const filteredAccountsByType = useMemo(() => {
        if (!Array.isArray(accounts) || accounts.length === 0) return [];
        if (typeFilter === "ALL") return accounts;
        return accounts.filter((a: any) => a.type === typeFilter);
    }, [accounts, typeFilter]);

    // If Cashflow Type changes and current Head no longer belongs to that type, reset Head (and SubHead follows)
    React.useEffect(() => {
        if (accountFilter === "ALL") return;
        const head = accounts.find((a: any) => a._id === accountFilter);
        if (head && typeFilter !== "ALL" && head.type !== typeFilter) {
            setAccountFilter("ALL");
        }
    }, [typeFilter, accountFilter, accounts]);

    // All subHeads (for dropdown) — derived from filtered heads, and when Head selected, only that Head's subs (like before but now type-aware)
    const subHeadOptions = useMemo(() => {
        if (!Array.isArray(accounts) || accounts.length === 0) return [];
        if (accountFilter !== "ALL") {
            const head = accounts.find((a: any) => a._id === accountFilter);
            return Array.isArray(head?.subType) ? head.subType : [];
        }
        // when showing All Heads, only show subs that belong to the currently visible heads (type-filtered)
        const all = new Set<string>();
        filteredAccountsByType.forEach((a: any) => (a.subType || []).forEach((s: string) => all.add(s)));
        return Array.from(all);
    }, [accounts, filteredAccountsByType, accountFilter]);

    // when Head changes, reset SubHead to ALL (sub must belong to that head)
    React.useEffect(() => { setSubHeadFilter("ALL"); }, [accountFilter]);

    const categoryLabel = (t: any) => {
        const head = t.accountHead?.name || "Uncategorized";
        return t.subType ? `${head} / ${t.subType}` : head;
    };

    const filteredTxns = useMemo(() => {
        const now = new Date();
        return transactions.filter((txn) => {
            const searchString = `${txn.accountHead?.name || ""} ${txn.description || ""} ${txn.subType || ""} ${txn.donorOrVendorName || ""}`.toLowerCase();
            const matchesSearch = searchString.includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === "ALL" || txn.type === typeFilter;

            // timeframe filter (report logic)
            const d = new Date(txn.date);
            const dDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let inTime = true;
            if (timeframe === "DAY") inTime = dDateOnly.getTime() === nowDateOnly.getTime();
            else if (timeframe === "WEEK") {
                const sevenDaysAgo = new Date(nowDateOnly);
                sevenDaysAgo.setDate(nowDateOnly.getDate() - 7);
                inTime = dDateOnly >= sevenDaysAgo;
            } else if (timeframe === "MONTH") inTime = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            else if (timeframe === "YEAR") inTime = d.getFullYear() === now.getFullYear();
            else if (timeframe === "CUSTOM") {
                if (!customStart || !customEnd) inTime = false;
                else {
                    const start = new Date(customStart); start.setHours(0,0,0,0);
                    const end = new Date(customEnd); end.setHours(23,59,59,999);
                    inTime = d >= start && d <= end;
                }
            } else if (timeframe === "ALL") inTime = true;

            const matchesAccount = accountFilter === "ALL" || txn.accountHead?._id === accountFilter || txn.accountHead?.name === accountFilter || txn.paymentCategory?._id === accountFilter;
            const matchesSubHead = subHeadFilter === "ALL" || (txn.subType || "").toLowerCase() === subHeadFilter.toLowerCase();

            return matchesSearch && matchesType && inTime && matchesAccount && matchesSubHead;
        });
    }, [transactions, searchTerm, typeFilter, timeframe, accountFilter, subHeadFilter, customStart, customEnd]);

    const handleDownloadReport = () => {
        setReportError(null);
        if (!filteredTxns.length) {
            setReportError("No transactions for current filters — adjust filters.");
            return;
        }
        if (format === "PDF") {
            generateStandardPDF({
                title: `Transactions Report — ${timeframe}`,
                filename: `Report_${Date.now()}`,
                headers: [["Date", "Money Account", "Category", "Description", "Amount"]],
                data: filteredTxns.map((t: any) => [
                    formatNepaliDateShort(t.date),
                    t.paymentCategory?.name || "N/A",
                    categoryLabel(t),
                    t.description,
                    { content: t.type === "INCOME" ? `+${t.amount}` : `-${t.amount}`, styles: { textColor: t.type === "INCOME" ? [34, 197, 94] : [239, 68, 68] } }
                ]),
            });
        } else {
            generateExcelReport(
                filteredTxns.map((t: any) => ({
                    Date: formatNepaliDateShort(t.date),
                    Source: t.paymentCategory?.name || "N/A",
                    AccountHead: categoryLabel(t),
                    Description: t.description,
                    Amount: t.amount,
                    Type: t.type
                })),
                ["Date", "Source", "Category", "Description", "Amount", "Type"],
                "Finance_Report_Export"
            );
        }
    };

    const totalPages = Math.max(1, Math.ceil(filteredTxns.length / PAGE_SIZE));
    // reset to page 1 when filters change
    React.useEffect(() => { setCurrentPage(1); }, [searchTerm, typeFilter, timeframe, accountFilter, subHeadFilter, customStart, customEnd, transactions.length]);

    const paginatedTxns = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredTxns.slice(start, start + PAGE_SIZE);
    }, [filteredTxns, currentPage]);

    const pageRange = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(currentPage * PAGE_SIZE, filteredTxns.length);
        return { start, end };
    }, [currentPage, filteredTxns.length]);

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            await deleteTransaction(id);
        }
    };

    const handleEdit = (txn: any, e?: React.MouseEvent) => {
        e?.stopPropagation();
        onEdit(txn);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* HEADER — All Transactions is now the report (same as report before) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary text-xs">📊</span>
                    <div>
                        <h2 className="font-ubuntu text-[12px] font-black text-text tracking-tight">All Transactions — Report</h2>
                        <p className="text-[10px] font-bold text-text-muted">1. Apply filters → 2. Preview report → 3. Download</p>
                    </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted bg-shaded px-2.5 py-1 rounded-full border border-border">{filteredTxns.length} in report</span>
            </div>
            {reportError && (
                <div className="p-2.5 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-2 text-danger text-[11px] font-bold">
                    <XCircle size={14} /> {reportError}
                </div>
            )}

            {/* FILTERS FIRST — exactly like report before — Head + SubHead dropdowns + Search */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-shaded/20 border-b border-border/40">
                    <div className="flex flex-col gap-1 col-span-2 lg:col-span-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Search</label>
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input type="text" placeholder="Head, description, vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-7 pr-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Temporal Scope</label>
                        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="ALL">All Time</option>
                            <option value="DAY">Daily</option>
                            <option value="WEEK">Weekly</option>
                            <option value="MONTH">Monthly</option>
                            <option value="YEAR">Yearly</option>
                            <option value="CUSTOM">Custom</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Cashflow Type</label>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="ALL">All</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Head</label>
                        <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="ALL">All Heads</option>
                            {Array.isArray(filteredAccountsByType) ? filteredAccountsByType.map((a: any) => (
                                <option key={a._id} value={a._id}>{a.name}</option>
                            )) : null}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">SubHead</label>
                        <select value={subHeadFilter} onChange={(e) => setSubHeadFilter(e.target.value)} disabled={subHeadOptions.length === 0} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8 disabled:opacity-40">
                            <option value="ALL">All SubHeads</option>
                            {subHeadOptions.map((s: string) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary">Format</label>
                        <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-2 py-2 text-[11px] font-bold border border-border rounded-lg bg-background h-8">
                            <option value="PDF">PDF</option>
                            <option value="EXCEL">Excel</option>
                        </select>
                    </div>
                </div>
                {timeframe === "CUSTOM" && (
                    <div className="grid grid-cols-2 gap-3 px-4 pb-3 bg-shaded/20">
                        <NepaliDateField
                            label="From (BS)"
                            value={customStart}
                            onChange={setCustomStart}
                            placeholder="Select BS From"
                            className="h-8 text-xs"
                        />
                        <NepaliDateField
                            label="To (BS)"
                            value={customEnd}
                            onChange={setCustomEnd}
                            placeholder="Select BS To"
                            className="h-8 text-xs"
                        />
                    </div>
                )}
            </div>

            {filteredTxns.length === 0 && (
                <div className="bg-card p-10 rounded-2xl border border-border text-center flex flex-col items-center gap-1.5 shadow-sm">
                    <span className="text-3xl grayscale opacity-50 mb-1">💸</span>
                    <p className="text-sm font-black text-text uppercase tracking-tighter">No Transactions Found</p>
                    <p className="text-xs text-text-muted">Adjust filters or record a new entry.</p>
                </div>
            )}

            {/* LIST VIEW — report style: Date | Head | SubHead | Amount | Expense/Income on top, datas below */}
            {filteredTxns.length > 0 && (
                <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    {/* List header — count */}
                    <div className="px-4 py-3 bg-shaded/40 border-b border-border flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Report List — {filteredTxns.length} records (Date | Head | SubHead | Amount | Type)</span>
                        <span className="text-[11px] font-bold text-text-muted">Page {currentPage}/{totalPages} · {pageRange.start}-{pageRange.end}</span>
                    </div>
                    {/* Column headers atop — exactly Date / Head / SubHead / Amount / Expense or Income */}
                    <div className="grid grid-cols-[110px_1fr_1fr_120px_130px_90px] gap-0 bg-[#0f172a] text-white text-[9px] font-black uppercase tracking-[0.12em] px-2 py-2.5">
                        <span className="px-2 border-r border-white/10">Date</span>
                        <span className="px-2 border-r border-white/10">Head</span>
                        <span className="px-2 border-r border-white/10">SubHead</span>
                        <span className="px-2 border-r border-white/10 text-right">Amount</span>
                        <span className="px-2 border-r border-white/10 text-center">Expense / Income</span>
                        <span className="px-2 text-center">Actions</span>
                    </div>
                    {/* Datas below — list rows */}
                    <div className="divide-y divide-border/50">
                        {paginatedTxns.map((txn: any, idx: number) => {
                            const isIncome = txn.type === "INCOME";
                            const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                            return (
                                <div
                                    key={txn._id}
                                    onClick={() => openTransactionDetail(txn)}
                                    className={`group cursor-pointer grid grid-cols-[110px_1fr_1fr_120px_130px_90px] gap-0 items-center px-2 py-2.5 text-xs hover:bg-primary/[0.06] transition-colors ${globalIdx % 2 === 0 ? "bg-card" : "bg-shaded/[0.14]"}`}
                                >
                                    <span className="px-2 font-mono text-[11px] text-text-muted border-r border-border/30 truncate">{formatNepaliDateShort(txn.date)}</span>
                                    <span className="px-2 font-bold text-xs text-text truncate border-r border-border/30 flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${isIncome ? "bg-success" : "bg-danger"}`} />{txn.accountHead?.name || "—"}</span>
                                    <span className="px-2 text-[11px] text-text truncate border-r border-border/30">{txn.subType || "—"}</span>
                                    <span className={`px-2 font-black font-mono text-xs text-right border-r border-border/30 ${isIncome ? "text-success" : "text-danger"}`}>{Number(txn.amount).toLocaleString("en-IN")}</span>
                                    <span className="px-2 flex justify-center border-r border-border/30">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${isIncome ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>{txn.type}</span>
                                    </span>
                                    <span className="px-2 flex justify-center gap-1" onClick={e=>e.stopPropagation()}>
                                        <button onClick={() => openTransactionDetail(txn)} className="w-7 h-7 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10" title="View"><Eye size={11} /></button>
                                        <button onClick={(e) => handleEdit(txn, e)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-success hover:bg-success/10" title="Edit"><Edit2 size={11} /></button>
                                        <button onClick={(e) => handleDelete(txn._id, e)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10" title="Delete"><Trash2 size={11} /></button>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Pagination + Download */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-shaded/20 border-t border-border">
                        <span className="text-[11px] font-bold text-text-muted">Showing {pageRange.start}-{pageRange.end} of {filteredTxns.length} · Total: <span className="text-success">+{filteredTxns.filter((t:any)=>t.type==="INCOME").reduce((s:any,t:any)=>s+t.amount,0).toLocaleString("en-IN")}</span> <span className="text-danger">-{filteredTxns.filter((t:any)=>t.type==="EXPENSE").reduce((s:any,t:any)=>s+t.amount,0).toLocaleString("en-IN")}</span></span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-shaded">Prev</button>
                                {Array.from({length: totalPages}, (_,i)=>i+1).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2)).map(n=>(
                                    <button key={n} onClick={()=>setCurrentPage(n)} className={`w-7 h-7 text-xs font-black rounded-lg border ${currentPage===n?"bg-primary text-white border-primary":"bg-card border-border hover:bg-shaded"}`}>{n}</button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-shaded">Next</button>
                            </div>
                            <button onClick={handleDownloadReport} disabled={!filteredTxns.length} className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-primary text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40">
                                <Download size={12} /> Download Report ({filteredTxns.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MOBILE — list view, one header atop per page, datas below */}
            {filteredTxns.length > 0 && (
                <div className="flex flex-col gap-3 md:hidden">
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {/* Single header atop — one per page */}
                        <div className="grid grid-cols-5 gap-1 px-3 py-2.5 bg-[#0f172a] text-white text-[8px] font-black uppercase tracking-widest">
                            <span>Date</span><span>Head</span><span>SubHead</span><span className="text-right">Amount</span><span className="text-center">Type</span>
                        </div>
                        {/* Datas below — list rows */}
                        <div className="divide-y divide-border/50">
                        {paginatedTxns.map((txn: any) => {
                        const isIncome = txn.type === "INCOME";
                        return (
                            <div
                                key={txn._id}
                                onClick={() => openTransactionDetail(txn)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTransactionDetail(txn); } }}
                                className="grid grid-cols-5 gap-1 px-3 py-2.5 text-[11px] items-center bg-card hover:bg-shaded/40 active:bg-shaded/60 transition-colors cursor-pointer"
                            >
                                    <span className="font-mono text-text-muted truncate">{formatNepaliDateShort(txn.date).split("·")[0].trim()}</span>
                                    <span className="font-bold text-text truncate">{txn.accountHead?.name || "—"}</span>
                                    <span className="truncate text-text-muted">{txn.subType || "—"}</span>
                                    <span className={`text-right font-black font-mono ${isIncome ? "text-success" : "text-danger"}`}>{Number(txn.amount).toLocaleString()}</span>
                                    <span className="flex justify-center"><span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black border ${isIncome ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>{txn.type}</span></span>
                            </div>
                        );
                    })}
                        </div>
                        {/* Actions per page — still accessible via tap row for details; bulk edit via detail modal */}
                        <div className="px-3 py-2 bg-shaded/20 border-t border-border flex justify-between items-center">
                            <span className="text-[10px] font-bold text-text-muted">Tap row for details</span>
                            <span className="text-[10px] font-mono text-text-muted">{pageRange.start}-{pageRange.end} of {filteredTxns.length}</span>
                        </div>
                    </div>
                    {/* Mobile pagination + download */}
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-text-muted font-bold">Showing {pageRange.start}-{pageRange.end} of {filteredTxns.length}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-2.5 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40">Prev</button>
                            <span className="text-[11px] font-black px-2">{currentPage}/{totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-2.5 py-1.5 text-[11px] font-black rounded-lg border border-border bg-card disabled:opacity-40">Next</button>
                        </div>
                    </div>
                    <button onClick={handleDownloadReport} disabled={!filteredTxns.length} className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40">
                        <Download size={12} /> Download Report ({filteredTxns.length})
                    </button>
                </div>
            )}
        </div>
    );
}
