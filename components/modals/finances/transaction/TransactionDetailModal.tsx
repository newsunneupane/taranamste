"use client";
import React from "react";
import { Button } from "@/components/atoms/Button";
import { formatNepaliDate, formatNepaliDateShort } from "@/lib/nepaliDate";
import { useUIModals } from "@/hooks/useUIModal";

export function TransactionDetailModal({ closeModal, transaction }: any) {
  const { openTransactionForm } = useUIModals();
  if (!transaction) return null;
  const isIncome = transaction.type === "INCOME";
  const t = transaction;

  const Row = ({ label, value, mono }: any) => (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs font-bold text-right break-words ${mono ? "font-mono" : ""} text-text`}>{value || "—"}</span>
    </div>
  );

  return (
    <div className="w-full max-w-[560px] flex flex-col gap-4">
      {/* Header like report row */}
      <div className={`rounded-xl border p-4 flex justify-between items-center ${isIncome ? "bg-success/5 border-success/20" : "bg-danger/5 border-danger/20"}`}>
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${isIncome ? "bg-success" : "bg-danger"}`} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-text flex items-center gap-2">
              {t.accountHead?.name || "Unknown"} {t.subType ? <span className="text-[10px] text-text-muted">· {t.subType}</span> : null}
              <span className={`px-2 py-0.5 rounded-full text-[8px] border ${isIncome ? "bg-success text-white border-success" : "bg-danger text-white border-danger"}`}>{t.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] border ${t.status === "VERIFIED" ? "bg-success/10 text-success border-success/20" : t.status === "PENDING" ? "bg-warning/10 text-warning border-warning/20" : "bg-danger/10 text-danger border-danger/20"}`}>{t.status}</span>
            </p>
            <p className="text-[10px] font-mono text-text-muted">{formatNepaliDateShort(t.date)}</p>
          </div>
        </div>
        <span className={`text-lg font-black font-mono ${isIncome ? "text-success" : "text-danger"}`}>{isIncome ? "+" : "-"} NPR {Number(t.amount).toLocaleString("en-IN")}</span>
      </div>

      {/* Excel-like sheet view */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-shaded/40 px-3 py-2 border-b border-border flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary">Report — Transaction Details</span>
          <span className="text-[9px] font-mono text-text-muted">ID {String(t._id).slice(-8)}</span>
        </div>
        <div className="p-4 bg-card">
          <Row label="Date (BS · AD)" value={formatNepaliDate(t.date)} />
          <Row label="Head / Sub-Head" value={`${t.accountHead?.name || "—"}${t.subType ? ` / ${t.subType}` : ""} ${t.accountHead?.code ? `(${t.accountHead.code})` : ""}`} />
          <Row label="Money Account" value={t.paymentCategory?.name ? `${t.paymentCategory.name} (${t.paymentCategory.identifier || ""})` : "—"} />
          <Row label="Amount" value={`${isIncome ? "+" : "-"} NPR ${Number(t.amount).toLocaleString()} (${t.type})`} mono />
          <Row label="Vendor / Donor" value={t.donorOrVendorName} />
          <Row label="Reference No." value={t.referenceNumber} mono />
          <Row label="Description" value={t.description} />
          <Row label="Status / Settled" value={`${t.status} ${t.isSettled ? "· Settled" : "· Unsettled"}`} />
          <Row label="Created" value={t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"} mono />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={closeModal} className="h-8 text-[11px]">Close</Button>
        <Button
          onClick={() => {
            closeModal();
            setTimeout(() => openTransactionForm({ initialData: t }), 200);
          }}
          className="h-8 text-[11px] bg-primary"
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
export default TransactionDetailModal;
