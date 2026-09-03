"use client";
import React, { useActionState, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/atoms/Button";
import { generateExpenseBulkTemplatePDF } from "@/lib/expenseBulkPdf";
import { generateExpenseBulkExcel } from "@/lib/expenseBulkExcel";
import { parseBulkExpensePdfAction, commitBulkExpensesAction } from "@/app/actions/bulkTransactions";

export function BulkExpenseUploadModal({ closeModal, accounts, categories }: any) {
  const { data: session } = useSession();
  const [localAccounts, setLocalAccounts] = useState<any[]>(accounts || []);
  const [localCats, setLocalCats] = useState<any[]>(categories || []);
  const [files, setFiles] = useState<File[]>([]);
  const [parseState, parseAction, isParsing] = useActionState(parseBulkExpensePdfAction as any, null as any);
  const [commitState, commitAction, isCommitting] = useActionState(commitBulkExpensesAction as any, null as any);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      fetch("/api/finances/accountHead").then(r => r.json()).then(d => setLocalAccounts(d.filter((a: any) => a.type === "EXPENSE"))).catch(() => {});
    }
    if (!categories || categories.length === 0) {
      fetch("/api/finances/payment-categories").then(r => r.json()).then(setLocalCats).catch(() => {});
    }
  }, [accounts, categories]);

  const handleDownload = async () => {
    const expAccounts = localAccounts.filter((a: any) => a.type === "EXPENSE");
    await generateExpenseBulkTemplatePDF(
      expAccounts.map((a: any) => ({ _id: String(a._id), name: a.name, code: a.code, subType: a.subType || [] })),
      localCats.map((c: any) => ({ _id: String(c._id), name: c.name, identifier: c.identifier })),
      100
    );
  };
  const handleDownloadExcel = () => {
    const expAccounts = localAccounts.filter((a: any) => a.type === "EXPENSE");
    generateExpenseBulkExcel(
      expAccounts.map((a: any) => ({ _id: String(a._id), name: a.name, code: a.code, subType: a.subType || [] })),
      localCats.map((c: any) => ({ _id: String(c._id), name: c.name, identifier: c.identifier }))
    );
  };

  const handleFilesChange = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
  };

  const rows: any[] = (parseState as any)?.rows || [];
  const isParsed = !!(parseState as any)?.success;
  const validRows = useMemo(() => rows.filter((r: any) => r.isValid), [rows]);
  const invalidRows = useMemo(() => rows.filter((r: any) => !r.isValid), [rows]);

  useEffect(() => {
    if ((commitState as any)?.success) setTimeout(() => closeModal(), 900);
  }, [commitState, closeModal]);

  const totalKB = files.reduce((s, f) => s + f.size, 0) / 1024;

  return (
    <div className="w-full max-w-[960px] max-h-[82vh] flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button onClick={handleDownloadExcel} className="bg-success text-white font-black text-[11px] uppercase tracking-widest h-10">
          ⬇ Download Excel — 100 rows (spreadsheet paste)
        </Button>
        <Button onClick={handleDownload} className="bg-primary text-text-invert font-black text-[11px] uppercase tracking-widest h-10">
          ⬇ Download PDF — 100 rows (Head only)
        </Button>
      </div>
      <p className="text-[10px] text-center text-text-muted font-bold -mt-1">Excel recommended for copy-paste: select rows in Excel/Sheets and paste into template in one go. PDF also available.</p>

      <div className="bg-shaded/60 border border-border rounded-xl p-3 text-[10px] leading-relaxed text-text-muted">
        <span className="font-black text-danger">Compulsory *: Head (name, case-insensitive, must already exist), Amount, Date BS or AD (YYYY-MM-DD, e.g. 2082-05-17 BS auto-converts).</span> Description optional. Type locked EXPENSE. BS dates auto-converted to AD. Heads/Sub-heads must be created first in Finance → Chart of Accounts (strict, case-insensitive). Empty rows ignored. Multifile .xlsx/.pdf — 15 MB per file, 30 MB total.
      </div>

      <form action={parseAction} className="space-y-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const list = e.dataTransfer.files;
            if (list?.length) {
              setFiles(Array.from(list));
              if (fileInputRef.current) (fileInputRef.current as any).files = list;
            }
          }}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-3 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border bg-card"}`}
        >
          <p className="text-[11px] font-black uppercase tracking-widest text-text">Upload Filled Files — Excel or PDF (multifile, 15 MB each)</p>
          <input
            ref={fileInputRef}
            type="file"
            name="files"
            multiple
            accept="application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls"
            required
            onChange={(e) => handleFilesChange(e.target.files)}
            className="text-xs w-full"
          />
          {files.length > 0 && (
            <div className="text-[11px] font-mono text-primary flex flex-col gap-1 items-center">
              {files.map(f => (
                <span key={f.name}>{f.name} ({(f.size/1024).toFixed(1)} KB) — {f.name.toLowerCase().endsWith(".xlsx") ? "Excel" : "PDF"} {f.name.includes("_100") ? "100 rows" : ""}</span>
              ))}
              <span className="text-[10px] text-text-muted">Total {files.length} file(s), {totalKB.toFixed(1)} KB — Excel supports full-row paste</span>
            </div>
          )}
          {/* fallback single file field for compatibility */}
          {files.length === 0 && <input type="hidden" name="file" value="" />}
          <Button type="submit" disabled={files.length === 0 || isParsing} className="bg-card border border-border text-text font-bold text-[11px] uppercase h-9">
            {isParsing ? "Parsing..." : `Parse & Preview (${files.length || 0} files)`}
          </Button>
        </div>
        {(parseState as any)?.error && (
          <div className="text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-lg p-3">{(parseState as any).error}</div>
        )}
      </form>

      {isParsed && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-widest">
            <span className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/20">Valid: {(parseState as any).validCount}</span>
            <span className="px-3 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">Invalid: {(parseState as any).invalidCount}</span>
            <span className="px-3 py-1 rounded-full bg-shaded border border-border text-text-muted">Total: {rows.length}</span>
            {(((parseState as any).unknownCount ?? (parseState as any).willCreateCount) > 0) && (
              <span className="px-3 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">Unknown heads/subs: {((parseState as any).unknownCount ?? (parseState as any).willCreateCount)}</span>
            )}
          </div>

          <div className="overflow-auto border border-border rounded-xl max-h-[300px] custom-scrollbar">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr className="text-[9px] uppercase tracking-widest text-text-muted">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">File</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Head</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 400).map((r: any) => (
                  <tr key={`${r._sourceFile}-${r.rowIndex}`} className={`border-b border-border/50 ${r.isValid ? "bg-success/5" : "bg-danger/5"}`}>
                    <td className="p-2 font-mono">{r.rowIndex + 1}</td>
                    <td className="p-2 font-mono text-[10px] truncate max-w-[90px]" title={r._sourceFile}>{(r._sourceFile || "").slice(0,18)}</td>
                    <td className="p-2 font-mono" title={r._wasBs ? `BS ${r._originalDate} → AD ${r.dateObj}` : r.dateObj || r.date}>{r._wasBs ? `${r._originalDate} → ${r.dateObj}` : (r.dateDisplay || r.dateObj || r.date || "—")}</td>
                    <td className="p-2">
                      {r.account} {!r.isValid && r.errors?.some((e:string)=>e.includes("Unknown head")) && <span className="ml-1 px-1.5 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 text-[9px] font-black uppercase">unknown head</span>}
                      {r.subType ? ` / ${r.subType}` : ""} {!r.isValid && r.errors?.some((e:string)=>e.includes("Unknown sub-head")) && <span className="ml-1 px-1.5 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 text-[9px] font-black uppercase">unknown sub</span>}
                    </td>
                    <td className="p-2 font-mono">{r.amountNum ?? r.amount}</td>
                    <td className="p-2 max-w-[180px] truncate" title={r.desc}>{r.desc || "—"}</td>
                    <td className="p-2">
                      {r.isValid ? <span className="text-success font-bold">✓ Ready</span> : <span className="text-danger font-bold" title={r.errors.join("; ")}>{r.errors[0]}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 400 && <div className="p-2 text-center text-[10px] text-text-muted font-bold">Showing 400 of {rows.length} rows — all {validRows.length} valid will be imported</div>}
          </div>
          {invalidRows.length > 0 && <p className="text-[10px] text-danger font-bold">{invalidRows.length} invalid rows have unknown head/sub-head (strict, case-insensitive — create them first in Chart of Accounts) or other errors. Fix the file and re-upload.</p>}

          <form action={commitAction} className="flex justify-end gap-2 pt-2 border-t border-border">
            <input type="hidden" name="payload" value={JSON.stringify(rows)} />
            <input type="hidden" name="status" value={session?.user?.role === "ADMIN" ? "VERIFIED" : "PENDING"} />
            <input type="hidden" name="createdBy" value={session?.user?.id || ""} />
            <Button type="button" variant="ghost" onClick={closeModal} className="h-9 text-[11px] uppercase font-bold">Cancel</Button>
            <Button type="submit" disabled={validRows.length === 0 || isCommitting} className="bg-danger text-white font-black text-[11px] uppercase h-9 px-6">
              {isCommitting ? "Importing..." : `Import ${validRows.length} Expenses`}
            </Button>
          </form>
          {(commitState as any)?.error && <div className="text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-lg p-3">{(commitState as any).error}</div>}
          {(commitState as any)?.success && <div className="text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-lg p-3">✓ Imported {(commitState as any).inserted} expenses (strict heads/subs, case-insensitive). Refreshing...</div>}
        </div>
      )}
    </div>
  );
}
export default BulkExpenseUploadModal;
