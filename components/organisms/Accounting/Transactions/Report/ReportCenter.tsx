"use client";
import React, { useState, useMemo } from "react";
import { generateStandardPDF } from "@/lib/generatePDF";
import { generateExcelReport } from "@/lib/generateExcel";
import ReportCenterModal from "./ReportCenterModal";
import ReportCommandBar from "./ReportCommandBar";
import { Button } from "@/components/atoms/Button";
import { XCircle, FileSpreadsheet, FileText, Eye } from "lucide-react";
import { formatNepaliDateShort } from "@/lib/nepaliDate";
import { useUIModals } from "@/hooks/useUIModal";

export default function ReportCenter({ transactions, accounts }: any) {
    const { openTransactionDetail } = useUIModals();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filter, setFilter] = useState({
        timeframe: "MONTH",
        type: "ALL",
        accountId: "ALL",
        startDate: "",
        endDate: "",
        format: "PDF"
    });

    const categoryLabel = (t: any) => {
        const head = t.accountHead?.name || "Uncategorized";
        return t.subType ? `${head} / ${t.subType}` : head;
    };

    // 1. FILTER FIRST — live computed filtered data (report data)
    const filtered = useMemo(() => {
        const now = new Date();
        return transactions.filter((t: any) => {
            const d = new Date(t.date);
            const dDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let inTime = true;
            if (filter.timeframe === "DAY") {
                inTime = dDateOnly.getTime() === nowDateOnly.getTime();
            } else if (filter.timeframe === "WEEK") {
                const sevenDaysAgo = new Date(nowDateOnly);
                sevenDaysAgo.setDate(nowDateOnly.getDate() - 7);
                inTime = dDateOnly >= sevenDaysAgo;
            } else if (filter.timeframe === "MONTH") {
                inTime = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            } else if (filter.timeframe === "YEAR") {
                inTime = d.getFullYear() === now.getFullYear();
            } else if (filter.timeframe === "CUSTOM") {
                if (!filter.startDate || !filter.endDate) return false;
                const start = new Date(filter.startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(filter.endDate);
                end.setHours(23, 59, 59, 999);
                inTime = d >= start && d <= end;
            }

            const matchesType = filter.type === "ALL" || t.type === filter.type;
            const matchesAccount = filter.accountId === "ALL" || 
                                 t.paymentCategory?._id === filter.accountId || 
                                 t.accountHead?._id === filter.accountId;

            return inTime && matchesType && matchesAccount;
        });
    }, [transactions, filter]);

    const handleGenerate = () => {
        setError(null);

        if (!filtered.length) {
            setError("No transactions found for the selected criteria.");
            return;
        }

        if (filter.format === "PDF") {
            generateStandardPDF({
                title: `${filter.timeframe} Money Report`,
                filename: `Report_${Date.now()}`,
                headers: [["Date", "Money Account", "Category", "Description", "Amount"]],
                data: filtered.map((t: any) => [
                    formatNepaliDateShort(t.date),
                    t.paymentCategory?.name || "N/A",
                    categoryLabel(t),
                    t.description,
                    { 
                        content: t.type === "INCOME" ? `+${t.amount}` : `-${t.amount}`,
                        styles: { textColor: t.type === "INCOME" ? [34, 197, 94] : [239, 68, 68] } 
                    }
                ]),
            });
        } else {
            generateExcelReport(
                filtered.map((t: any) => ({
                    Date: formatNepaliDateShort(t.date),
                    Source: t.paymentCategory?.name,
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

    const [reportPage, setReportPage] = useState(1);
    const REPORT_PAGE_SIZE = 10;
    const totalReportPages = Math.max(1, Math.ceil(filtered.length / REPORT_PAGE_SIZE));
    React.useEffect(() => { setReportPage(1); }, [filter, transactions.length]);
    const paginatedReport = useMemo(() => {
        const start = (reportPage - 1) * REPORT_PAGE_SIZE;
        return filtered.slice(start, start + REPORT_PAGE_SIZE);
    }, [filtered, reportPage]);

    return (
        <div className="bg-gradient-to-br from-card via-card to-primary/[0.03] border border-primary/10 rounded-2xl shadow-sm mb-6 overflow-hidden transition-all duration-500">
            {/* 1. FILTERS FIRST — always visible header (no hide/show) */}
            <div className="p-4 md:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0">📊</div>
                    <div>
                        <h2 className="font-ubuntu text-[12px] font-black text-text tracking-tight">
                            Report Center
                        </h2>
                        <p className="text-[10px] font-bold text-text-muted tracking-wide">
                            1. Apply filters → 2. Preview report → 3. Generate
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted bg-shaded px-2.5 py-1 rounded-full border border-border">{filtered.length} in report</span>
            </div>

            {/* 1a. FILTER CONTROLS — always visible */}
            <div className="border-t border-border/40">
                <ReportCommandBar
                    filter={filter}
                    setFilter={setFilter}
                    accounts={accounts}
                    setIsModalOpen={setIsModalOpen}
                />
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="mx-4 mt-3 p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-[10px] font-black uppercase tracking-widest">
                    <XCircle size={14} /> {error}
                </div>
            )}

            {/* 2. REPORT PREVIEW — data which lies inside filters */}
            <div className="border-t border-border/40">
                <div className="px-4 py-3 bg-shaded/30 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Report Preview — Filtered Data</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black">{filtered.length} rows</span>
                        {filter.timeframe === "CUSTOM" && filter.startDate && (
                            <span className="text-[10px] font-mono text-text-muted hidden sm:inline">{filter.startDate} → {filter.endDate}</span>
                        )}
                    </div>
                    <div className="text-[10px] font-bold text-text-muted">Page {reportPage}/{totalReportPages}</div>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                        <FileSpreadsheet className="text-text-muted" size={20} />
                        <p className="text-xs font-black uppercase tracking-widest text-text-muted">No data for selected filters</p>
                        <p className="text-[11px] text-text-muted">Adjust filters above — report will update live</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#0f172a] text-white text-[9px] font-black uppercase tracking-[0.12em]">
                                        <th className="py-2 px-3 border-r border-white/10 w-[32px] text-center">#</th>
                                        <th className="py-2 px-3 border-r border-white/10">Date (BS·AD)</th>
                                        <th className="py-2 px-3 border-r border-white/10">Head / Sub</th>
                                        <th className="py-2 px-3 border-r border-white/10">Description</th>
                                        <th className="py-2 px-3 border-r border-white/10 text-center">Type</th>
                                        <th className="py-2 px-3 text-right">Amount</th>
                                        <th className="py-2 px-3 text-center w-[36px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedReport.map((t: any, idx: number) => {
                                        const globalIdx = (reportPage - 1) * REPORT_PAGE_SIZE + idx;
                                        const isIncome = t.type === "INCOME";
                                        return (
                                            <tr key={t._id} onClick={() => openTransactionDetail(t)} className={`group cursor-pointer text-xs border-b border-border/50 ${globalIdx % 2 === 0 ? "bg-card" : "bg-shaded/20"} hover:bg-primary/[0.06]`}>
                                                <td className="py-2 px-3 text-center font-mono text-[11px] text-text-muted border-r border-border/30">{globalIdx + 1}</td>
                                                <td className="py-2 px-3 font-mono text-[11px] text-text-muted border-r border-border/30 whitespace-nowrap">{formatNepaliDateShort(t.date)}</td>
                                                <td className="py-2 px-3 border-r border-border/30">
                                                    <span className="font-bold text-xs text-text">{categoryLabel(t)}</span>
                                                    {t.donorOrVendorName && <div className="text-[10px] text-text-muted truncate max-w-[140px]">{t.donorOrVendorName}</div>}
                                                </td>
                                                <td className="py-2 px-3 border-r border-border/30 max-w-[220px] truncate text-[11px] text-text">{t.description}</td>
                                                <td className="py-2 px-3 border-r border-border/30 text-center"><span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black border ${isIncome ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>{t.type}</span></td>
                                                <td className={`py-2 px-3 text-right font-black font-mono text-xs ${isIncome ? "text-success" : "text-danger"}`}>{isIncome ? "+" : "-"}{Number(t.amount).toLocaleString("en-IN")}</td>
                                                <td className="py-2 px-2 text-center"><button onClick={(e) => { e.stopPropagation(); openTransactionDetail(t); }} className="w-6 h-6 rounded-lg text-primary hover:bg-primary/10 flex items-center justify-center"><Eye size={11} /></button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination + totals for report preview */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-shaded/20 border-t border-border">
                            <span className="text-[11px] font-bold text-text-muted">Showing {(reportPage-1)*REPORT_PAGE_SIZE+1}-{Math.min(reportPage*REPORT_PAGE_SIZE, filtered.length)} of {filtered.length} · Total: <span className="text-success">+{filtered.filter((t:any)=>t.type==="INCOME").reduce((s:any,t:any)=>s+t.amount,0).toLocaleString("en-IN")}</span> <span className="text-danger">-{filtered.filter((t:any)=>t.type==="EXPENSE").reduce((s:any,t:any)=>s+t.amount,0).toLocaleString("en-IN")}</span></span>
                            <div className="flex items-center gap-1">
                                <Button onClick={() => setReportPage(p=>Math.max(1,p-1))} disabled={reportPage===1} variant="secondary" size="sm" className="h-7 px-3 text-[11px]">Prev</Button>
                                <span className="text-xs font-black px-2">{reportPage}/{totalReportPages}</span>
                                <Button onClick={() => setReportPage(p=>Math.min(totalReportPages,p+1))} disabled={reportPage===totalReportPages} variant="secondary" size="sm" className="h-7 px-3 text-[11px]">Next</Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 3. GENERATE FROM FILTERED DATA */}
                <div className="p-4 bg-card border-t border-border flex flex-col sm:flex-row gap-2 justify-end">
                    <Button onClick={handleGenerate} disabled={!filtered.length} size="sm" className="font-black tracking-widest text-[11px] h-9 px-6 bg-primary disabled:opacity-40 flex items-center gap-2">
                        <FileText size={14} /> Generate PDF ({filtered.length})
                    </Button>
                    <Button onClick={() => { setFilter(s=>({...s, format: s.format==="PDF" ? "EXCEL" : "PDF"})); setTimeout(handleGenerate, 0); }} disabled={!filtered.length} variant="secondary" size="sm" className="font-black tracking-widest text-[11px] h-9 px-6 flex items-center gap-2 disabled:opacity-40">
                        <FileSpreadsheet size={14} /> Generate Excel ({filtered.length})
                    </Button>
                </div>
                <p className="px-4 pb-3 text-[10px] text-text-muted text-center">Report is generated from <span className="font-black text-primary">{filtered.length} filtered rows</span> above — exactly the data inside current filters. Click any row to view details.</p>
            </div>

            {isModalOpen && (
                <ReportCenterModal filter={filter} setFilter={setFilter} setIsModalOpen={setIsModalOpen} />
            )}
        </div>
    );
}