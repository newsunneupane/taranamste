"use client";
import React from "react";

export default function ReportCommandBar({ filter, setFilter, accounts, setIsModalOpen }: any) {
    const handleTimeframeChange = (val: string) => {
        setFilter({ ...filter, timeframe: val });
        if (val === "CUSTOM") setIsModalOpen(true);
    };

    const Label = ({ children }: { children: React.ReactNode }) => (
        <label className="text-[9px] uppercase font-black text-primary tracking-[0.2em] mb-1">
            {children}
        </label>
    );

    const Select = ({ value, onChange, children }: any) => (
        <select
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 text-[11px] font-bold border border-border rounded-lg bg-card text-text focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none hover:border-primary/40 h-8"
        >
            {children}
        </select>
    );

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-shaded/20 p-4 border-t border-border/40 transition-colors">
            {/* TIMEFRAME */}
            <div className="flex flex-col gap-1">
                <Label>Temporal Scope</Label>
                <Select value={filter.timeframe} onChange={(e:any) => handleTimeframeChange(e.target.value)}>
                    <option value="DAY">Daily Daybook</option>
                    <option value="WEEK">Weekly Summary</option>
                    <option value="MONTH">Monthly Audit</option>
                    <option value="YEAR">Annual Statement</option>
                    <option value="CUSTOM">Custom Range</option>
                </Select>
            </div>

            {/* TYPE */}
            <div className="flex flex-col gap-1">
                <Label>Cashflow Type</Label>
                <Select value={filter.type} onChange={(e:any) => setFilter({ ...filter, type: e.target.value })}>
                    <option value="ALL">Consolidated</option>
                    <option value="INCOME">Income Only</option>
                    <option value="EXPENSE">Expenses Only</option>
                </Select>
            </div>

            {/* ACCOUNT HEAD / PAYMENT SOURCE */}
            <div className="flex flex-col gap-1">
                <Label>Financial Node</Label>
                <Select value={filter.accountId} onChange={(e:any) => setFilter({ ...filter, accountId: e.target.value })}>
                    <option value="ALL">All Nodes</option>
                    <optgroup label="Payment Categories" className="bg-bg text-primary">
                        {accounts.paymentCategories?.filter((c:any) => c.isActive).map((acc: any) => (
                            <option key={acc._id} value={acc._id}>💳 {acc.name}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Account Heads" className="bg-bg text-secondary">
                        {accounts.accountHeads?.filter((h:any) => h.isActive).map((acc: any) => (
                            <option key={acc._id} value={acc._id}>📑 {acc.name}</option>
                        ))}
                    </optgroup>
                </Select>
            </div>

            {/* FORMAT */}
            <div className="flex flex-col gap-1">
                <Label>Data Format</Label>
                <Select value={filter.format} onChange={(e:any) => setFilter({ ...filter, format: e.target.value })}>
                    <option value="PDF">Standard PDF</option>
                    <option value="EXCEL">Spreadsheet (XLSX)</option>
                </Select>
            </div>
        </div>
    );
}