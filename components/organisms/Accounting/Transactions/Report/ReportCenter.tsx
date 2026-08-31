"use client";
import React, { useState } from "react";
import { generateStandardPDF } from "@/lib/generatePDF";
import { generateExcelReport } from "@/lib/generateExcel";
import ReportCenterModal from "./ReportCenterModal";
import ReportCommandBar from "./ReportCommandBar";
import { Button } from "@/components/atoms/Button";
import { ChevronDown, XCircle } from "lucide-react";
import { formatNepaliDateShort } from "@/lib/nepaliDate";

export default function ReportCenter({ transactions, accounts }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filter, setFilter] = useState({
        timeframe: "MONTH",
        type: "ALL",
        accountId: "ALL",
        startDate: "",
        endDate: "",
        format: "PDF"
    });

    const handleGenerate = () => {
        setError(null);
        const now = new Date();

        const filtered = transactions.filter((t: any) => {
            const d = new Date(t.date);
            // Fix: Normalizing to start-of-day for accurate comparisons
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
                    t.accountHead?.name || "Uncategorized",
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
                    AccountHead: t.accountHead?.name,
                    Description: t.description,
                    Amount: t.amount,
                    Type: t.type
                })),
                ["Date", "Source", "Category", "Description", "Amount", "Type"],
                "Finance_Report_Export"
            );
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl shadow-glow mb-8 overflow-hidden transition-all duration-500">
            {/* HEADER */}
            <div className="p-5 md:p-8 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex justify-between items-start w-full md:w-auto">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-text tracking-tighter uppercase font-mono">
                            Reports
                        </h2>
                        <p className="text-[10px] text-text-muted font-black tracking-widest uppercase mt-1">
                            {filter.timeframe === "CUSTOM" && filter.startDate
                                ? `Selected: ${filter.startDate} → ${filter.endDate}`
                                : "Make a report of your transactions"}
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="md:hidden p-2 bg-bg border border-border rounded-xl text-primary shadow-sm"
                    >
                        <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                    </button>
                </div>

                <Button onClick={handleGenerate} className="w-full md:w-auto px-12 h-12 font-black font-mono tracking-widest">
                    MAKE REPORT
                </Button>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-[10px] font-black uppercase tracking-widest">
                    <XCircle size={14} /> {error}
                </div>
            )}

            {/* ACCORDION WRAPPER */}
            <div className={`grid transition-all duration-500 ease-in-out md:grid-rows-[1fr] md:opacity-100 ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
                <div className="overflow-hidden">
                    <ReportCommandBar
                        filter={filter}
                        setFilter={setFilter}
                        accounts={accounts}
                        setIsModalOpen={setIsModalOpen}
                    />
                </div>
            </div>

            {isModalOpen && (
                <ReportCenterModal filter={filter} setFilter={setFilter} setIsModalOpen={setIsModalOpen} />
            )}
        </div>
    );
}