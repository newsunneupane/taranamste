"use server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import AccountHead from "@/models/AccountHead";
import PaymentCategory from "@/models/paymentCategory";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";
import { parseExpenseBulkPdf, parseExpenseBulkExcel, validateBulkRow, norm, parseDateToAdIso, parseBsOrAdDate } from "@/lib/expenseBulkParser";

type ParseResult = {
  success: boolean;
  error?: string;
  rows?: any[];
  validCount?: number;
  invalidCount?: number;
  willCreateCount?: number;
};

function codeFromName(name: string): string {
  const base = String(name || "EXPENSE").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24) || "EXPENSE";
  return base.startsWith("EXP_") ? base : `EXP_${base}`;
}

export async function parseBulkExpensePdfAction(_prev: any, formData: FormData): Promise<ParseResult> {
  const w = await requireWrite("/finance");
  if (!(w as any).ok) return { success: false, error: (w as any).error };

  // multifile support: getAll("files") + fallback "file"
  const filesAll = formData.getAll("files") as File[];
  const single = formData.get("file") as File | null;
  const files: File[] = (filesAll && filesAll.length ? filesAll : (single ? [single] : [])) as File[];
  if (!files.length) return { success: false, error: "No file uploaded." };

  // 15 MB per file, total cap — accept PDF + Excel
  let totalSize = 0;
  const allowedPdf = ["application/pdf"];
  const allowedExcel = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
  ];
  for (const f of files) {
    if (!f) continue;
    const isPdf = !f.type || allowedPdf.includes(f.type) || f.name.toLowerCase().endsWith(".pdf");
    const isExcel = allowedExcel.includes(f.type) || f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls");
    if (!isPdf && !isExcel) return { success: false, error: `Only PDF or Excel allowed — got ${f.type || "unknown"} for ${f.name}` };
    if (f.size > 15 * 1024 * 1024) return { success: false, error: `${f.name} too large (max 15 MB)` };
    if (f.size === 0) return { success: false, error: `${f.name} is empty` };
    totalSize += f.size;
  }
  if (totalSize > 30 * 1024 * 1024) return { success: false, error: "Total upload too large (max 30 MB across files)" };

  let rawRows: any[] = [];
  try {
    for (const f of files) {
      const buf = await f.arrayBuffer();
      const lower = f.name.toLowerCase();
      const isExcelFile = lower.endsWith(".xlsx") || lower.endsWith(".xls") || (f.type && allowedExcel.includes(f.type) && !lower.endsWith(".pdf"));
      const rows = isExcelFile ? await parseExpenseBulkExcel(buf) : await parseExpenseBulkPdf(buf);
      // tag source file for UX
      rows.forEach((r: any) => (r._sourceFile = f.name));
      rawRows = rawRows.concat(rows);
    }
  } catch (e: any) {
    return { success: false, error: "Failed to parse: " + (e.message || "unknown") + ". Please use the downloaded template (PDF or Excel 100 rows)." };
  }

  if (!rawRows.length) return { success: false, error: "No filled rows found across files. Fill the template (Excel copy-paste or PDF), then upload (multifile .pdf/.xlsx)." };
  if (rawRows.length > 5000) return { success: false, error: `Too many rows (${rawRows.length}). Max 5000 across files.` };

  await dbConnect();
  const accounts = await AccountHead.find({ type: "EXPENSE", isActive: true }).lean();
  // paymentCategory removed from PDF — no longer validated, kept only for backward compat parsing

  const accountByNameLower = new Map(accounts.map((a: any) => [norm(a.name), a]));

  // collect distinct heads that will be auto-created (case-insensitive)
  const willCreateSet = new Set<string>();
  for (const r of rawRows) if (r.account && !accountByNameLower.has(norm(r.account))) willCreateSet.add(norm(r.account));

  const rows = rawRows.map((r) => {
    const baseError = validateBulkRow(r);
    const nAccount = norm(r.account);
    const nSub = norm(r.subType);
    let accountResolved: any = null;
    let categoryResolved: any = null;

    if (r.account) accountResolved = accountByNameLower.get(nAccount) || null;

    // Money Account column removed — ignore r.paymentCategory (kept only for backward compat)
    if (r.subType && accountResolved) {
      const availableLower = (accountResolved.subType || []).map((s: string) => norm(s));
      void availableLower;
    }

    const accountWillCreate = !!r.account && !accountResolved;

    let categoryWarn: string | null = null;

    const amountNum = Number(String(r.amount).replace(/,/g, "").trim());
    // BS-aware date handling — converts BS 2082-05-17 -> AD 2025-09-02
    const parsedDate = parseBsOrAdDate(r.date);
    const dateValid = !!parsedDate.adIso;
    const adIso = parsedDate.adIso || r.date;

    const errors: string[] = [];
    if (baseError) errors.push(baseError);
    // Avoid duplicate invalid date error — validateBulkRow already covers it via BS logic
    // do NOT push account unknown as error — auto-create

    const willCreate = accountWillCreate;
    const subTypeWillCreate = !!(r.subType && accountResolved && !accountResolved.subType.map((s: string) => norm(s)).includes(nSub));

    return {
      ...r,
      _originalDate: r.date,
      _wasBs: parsedDate.wasBs,
      amountNum: isNaN(amountNum) ? null : amountNum,
      dateObj: adIso,
      dateDisplay: parsedDate.wasBs ? `${r.date} (BS→${adIso})` : adIso,
      accountResolved: accountResolved ? { _id: String(accountResolved._id), name: accountResolved.name } : null,
      categoryResolved: null,
      willCreate,
      subTypeWillCreate,
      nAccount,
      nSub,
      categoryWarn,
      errors,
      isValid: errors.length === 0,
    };
  });

  const validCount = rows.filter((r: any) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return { success: true, rows, validCount, invalidCount, willCreateCount: willCreateSet.size };
}

