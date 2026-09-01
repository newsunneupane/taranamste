"use client";
import React, { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { AccountSection } from "./AccountSection";
import { generateAccountsPDF } from "@/lib/generatePDF";
import { useUIModals } from "@/hooks/useUIModal";
import { DownloadCloud, ArrowRightLeft } from "lucide-react"; // ✨ Imported Arrow icon

export default function ChartOfAccounts({ initialAccounts }: { initialAccounts: any[] }) {
  // ✨ Added openInternalTransfer to your destructured hook
  const { openAccountHeadForm, openInternalTransfer } = useUIModals();
  const [openSection, setOpenSection] = useState<string>("INCOME");

  const filterByType = (type: string) => initialAccounts.filter((a) => a.type === type);
  const handleToggle = (section: string) => setOpenSection(prev => prev === section ? "" : section);

  return (
    <div className="flex flex-col gap-5 transition-colors duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-4 md:p-5 rounded-2xl shadow-sm border border-border transition-colors duration-500 mb-6">

        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg border border-primary/20 shrink-0">
            🏛️
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="font-ubuntu text-[15px] md:text-lg font-black text-text tracking-tight truncate">
              Spending Categories
            </h1>
            <p className="font-ubuntu text-[11px] font-semibold text-primary/70 tracking-wide truncate">
              Your list of income and expense categories
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
          <Button
            onClick={() => openInternalTransfer()}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-text-invert font-black py-2 px-4 rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <ArrowRightLeft size={14} />
            <span>Move Money</span>
          </Button>

          <Button
            onClick={() => generateAccountsPDF(initialAccounts)}
            className="w-full sm:w-auto border border-border text-text hover:text-text hover:bg-shaded font-bold py-2 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <DownloadCloud size={14} />
            <span>Download Report</span>
          </Button>
        </div>
      </div>

      {/* ACCORDION STACK */}
      <div className="flex flex-col gap-4">
        {[
          { title: "Incomes", type: "INCOME", theme: "success" as const, addIncome: true },
          { title: "Expenses", type: "EXPENSE", theme: "danger" as const, addIncome: false },
          { title: "Assets", type: "ASSET", theme: "primary" as const, addIncome: true },
          { title: "Liabilities", type: "LIABILITY", theme: "warning" as const, addIncome: false }
        ].map((sec) => (
          <AccountSection
            key={sec.type}
            title={sec.title}
            heads={filterByType(sec.type)}
            theme={sec.theme}
            isOpen={openSection === sec.type}
            onToggle={() => handleToggle(sec.type)}
            onAdd={() => openAccountHeadForm({ defaultType: sec.type })}
          />
        ))}
      </div>
    </div>
  );
}