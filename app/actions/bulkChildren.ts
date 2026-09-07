"use server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Child from "@/models/Child";
import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/guards";
import {
  parseChildBulkExcel,
  validateBulkChildRow,
  norm,
  parseBsOrAdDate,
  isoToSlash,
  normalizeGender,
  normalizeStatus,
  normalizeBloodType,
  normalizeArrivalCategory,
} from "@/lib/childBulkParser";

type ParseResult = {
  success: boolean;
  error?: string;
  rows?: any[];
  validCount?: number;
  invalidCount?: number;
};

export async function parseBulkChildrenAction(_prev: any, formData: FormData): Promise<ParseResult> {
  const w = await requireWrite("/children");
  if (!(w as any).ok) return { success: false, error: (w as any).error };

  const filesAll = formData.getAll("files") as File[];
  const single = formData.get("file") as File | null;
  const files: File[] = (filesAll && filesAll.length ? filesAll : (single ? [single] : [])) as File[];
  if (!files.length) return { success: false, error: "No file uploaded. Please select an Excel file (.xlsx)." };

  let totalSize = 0;
  const allowedExcel = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
  ];
  for (const f of files) {
    if (!f) continue;
    const isExcel = allowedExcel.includes(f.type) || f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls");
    if (!isExcel) return { success: false, error: `Only Excel allowed — got ${f.type || "unknown"} for ${f.name}. Please download the template and upload .xlsx` };
    if (f.size > 15 * 1024 * 1024) return { success: false, error: `${f.name} too large (max 15 MB)` };
    if (f.size === 0) return { success: false, error: `${f.name} is empty` };
    totalSize += f.size;
  }
  if (totalSize > 30 * 1024 * 1024) return { success: false, error: "Total upload too large (max 30 MB across files)" };

  let rawRows: any[] = [];
  try {
    for (const f of files) {
      const buf = await f.arrayBuffer();
      const rows = await parseChildBulkExcel(buf);
      rows.forEach((r: any) => (r._sourceFile = f.name));
      rawRows = rawRows.concat(rows);
    }
  } catch (e: any) {
    return { success: false, error: "Failed to parse Excel: " + (e.message || "unknown") + ". Please use the downloaded template (Children_Bulk_100.xlsx)." };
  }

  if (!rawRows.length) return { success: false, error: "No filled rows found across files. Fill the template (keep header row) then upload." };
  if (rawRows.length > 1000) return { success: false, error: `Too many rows (${rawRows.length}). Max 1000 per bulk upload — split across files.` };

  // Validate each row, build preview (read-only — no DB writes, no transaction needed)
  const rows = rawRows.map((r) => {
    const baseError = validateBulkChildRow(r);
    const errors: string[] = [];
    if (baseError) errors.push(baseError);

    const genderNorm = normalizeGender(r.gender);
    const statusNorm = normalizeStatus(r.status);
    const bloodNorm = normalizeBloodType(r.bloodType);
    const arrivalNorm = normalizeArrivalCategory(r.arrivalCategory);

    const dobParsed = parseBsOrAdDate(r.dateOfBirth);
    const admParsed = r.admissionDate && String(r.admissionDate).trim() ? parseBsOrAdDate(r.admissionDate) : null;

    const dobAdIso = dobParsed.adIso || r.dateOfBirth;
    const admAdIso = admParsed?.adIso || (r.admissionDate ? r.admissionDate : null);
    const dobSlash = dobParsed.adIso ? isoToSlash(dobParsed.adIso) : r.dateOfBirth;
    const admSlash = admParsed?.adIso ? isoToSlash(admParsed.adIso) : (r.admissionDate ? r.admissionDate : "— (today)");

    return {
      ...r,
      _originalDob: r.dateOfBirth,
      _originalAdm: r.admissionDate,
      _wasBsDob: dobParsed.wasBs,
      _wasBsAdm: admParsed?.wasBs || false,
      dobAdIso,
      admAdIso,
      dobSlash,
      admSlash,
      dobDisplay: dobParsed.wasBs ? `${r.dateOfBirth} (BS→${dobSlash})` : dobSlash,
      admDisplay: admParsed ? (admParsed.wasBs ? `${r.admissionDate} (BS→${admSlash})` : admSlash) : (r.admissionDate ? r.admissionDate : "— (today)"),
      genderNorm,
      statusNorm: statusNorm || "IN_CARE",
      bloodNorm: bloodNorm || "",
      arrivalNorm: arrivalNorm || "OTHER",
      errors,
      isValid: errors.length === 0,
    };
  });

  const validCount = rows.filter((r: any) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return { success: true, rows, validCount, invalidCount };
}