export async function commitBulkExpensesAction(_prev: any, formData: FormData) {
  const w = await requireWrite("/finance");
  if (!(w as any).ok) return { success: false, error: (w as any).error };

  const payloadRaw = formData.get("payload") as string | null;
  const status = (formData.get("status") as string) || "PENDING";
  const createdBy = formData.get("createdBy") as string | null;

  if (!payloadRaw) return { success: false, error: "No payload." };
  if (!createdBy) return { success: false, error: "Missing creator." };

  let rows: any[];
  try {
    rows = JSON.parse(payloadRaw);
  } catch {
    return { success: false, error: "Invalid payload." };
  }

  const validRows = rows.filter((r: any) => r.isValid);
  if (!validRows.length) return { success: false, error: "No valid rows to import." };
  if (validRows.length > 2000) return { success: false, error: "Too many rows (max 2000). Split across uploads." };

  // ---------- Duplicate detection: within upload ----------
  const keyFor = (r: any) => {
    // Normalized dedup key: date|head|sub|amount|vendor|ref|desc — all case-insensitive trim
    const d = String(r.dateObj || r.date || "").trim();
    const h = norm(r.account);
    const s = norm(r.subType);
    const amt = String(r.amountNum ?? String(r.amount ?? "").replace(/,/g, "").trim());
    const v = norm(r.vendor);
    const ref = norm(r.ref);
    const desc = norm(r.desc);
    return `${d}|${h}|${s}|${amt}|${v}|${ref}|${desc}`;
  };
  const seen = new Map<string, number[]>();
  validRows.forEach((r, idx) => {
    const k = keyFor(r);
    if (!seen.has(k)) seen.set(k, []);
    seen.get(k)!.push(idx);
  });
  const dupGroups = Array.from(seen.entries()).filter(([, arr]) => arr.length > 1);
  if (dupGroups.length) {
    const details = dupGroups
      .map(([k, arr]) => {
        const sample = validRows[arr[0]];
        const locs = arr.map(i => {
          const rr = validRows[i];
          return `row ${rr.rowIndex + 1}${rr._sourceFile ? ` (${rr._sourceFile})` : ""}`;
        }).join(", ");
        return `Duplicate ${arr.length}× — ${sample.account}${sample.subType ? "/" + sample.subType : ""} | ${sample.dateObj || sample.date} | NPR ${sample.amountNum ?? sample.amount} — at ${locs}`;
      })
      .join("; ");
    return {
      success: false,
      error: `Duplicate rows found within upload (${dupGroups.length} duplicate group(s)). ${details}. Please remove duplicates and re-upload. No data was saved.`,
    };
  }

  await dbConnect();

  // Prepare session for atomic transaction
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // --- Auto-create heads case-insensitive (within txn) ---
    const needed = new Map<string, { displayName: string; subTypes: Map<string, string> }>();
    for (const r of validRows) {
      if (r.willCreate) {
        const key = norm(r.account);
        if (!needed.has(key)) needed.set(key, { displayName: String(r.account).trim(), subTypes: new Map() });
        if (r.subType) {
          const ns = norm(r.subType);
          if (!needed.get(key)!.subTypes.has(ns)) needed.get(key)!.subTypes.set(ns, String(r.subType).trim());
        }
      }
    }

    const existingForSub = await AccountHead.find({ type: "EXPENSE" }).session(session).lean();
    const existingByLower = new Map(existingForSub.map((a: any) => [norm(a.name), a]));

    // create missing heads
    for (const [lower, info] of needed) {
      if (existingByLower.has(lower)) continue;
      let code = codeFromName(info.displayName);
      let tryCode = code;
      let suffix = 2;
      while (await AccountHead.findOne({ code: tryCode }).session(session).lean()) {
        tryCode = `${code}_${suffix++}`;
      }
      const subArray = Array.from(info.subTypes.values());
      try {
        const createdArr = await AccountHead.create(
          [
            {
              name: info.displayName,
              code: tryCode,
              type: "EXPENSE",
              fundCategory: "UNRESTRICTED",
              subType: subArray,
              description: "Auto-created via bulk " + new Date().toISOString().slice(0, 10),
              isActive: true,
              isSystem: false,
            },
          ],
          { session }
        );
        const created = createdArr[0] as any;
        existingByLower.set(lower, created.toObject ? created.toObject() : created);
      } catch (e: any) {
        if (e.code === 11000) {
          const ex = await AccountHead.findOne({ name: new RegExp(`^${info.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })
            .session(session)
            .lean();
          if (ex) existingByLower.set(lower, ex);
          else throw e;
        } else throw e;
      }
    }

    // add new subTypes to existing heads (case-insensitive)
    const subAdds = new Map<string, Set<string>>();
    for (const r of validRows) {
      if (!r.willCreate && r.subType && r.accountResolved) {
        const head = existingByLower.get(norm(r.account));
        if (!head) continue;
        const existsLower = new Set((head.subType || []).map((s: string) => norm(s)));
        const ns = norm(r.subType);
        if (!existsLower.has(ns)) {
          const id = String(head._id);
          if (!subAdds.has(id)) subAdds.set(id, new Set());
          subAdds.get(id)!.add(String(r.subType).trim());
        }
      }
    }
    for (const [headId, set] of subAdds) {
      const arr = Array.from(set);
      await AccountHead.findByIdAndUpdate(headId, { $addToSet: { subType: { $each: arr } } }, { session });
      const fresh = await AccountHead.findById(headId).session(session).lean();
      if (fresh) existingByLower.set(norm(fresh.name), fresh);
    }

    // rebuild final accountByLower to include created (within txn)
    const finalAccounts = await AccountHead.find({ type: "EXPENSE" }).session(session).lean();
    const finalByLower = new Map(finalAccounts.map((a: any) => [norm(a.name), a]));

    // ---------- Duplicate against DB ----------
    // Build keys for DB check: date (day), headId, sub, amount, vendor, ref, desc
    // Do single query per batch of dates/heads to reduce roundtrips, then verify exact match in memory
    const headIds = Array.from(new Set(validRows.map(r => {
      const h = finalByLower.get(norm(r.account));
      return h ? String(h._id) : null;
    }).filter(Boolean))) as string[];
    const dateObjs = Array.from(new Set(validRows.map(r => String(r.dateObj).slice(0, 10))));

    let existingKeys = new Set<string>();
    if (headIds.length && dateObjs.length) {
      const startDate = new Date(Math.min(...validRows.map(r => new Date(r.dateObj).getTime())));
      const endDate = new Date(Math.max(...validRows.map(r => new Date(r.dateObj).getTime())));
      // extend to day boundaries
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const existingTx = await Transaction.find({
        type: "EXPENSE",
        accountHead: { $in: headIds.map(id => new mongoose.Types.ObjectId(id)) },
        date: { $gte: startDate, $lte: endDate },
      })
        .session(session)
        .lean();
      for (const tx of existingTx) {
        const d = new Date(tx.date).toISOString().slice(0, 10);
        const headName = finalByLower.get(norm(String((tx as any).accountHead))) ? "" : "";
        // resolve head name via id -> name map
        const headObj: any = finalAccounts.find((a: any) => String(a._id) === String(tx.accountHead));
        const h = norm(headObj?.name || "");
        const s = norm(tx.subType || "");
        const amt = String(tx.amount);
        const v = norm(tx.donorOrVendorName || "");
        const ref = norm(tx.referenceNumber || "");
        const desc = norm(tx.description || "");
        existingKeys.add(`${d}|${h}|${s}|${amt}|${v}|${ref}|${desc}`);
      }
    }

    const dbDups: string[] = [];
    for (const r of validRows) {
      const k = keyFor(r);
      if (existingKeys.has(k)) {
        dbDups.push(`row ${r.rowIndex + 1}${r._sourceFile ? ` (${r._sourceFile})` : ""}: ${r.account}${r.subType ? "/" + r.subType : ""} | ${r.dateObj} | NPR ${r.amountNum ?? r.amount}`);
      }
    }
    if (dbDups.length) {
      await session.abortTransaction();
      return {
        success: false,
        error: `Duplicate with existing database records (${dbDups.length} row(s) already exist). ${dbDups.slice(0, 5).join("; ")}${dbDups.length > 5 ? ` (+${dbDups.length - 5} more)` : ""}. No data was saved (transaction rolled back).`,
      };
    }

    const docs = validRows.map((r: any) => {
      const head = finalByLower.get(norm(r.account));
      if (!head) throw new Error(`Head ${r.account} could not be resolved/created`);
      const accId = head._id;
      return {
        amount: r.amountNum,
        type: "EXPENSE",
        accountHead: accId,
        subType: r.subType ? String(r.subType).trim() : undefined,
        paymentCategory: null,
        date: new Date(r.dateObj),
        description: r.desc && String(r.desc).trim() ? String(r.desc).trim() : `${String(r.account).trim()}${r.subType ? ` / ${String(r.subType).trim()}` : ""} expense`,
        donorOrVendorName: r.vendor || undefined,
        referenceNumber: r.ref || undefined,
        status: status === "VERIFIED" ? "VERIFIED" : "PENDING",
        createdBy,
        isSettled: false,
      };
    });

    // batch insert within txn
    const BATCH = 500;
    for (let i = 0; i < docs.length; i += BATCH) {
      const chunk = docs.slice(i, i + BATCH);
      await Transaction.insertMany(chunk, { ordered: true, session } as any);
    }

    await session.commitTransaction();
    revalidatePath("/finance");
    revalidatePath("/approvals");
    revalidatePath("/accounts_headers");
    return { success: true, inserted: docs.length };
  } catch (e: any) {
    try { await session.abortTransaction(); } catch {}
    // Provide proper duplicate/key error mapping
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || e.keyValue || {})[0] || "record";
      return { success: false, error: `Database duplicate key on ${field}: ${e.message}. Transaction rolled back — no partial data saved. ${e.keyValue ? JSON.stringify(e.keyValue) : ""}` };
    }
    return { success: false, error: `Bulk import failed: ${e.message}. Transaction rolled back — no partial data saved.` };
  } finally {
    session.endSession();
  }
}
