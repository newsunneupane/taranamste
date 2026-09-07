"use client";
import React, { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { generateChildBulkExcel } from "@/lib/childBulkExcel";
import { parseBulkChildrenAction, commitBulkChildrenAction } from "@/app/actions/bulkChildren";
import {
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Sparkles,
  Users,
  X,
} from "lucide-react";

export function BulkChildUploadModal({ closeModal }: { closeModal: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [parseState, parseAction, isParsing] = useActionState(parseBulkChildrenAction as any, null as any);
  const [commitState, commitAction, isCommitting] = useActionState(commitBulkChildrenAction as any, null as any);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const rows: any[] = (parseState as any)?.rows || [];
  const isParsed = !!(parseState as any)?.success;
  const validRows = useMemo(() => rows.filter((r: any) => r.isValid), [rows]);
  const invalidRows = useMemo(() => rows.filter((r: any) => !r.isValid), [rows]);

  useEffect(() => {
    if ((commitState as any)?.success) setTimeout(() => closeModal(), 1200);
  }, [commitState, closeModal]);

  const totalKB = files.reduce((s, f) => s + f.size, 0) / 1024;

  const handleFilesChange = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-[1080px] max-h-[84vh] flex flex-col gap-5">
      {/* Header intro card */}
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-[13px] font-black tracking-tight text-text uppercase flex items-center gap-1.5">
                Bulk admit — Children <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[8px] tracking-widest">NEW</span>
              </h3>
              <p className="text-[11px] text-text-muted font-medium leading-tight">
                Download the Excel template, fill it with your data, upload and preview — then import.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary/70 border border-primary/15 bg-card px-2.5 py-1 rounded-full">
            <Sparkles size={12} /> Same fields as Admit Child
          </span>
        </div>

        {/* Action row: download + tips */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1.85fr] gap-3">
          <button
            onClick={() => generateChildBulkExcel()}
            className="group flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-white font-black text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Download size={16} className="group-hover:translate-y-[1px] transition-transform" />
            Download Template — .xlsx (100 rows + 2 examples)
          </button>
          <div className="bg-card border border-border rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text">
              <FileSpreadsheet size={12} className="text-success" /> How to fill
            </div>
            <ul className="text-[11px] leading-relaxed text-text-muted list-disc pl-4 space-y-0.5">
              <li>
                <span className="font-bold text-danger">Required*: </span>First Name, Last Name, Gender (MALE/FEMALE/OTHER), Date of Birth (BS or AD M/D/YYYY e.g. 5/22/2083).
              </li>
              <li>Admission Date blank = today. Dates BS 2070–2100 auto-convert — preview shows 5/22/2083 (BS→AD).</li>
              <li>Keep header row. Empty rows ignored. Copy-paste from your sheet starting at A2. Duplicates (same First+Last+DOB) blocked.</li>
            </ul>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-1 rounded-full bg-shaded border border-border text-[10px] font-bold">Status: IN_CARE / FOSTERED / ADOPTED / REUNITED / GRADUATED</span>
              <span className="px-2 py-1 rounded-full bg-shaded border border-border text-[10px] font-bold">Blood: A+/A-/B+/B-/AB+/AB-/O+/O-</span>
              <span className="px-2 py-1 rounded-full bg-shaded border border-border text-[10px] font-bold">Arrival: POLICE_RESCUE / ABANDONED / FAMILY_SURRENDER / HOSPITAL_REFERRAL / OTHER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload zone */}
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
          className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-3 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border bg-card"}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${dragOver ? "bg-primary text-white border-primary" : "bg-shaded text-text-muted border-border"}`}>
            <UploadCloud size={18} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-text text-center">
            Drop your filled .xlsx here or browse{" "}
            <span className="text-primary underline underline-offset-2">— Excel only (.xlsx / .xls)</span>
          </p>
          <div className="flex items-center gap-2 w-full max-w-md">
            <input
              ref={fileInputRef}
              type="file"
              name="files"
              multiple
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls"
              required
              onChange={(e) => handleFilesChange(e.target.files)}
              className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-border file:bg-shaded file:text-text file:font-bold file:text-xs hover:file:bg-card"
            />
            {files.length > 0 && (
              <button type="button" onClick={clearFiles} className="shrink-0 w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-text-muted hover:text-danger">
                <X size={14} />
              </button>
            )}
          </div>
          {files.length > 0 ? (
            <div className="text-[11px] font-mono text-primary flex flex-col gap-1 items-center w-full">
              {files.map((f) => (
                <span key={f.name} className="inline-flex items-center gap-1.5 max-w-full truncate">
                  <FileSpreadsheet size={12} className="shrink-0" />
                  <span className="truncate">{f.name}</span>
                  <span className="text-text-muted">({(f.size / 1024).toFixed(1)} KB)</span>
                </span>
              ))}
              <span className="text-[10px] text-text-muted font-sans">Total {files.length} file(s), {totalKB.toFixed(1)} KB — up to 500 rows per import (15 MB per file, 30 MB total)</span>
            </div>
          ) : (
            <p className="text-[10px] text-text-muted font-medium">Use the green Download button above to get the correct template with examples & instructions sheet.</p>
          )}
          {/* fallback single file field for compatibility */}
          {files.length === 0 && <input type="hidden" name="file" value="" />}
          <Button type="submit" disabled={files.length === 0 || isParsing} className="bg-primary text-white font-black text-[11px] uppercase tracking-widest h-9 px-8 disabled:opacity-40">
            {isParsing ? "Parsing..." : `Parse & Preview (${files.length || 0} file${files.length === 1 ? "" : "s"})`}
          </Button>
        </div>
        {(parseState as any)?.error && (
          <div className="flex gap-2 items-start text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl p-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{(parseState as any).error}</span>
          </div>
        )}
      </form>

      {/* Preview */}
      {isParsed && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-widest">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success border border-success/20">
              <CheckCircle2 size={12} /> Valid: {(parseState as any).validCount}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">
              <AlertTriangle size={12} /> Invalid: {(parseState as any).invalidCount}
            </span>
            <span className="px-3 py-1 rounded-full bg-shaded border border-border text-text-muted">Total: {rows.length}</span>
            <span className="px-3 py-1 rounded-full bg-card border border-border text-text-muted">BS dates auto-convert → AD</span>
          </div>

          <div className="overflow-auto border border-border rounded-xl max-h-[320px] custom-scrollbar bg-card">
            <table className="w-full text-[11px] min-w-[900px]">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr className="text-[9px] uppercase tracking-widest text-text-muted">
                  <th className="p-2 text-left w-[36px]">#</th>
                  <th className="p-2 text-left">File</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Gender</th>
                  <th className="p-2 text-left">DOB</th>
                  <th className="p-2 text-left">Admission</th>
                  <th className="p-2 text-left">Status / Arrival</th>
                  <th className="p-2 text-left">School • Grade</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 400).map((r: any) => (
                  <tr key={`${r._sourceFile}-${r.rowIndex}`} className={`border-b border-border/50 ${r.isValid ? "bg-success/5" : "bg-danger/5"}`}>
                    <td className="p-2 font-mono text-text-muted">{r.rowIndex + 1}</td>
                    <td className="p-2 font-mono text-[10px] truncate max-w-[90px]" title={r._sourceFile}>
                      {(r._sourceFile || "").slice(0, 20)}
                    </td>
                    <td className="p-2 font-bold">
                      {r.firstName} {r.lastName}
                      {r.bloodType ? <span className="ml-1 px-1 py-0.5 rounded bg-card border border-border text-[9px] font-black uppercase">{r.bloodType}</span> : null}
                    </td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black uppercase ${r.isValid ? "bg-card border-border" : "bg-danger/10 border-danger/20 text-danger"}`}>
                        {r.genderNorm || r.gender || "—"}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-[11px]" title={r._wasBsDob ? `BS ${r._originalDob} → AD ${r.dobSlash || r.dobAdIso}` : r.dobSlash || r.dobAdIso}>
                      {r._wasBsDob ? `${r._originalDob} → ${r.dobSlash || r.dobAdIso}` : (r.dobSlash || r.dobAdIso || r.dobDisplay)}
                    </td>
                    <td className="p-2 font-mono text-[11px]" title={r._wasBsAdm ? `BS ${r._originalAdm} → AD ${r.admSlash || r.admAdIso}` : r.admSlash || r.admAdIso || "today"}>
                      {r._wasBsAdm ? `${r._originalAdm} → ${r.admSlash || r.admAdIso}` : r.admDisplay}
                    </td>
                    <td className="p-2 text-[11px]">
                      <span className="font-bold">{r.statusNorm || "IN_CARE"}</span>
                      <span className="text-text-muted"> • </span>
                      <span>{r.arrivalNorm || r.arrivalCategory || "OTHER"}</span>
                    </td>
                    <td className="p-2 text-[11px] max-w-[160px] truncate" title={`${r.schoolName || ""} ${r.gradeLevel ? "• Grade " + r.gradeLevel : ""}`}>
                      {r.schoolName || "—"}
                      {r.gradeLevel ? ` • ${r.gradeLevel}` : ""}
                    </td>
                    <td className="p-2">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-success font-black">
                          <CheckCircle2 size={12} /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger font-bold max-w-[180px] truncate" title={r.errors.join("; ")}>
                          <AlertTriangle size={12} className="shrink-0" /> {r.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 400 && (
              <div className="p-2 text-center text-[10px] text-text-muted font-bold border-t border-border">Showing 400 of {rows.length} rows — all {validRows.length} valid will be imported</div>
            )}
          </div>

          {invalidRows.length > 0 && (
            <div className="flex gap-2 items-start text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl p-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                {invalidRows.length} row{invalidRows.length > 1 ? "s" : ""} have errors — hover the Status column for details. Fix the Excel and re-upload (you can re-upload just the corrected rows).
                Common fixes: Gender must be MALE/FEMALE/OTHER, DOB must be M/D/YYYY e.g. 5/22/2083 and not future, Status/Arrival spelling must match allowed values.
              </span>
            </div>
          )}

          <form action={commitAction} className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-border">
            <input type="hidden" name="payload" value={JSON.stringify(rows)} />
            <Button type="button" variant="ghost" onClick={closeModal} className="h-9 text-[11px] uppercase font-black">
              Cancel
            </Button>
            <Button type="submit" disabled={validRows.length === 0 || isCommitting} className="bg-primary text-white font-black text-[11px] uppercase tracking-widest h-9 px-6">
              {isCommitting ? "Importing..." : `Import ${validRows.length} ${validRows.length === 1 ? "Child" : "Children"}`}
            </Button>
          </form>
          {(commitState as any)?.error && (
            <div className="flex gap-2 items-start text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl p-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> <span>{(commitState as any).error}</span>
            </div>
          )}
          {(commitState as any)?.success && (
            <div className="flex gap-2 items-center text-[11px] font-black text-success bg-success/10 border border-success/20 rounded-xl p-3">
              <CheckCircle2 size={14} /> ✓ Imported {(commitState as any).inserted} children. Refreshing list...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default BulkChildUploadModal;