/**
 * COMMIT — Atomic database transaction
 * ───────────────────────────────────
 * All writes happen inside a single MongoDB transaction (mongoose session).
 * • Duplicate check (within upload + against DB) runs BEFORE any insert.
 * • All Child.insertMany batches share the SAME session/transaction.
 * • If ANY batch fails validation/duplicate/key error, the transaction is
 *   aborted → database state is exactly as before (zero partial writes).
 * • Errors bubble to the client as `error` with "Transaction rolled back — no partial data saved."
 */
export async function commitBulkChildrenAction(_prev: any, formData: FormData) {
  const w = await requireWrite("/children");
  if (!(w as any).ok) return { success: false, error: (w as any).error };

  const payloadRaw = formData.get("payload") as string | null;
  if (!payloadRaw) return { success: false, error: "No payload — please Parse & Preview first." };

  let rows: any[];
  try {
    rows = JSON.parse(payloadRaw);
  } catch {
    return { success: false, error: "Invalid payload." };
  }

  const validRows = rows.filter((r: any) => r.isValid);
  if (!validRows.length) return { success: false, error: "No valid rows to import. Fix errors and re-parse." };
  if (validRows.length > 500) return { success: false, error: "Too many rows (max 500). Split across uploads." };

  // Re-validate server-side (payload could be tampered)
  for (const r of validRows) {
    const err = validateBulkChildRow(r);
    if (err) return { success: false, error: `Row ${r.rowIndex + 1} became invalid: ${err}. No data was saved.` };
  }

  // 1) Duplicate within upload — no DB needed, fail fast (no transaction yet)
  const keyFor = (r: any) => {
    const fn = norm(r.firstName);
    const ln = norm(r.lastName);
    const dob = String(r.dobAdIso || r.dateOfBirth || "").trim();
    return `${fn}|${ln}|${dob}`;
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
      .map(([, arr]) => {
        const sample = validRows[arr[0]];
        const locs = arr.map(i => {
          const rr = validRows[i];
          return `row ${rr.rowIndex + 1}${rr._sourceFile ? ` (${rr._sourceFile})` : ""}`;
        }).join(", ");
        const dobSlash = (sample as any).dobSlash || isoToSlash(sample.dobAdIso) || sample.dateOfBirth;
        return `Duplicate ${arr.length}× — ${sample.firstName} ${sample.lastName} | DOB ${dobSlash} — at ${locs}`;
      })
      .join("; ");
    return {
      success: false,
      error: `Duplicate rows found within upload (${dupGroups.length} duplicate group(s)). ${details}. Please remove duplicates and re-upload. No data was saved (transaction not started).`,
    };
  }

  await dbConnect();
  const session = await mongoose.startSession();

  // Options ensure atomicity + majority durability
  const txnOptions: any = {
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary" as const,
  };

  try {
    let inserted = 0;

    await session.withTransaction(async () => {
      // 2) Duplicate against DB — must run INSIDE transaction (same snapshot)
      let existingKeys = new Set<string>();
      if (validRows.length) {
        const dates = validRows.map(r => new Date(r.dobAdIso));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime()))); minDate.setHours(0, 0, 0, 0);
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime()))); maxDate.setHours(23, 59, 59, 999);
        const existing = await Child.find({
          dateOfBirth: { $gte: minDate, $lte: maxDate },
        })
          .session(session)
          .lean();

        for (const ch of existing) {
          const d = new Date((ch as any).dateOfBirth).toISOString().slice(0, 10);
          const fn = norm((ch as any).firstName);
          const ln = norm((ch as any).lastName);
          existingKeys.add(`${fn}|${ln}|${d}`);
        }
      }

      const dbDups: string[] = [];
      for (const r of validRows) {
        const k = keyFor(r);
        if (existingKeys.has(k)) {
          const slash = (r as any).dobSlash || isoToSlash(r.dobAdIso) || r.dobAdIso;
          dbDups.push(`row ${r.rowIndex + 1}${r._sourceFile ? ` (${r._sourceFile})` : ""}: ${r.firstName} ${r.lastName} | DOB ${slash}`);
        }
      }
      if (dbDups.length) {
        // Throwing inside withTransaction automatically aborts — zero writes
        throw new Error(
          `Duplicate with existing database records (${dbDups.length} row(s) already exist). ${dbDups.slice(0, 5).join("; ")}${dbDups.length > 5 ? ` (+${dbDups.length - 5} more)` : ""}. No data was saved (transaction rolled back).`
        );
      }

      // 3) Build docs (still inside txn — no writes yet)
      const docs = validRows.map((r: any) => {
        const dobIso = r.dobAdIso;
        const admIso = r.admAdIso && r.admAdIso !== "— (today)" && String(r.admAdIso).trim() ? r.admAdIso : null;
        const genderNorm = normalizeGender(r.gender) || "OTHER";
        const statusNorm = normalizeStatus(r.status) || "IN_CARE";
        const bloodNorm = normalizeBloodType(r.bloodType) || undefined;
        const arrivalNorm = normalizeArrivalCategory(r.arrivalCategory) || "OTHER";
        return {
          firstName: String(r.firstName).trim(),
          lastName: String(r.lastName).trim(),
          gender: genderNorm,
          dateOfBirth: new Date(dobIso),
          admissionDate: admIso ? new Date(admIso) : new Date(),
          status: statusNorm,
          bloodType: bloodNorm || undefined,
          allergies: r.allergies ? String(r.allergies).trim() : undefined,
          schoolName: r.schoolName ? String(r.schoolName).trim() : undefined,
          gradeLevel: r.gradeLevel ? String(r.gradeLevel).trim() : undefined,
          arrivalCategory: arrivalNorm,
          arrivalDetails: r.arrivalDetails ? String(r.arrivalDetails).trim() : undefined,
          medicalNotes: r.medicalNotes ? String(r.medicalNotes).trim() : undefined,
          gallery: [],
          documents: [],
        };
      });

      // 4) All inserts share the SAME transaction — any failure aborts whole txn
      const BATCH = 250;
      for (let i = 0; i < docs.length; i += BATCH) {
        const chunk = docs.slice(i, i + BATCH);
        // ordered:true → first error stops; unordered would hide partial failures
        await Child.insertMany(chunk, { ordered: true, session } as any);
      }
      inserted = docs.length;
      // withTransaction will commit if this fn succeeds; it auto-retries on transient errors
    }, txnOptions);

    // Only revalidate after committed txn
    revalidatePath("/children");
    return { success: true, inserted, error: undefined };
  } catch (e: any) {
    // withTransaction already aborted — guarantee zero partial writes
    // Do NOT revalidatePath on failure (keeps stale cache = before state)

    // Duplicate-key error from Mongo unique index (defense-in-depth)
    if (e?.code === 11000) {
      const field = Object.keys(e.keyPattern || e.keyValue || {})[0] || "record";
      return {
        success: false,
        error: `Database duplicate key on ${field}: ${e.message}. Transaction rolled back — no partial data saved. Database state unchanged. ${e.keyValue ? JSON.stringify(e.keyValue) : ""}`,
      };
    }

    // If we threw our own duplicate-against-DB error inside txn, it arrives here
    if (e?.message?.includes("Duplicate with existing")) {
      return { success: false, error: e.message };
    }

    // Transient transaction errors (e.g., WriteConflict, network) — already aborted
    const msg = e?.errorLabels?.includes("TransientTransactionError")
      ? `${e.message} (transient — please retry). Transaction rolled back — no partial data saved.`
      : `${e.message}. Transaction rolled back — no partial data saved. Database state unchanged.`;

    console.error("[bulkChildren] transaction aborted:", e);
    return { success: false, error: `Bulk import failed: ${msg}` };
  } finally {
    await session.endSession();
  }
}
