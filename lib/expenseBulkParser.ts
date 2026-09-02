import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";

export interface RawBulkRow {
  rowIndex: number; // global
  date: string;
  account: string; // head name only, case-insensitive
  subType: string;
  paymentCategory: string;
  amount: string;
  vendor: string;
  ref: string;
  desc: string;
  _sourceFile?: string;
}

export async function parseExpenseBulkPdf(buffer: ArrayBuffer): Promise<RawBulkRow[]> {
  const pdfDoc = await PDFDocument.load(buffer);
  const form = pdfDoc.getForm();
  const fields = form.getFields().map(f => f.getName());

  // discover max row index from any field pattern
  let maxRow = -1;
  for (const n of fields) {
    const m = n.match(/^(date|account|subType|paymentCategory|amount|vendor|ref|desc)_(\d+)$/);
    if (m) maxRow = Math.max(maxRow, parseInt(m[2], 10));
  }
  // fallback: if no fields but maybe old 25-row file, try 0..1999
  if (maxRow === -1) maxRow = 1999;

  const rows: RawBulkRow[] = [];
  for (let r = 0; r <= maxRow; r++) {
    const get = (name: string) => {
      try {
        const f: any = form.getTextField(name);
        return (f.getText() ?? "").toString().trim();
      } catch {
        return "";
      }
    };
    const date = get(`date_${r}`);
    const account = get(`account_${r}`);
    const subType = get(`subType_${r}`);
    const paymentCategory = get(`paymentCategory_${r}`);
    const amount = get(`amount_${r}`);
    const vendor = get(`vendor_${r}`);
    const ref = get(`ref_${r}`);
    const desc = get(`desc_${r}`);

    if (!date && !account && !subType && !paymentCategory && !amount && !vendor && !ref && !desc) continue;

    rows.push({ rowIndex: r, date, account, subType, paymentCategory, amount, vendor, ref, desc });
  }
  return rows;
}

// --- BS / AD flexible date handling ---
// Bulk upload accepts BOTH BS and AD in YYYY-MM-DD (or YYYY/MM/DD). BS dates are around 2070-2100.
// We detect BS by year >= 2070 (and <= 2100) and convert to AD via bsToAdParts. Otherwise treat as AD.
import { bsToAdParts, isValidBsDate } from "@itzsa/bs-date";

const pad2 = (n: number) => String(n).padStart(2, "0");

function parseBsOrAdDate(input: string | Date): { adIso: string | null; wasBs: boolean; error?: string } {
  if (input == null) return { adIso: null, wasBs: false };
  // Date object from Excel cellDates
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return { adIso: null, wasBs: false, error: "Invalid Date object" };
    const y = input.getFullYear();
    const m = input.getMonth() + 1;
    const d = input.getDate();
    // Heuristic: if year >= 2070, this Date actually represents a BS year typed as 2082-05-17 (Excel serial for 2082)
    // Convert that BS to AD.
    if (y >= 2070 && y <= 2100) {
      try {
        if (isValidBsDate({ year: y, month: m, day: d } as any)) {
          const ad = bsToAdParts({ year: y, month: m, day: d } as any);
          return { adIso: `${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`, wasBs: true };
        }
      } catch {}
    }
    return { adIso: `${y}-${pad2(m)}-${pad2(d)}`, wasBs: false };
  }

  const s = String(input).trim();
  if (!s) return { adIso: null, wasBs: false };
  // normalize separators
  const norm = s.replace(/[./]/g, "-").replace(/\s+/g, "");
  const parts = norm.split("-");
  // expect YYYY-MM-DD
  if (parts.length !== 3) return { adIso: null, wasBs: false, error: `Date must be YYYY-MM-DD, got "${s}"` };
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return { adIso: null, wasBs: false, error: `Invalid date "${s}"` };
  }
  if (m < 1 || m > 12 || d < 1 || d > 32) {
    return { adIso: null, wasBs: false, error: `Invalid date "${s}"` };
  }
  // BS detection: 2070-2100 is unambiguously BS (AD 2070+ is far future, no expense will be that far)
  if (y >= 2070 && y <= 2100) {
    try {
      if (isValidBsDate({ year: y, month: m, day: d } as any)) {
        const ad = bsToAdParts({ year: y, month: m, day: d } as any);
        return { adIso: `${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`, wasBs: true };
      } else {
        return { adIso: null, wasBs: true, error: `Invalid BS date "${s}" (month/day out of range for BS)` };
      }
    } catch (e: any) {
      return { adIso: null, wasBs: true, error: e.message || `Invalid BS date "${s}"` };
    }
  }
  // Treat as AD
  const adIso = `${y}-${pad2(m)}-${pad2(d)}`;
  const dt = new Date(adIso);
  if (isNaN(dt.getTime())) return { adIso: null, wasBs: false, error: `Invalid AD date "${s}"` };
  // guard against overflow like 2025-02-30 -> Date would roll to March
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d) {
    // do strict check with local date parts
    const strict = new Date(`${adIso}T00:00:00`);
    if (isNaN(strict.getTime()) || strict.getFullYear() !== y) {
      return { adIso: null, wasBs: false, error: `Invalid AD date "${s}"` };
    }
  }
  return { adIso, wasBs: false };
}

export function parseDateToAdIso(input: string | Date): string | null {
  const r = parseBsOrAdDate(input);
  return r.adIso;
}

export { parseBsOrAdDate };

export function validateBulkRow(row: RawBulkRow): string | null {
  if (!row.date) return "Date is required (BS or AD, YYYY-MM-DD)";
  const parsed = parseBsOrAdDate(row.date);
  if (!parsed.adIso) return parsed.error || `Invalid date "${row.date}" (use BS 2082-05-17 or AD 2025-09-02)`;
  if (!row.account) return "Head is required";
  if (!row.amount) return "Amount is required";
  const amt = Number(String(row.amount).replace(/,/g, "").trim());
  if (isNaN(amt) || amt <= 0) return `Invalid amount "${row.amount}"`;
  // Description is now optional (user request)
  return null;
}

export async function parseExpenseBulkExcel(buffer: ArrayBuffer): Promise<RawBulkRow[]> {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];
  // Use header row A1:G1 as mapping, data from row 2 onward
  const rowsJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  if (rowsJson.length < 2) return [];
  // row 0 is header, row 1 is example, data from row 1 or 2 depending — we include row1 as real data but skip if it's header duplicate
  const out: RawBulkRow[] = [];
  // start at 1 (second row) to include example; empty rows ignored anyway
  for (let i = 1; i < rowsJson.length; i++) {
    const r = rowsJson[i] as any[];
    if (!r || r.length === 0) continue;
    // COLS: Date, Head, SubHead, Amount, Vendor, Ref, Desc (7 cols)
    // Support legacy 8-col file (with Money Account col at idx 3) by detecting 8 cols
    let date: string, account: string, subType: string, amount: string, vendor: string, ref: string, desc: string, paymentCategory: string = "";
    if (r.length >= 8) {
      // legacy: Date, Head, Sub, Money, Amount, Vendor, Ref, Desc
      date = String(r[0] ?? "").trim();
      account = String(r[1] ?? "").trim();
      subType = String(r[2] ?? "").trim();
      paymentCategory = String(r[3] ?? "").trim();
      amount = String(r[4] ?? "").trim();
      vendor = String(r[5] ?? "").trim();
      ref = String(r[6] ?? "").trim();
      desc = String(r[7] ?? "").trim();
    } else {
      date = String(r[0] ?? "").trim();
      account = String(r[1] ?? "").trim();
      subType = String(r[2] ?? "").trim();
      amount = String(r[3] ?? "").trim();
      vendor = String(r[4] ?? "").trim();
      ref = String(r[5] ?? "").trim();
      desc = String(r[6] ?? "").trim();
    }
    // handle Date objects from xlsx (cellDates:true gives Date)
    if ((date as any) instanceof Date) date = (date as any).toISOString().slice(0,10);
    // xlsx may parse Date as number string: try Date parse if looks excel date serial?
    if (!isNaN(Date.parse(date))) {
      // keep as is
    } else if (date && !isNaN(Number(date)) && String(date).length >= 4) {
      // try excel serial? skip
    }

    // skip fully empty or header row duplicate
    if (!date && !account && !subType && !amount && !vendor && !ref && !desc && !paymentCategory) continue;
    // skip header echo if account == "Head*" or "Category"
    if (norm(account) === "head*" || norm(account) === "category*") continue;

    out.push({ rowIndex: i - 1, date, account, subType, paymentCategory, amount, vendor, ref, desc });
  }
  return out;
}

// helpers for case-insensitive normalize
export function norm(s: string): string {
  return String(s || "").trim().toLowerCase();
}
