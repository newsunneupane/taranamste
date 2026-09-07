import * as XLSX from "xlsx";
import { bsToAdParts, isValidBsDate } from "@itzsa/bs-date";

export interface RawChildBulkRow {
  rowIndex: number; // 0-based among data rows (header=0)
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // raw input, may be BS
  admissionDate: string;
  status: string;
  bloodType: string;
  allergies: string;
  schoolName: string;
  gradeLevel: string;
  arrivalCategory: string;
  arrivalDetails: string;
  medicalNotes: string;
  _sourceFile?: string;
}

// BS / AD flexible date handling — supports ISO (YYYY-MM-DD) and slash (M/D/YYYY or MM/DD/YYYY)
// Display format for UI/Excel is M/D/YYYY e.g. 5/22/2083 (like 2083-22-05 → 5/22/2083 request)
const pad2 = (n: number) => String(n).padStart(2, "0");

export function isoToSlash(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return String(iso);
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  return `${mo}/${d}/${y}`;
}

export function slashToDisplay(slash: string): string { return String(slash).trim(); }

function parseBsOrAdDate(input: string | Date): { adIso: string | null; wasBs: boolean; error?: string } {
  if (input == null) return { adIso: null, wasBs: false };
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return { adIso: null, wasBs: false, error: "Invalid Date object" };
    const y = input.getFullYear();
    const m = input.getMonth() + 1;
    const d = input.getDate();
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
  // normalize: allow both YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY
  const norm = s.replace(/[.\s]+/g, "").replace(/\//g, "-").replace(/\./g, "-");
  // Ensure we split on - after replacing slashes/dots
  const partsRaw = norm.split("-").filter(Boolean);
  // Also handle original containing / without conversion edge: fallback split on /
  let parts = partsRaw;
  if (parts.length !== 3) {
    const alt = String(s).trim().split(/[\/\-\.]/).filter(Boolean);
    if (alt.length === 3) parts = alt;
  }
  if (parts.length !== 3) return { adIso: null, wasBs: false, error: `Date must be M/D/YYYY (e.g. 5/22/2083) or YYYY-MM-DD, got "${s}"` };
  let y: number, m: number, d: number;
  // Detect format by where the 4-digit year sits
  if (parts[0].length === 4 && Number(parts[0]) >= 1000) {
    // YYYY-MM-DD or YYYY/MM/DD
    y = Number(parts[0]); m = Number(parts[1]); d = Number(parts[2]);
  } else if (parts[2].length === 4 && Number(parts[2]) >= 1000) {
    // M/D/YYYY or MM/DD/YYYY  → 5/22/2083
    m = Number(parts[0]); d = Number(parts[1]); y = Number(parts[2]);
  } else {
    return { adIso: null, wasBs: false, error: `Date must be M/D/YYYY (e.g. 5/22/2083), got "${s}"` };
  }
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return { adIso: null, wasBs: false, error: `Invalid date "${s}"` };
  }
  if (m < 1 || m > 12 || d < 1 || d > 32) {
    return { adIso: null, wasBs: false, error: `Invalid date "${s}"` };
  }
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
  const adIso = `${y}-${pad2(m)}-${pad2(d)}`;
  const dt = new Date(adIso);
  if (isNaN(dt.getTime())) return { adIso: null, wasBs: false, error: `Invalid AD date "${s}"` };
  // overflow guard
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d) {
    const strict = new Date(`${adIso}T00:00:00`);
    if (isNaN(strict.getTime()) || strict.getFullYear() !== y) {
      return { adIso: null, wasBs: false, error: `Invalid AD date "${s}"` };
    }
  }
  return { adIso, wasBs: false };
}

export { parseBsOrAdDate };

export function parseDateToAdIso(input: string | Date): string | null {
  const r = parseBsOrAdDate(input);
  return r.adIso;
}

export function norm(s: string): string {
  return String(s || "").trim().toLowerCase();
}

// Normalizers for enums
export function normalizeGender(raw: string): string | null {
  const n = norm(raw);
  if (!n) return null;
  if (["male", "m", "man", "boy"].includes(n)) return "MALE";
  if (["female", "f", "woman", "girl"].includes(n)) return "FEMALE";
  if (["other", "o", "others", "non-binary", "nonbinary"].includes(n)) return "OTHER";
  // already uppercase? check
  const up = raw.trim().toUpperCase();
  if (["MALE", "FEMALE", "OTHER"].includes(up)) return up;
  return null;
}

export function normalizeStatus(raw: string): string | null {
  if (!raw || !String(raw).trim()) return "IN_CARE"; // default
  const up = String(raw).trim().toUpperCase().replace(/\s+/g, "_");
  const allowed = ["IN_CARE", "FOSTERED", "ADOPTED", "REUNITED", "GRADUATED"];
  if (allowed.includes(up)) return up;
  // synonyms: IN CARE -> IN_CARE already handled
  return null;
}

export function normalizeBloodType(raw: string): string | null {
  if (!raw || !String(raw).trim()) return "";
  const up = String(raw).trim().toUpperCase().replace(/\s+/g, "");
  const allowed = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  if (allowed.includes(up)) return up;
  return null; // signals invalid
}

export function normalizeArrivalCategory(raw: string): string | null {
  if (!raw || !String(raw).trim()) return "OTHER";
  const up = String(raw).trim().toUpperCase().replace(/[\s-]+/g, "_");
  const allowed = ["POLICE_RESCUE", "ABANDONED", "FAMILY_SURRENDER", "HOSPITAL_REFERRAL", "OTHER"];
  if (allowed.includes(up)) return up;
  // forgiving: POLICE -> POLICE_RESCUE etc? keep strict
  return null;
}

export function validateBulkChildRow(row: RawChildBulkRow): string | null {
  if (!row.firstName || !String(row.firstName).trim()) return 'First Name is required';
  if (!row.lastName || !String(row.lastName).trim()) return 'Last Name is required';
  if (!row.gender || !String(row.gender).trim()) return 'Gender is required (MALE/FEMALE/OTHER)';
  const g = normalizeGender(row.gender);
  if (!g) return `Invalid Gender "${row.gender}" — use MALE, FEMALE or OTHER`;
  if (!row.dateOfBirth || !String(row.dateOfBirth).trim()) return 'Date of Birth is required (BS or AD, M/D/YYYY e.g. 5/22/2083)';
  const dobParsed = parseBsOrAdDate(row.dateOfBirth);
  if (!dobParsed.adIso) return dobParsed.error || `Invalid Date of Birth "${row.dateOfBirth}" (use 5/22/2083 BS e.g. 5/22/2065 or 8/31/2008 AD)`;
  // DOB not in future
  const dobDate = new Date(dobParsed.adIso);
  const today = new Date(); today.setHours(0,0,0,0);
  if (dobDate > today) return `Date of Birth "${row.dateOfBirth}" cannot be in the future`;
  // Admission date optional but if present must be valid and >= DOB
  if (row.admissionDate && String(row.admissionDate).trim()) {
    const admParsed = parseBsOrAdDate(row.admissionDate);
    if (!admParsed.adIso) return admParsed.error || `Invalid Admission Date "${row.admissionDate}"`;
    const admDate = new Date(admParsed.adIso);
    if (admDate < dobDate) return `Admission Date "${row.admissionDate}" cannot be before Date of Birth`;
  }
  if (row.status && String(row.status).trim()) {
    if (!normalizeStatus(row.status) || normalizeStatus(row.status) === null) {
      // normalizeStatus returns IN_CARE for blank, but if raw provided & not in allowed returns null
      const up = String(row.status).trim().toUpperCase();
      if (!["IN_CARE","FOSTERED","ADOPTED","REUNITED","GRADUATED"].includes(up.replace(/\s+/g,"_"))) {
        return `Invalid Status "${row.status}" — allowed: IN_CARE, FOSTERED, ADOPTED, REUNITED, GRADUATED`;
      }
    }
  }
  if (row.bloodType && String(row.bloodType).trim()) {
    const bt = normalizeBloodType(row.bloodType);
    if (bt === null) return `Invalid Blood Type "${row.bloodType}" — allowed: A+, A-, B+, B-, AB+, AB-, O+, O-`;
  }
  if (row.arrivalCategory && String(row.arrivalCategory).trim()) {
    if (!normalizeArrivalCategory(row.arrivalCategory)) {
      return `Invalid Arrival Category "${row.arrivalCategory}" — allowed: POLICE_RESCUE, ABANDONED, FAMILY_SURRENDER, HOSPITAL_REFERRAL, OTHER`;
    }
  }
  // Name length guards
  if (String(row.firstName).trim().length > 60) return 'First Name too long (max 60 chars)';
  if (String(row.lastName).trim().length > 60) return 'Last Name too long (max 60 chars)';
  return null;
}

export async function parseChildBulkExcel(buffer: ArrayBuffer): Promise<RawChildBulkRow[]> {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];
  const rowsJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  if (rowsJson.length < 2) return [];

  // Detect header row index by searching for header keyword
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rowsJson.length, 3); i++) {
    const r = rowsJson[i] as any[];
    const joined = (r || []).join(" ").toLowerCase();
    if (joined.includes("first name") || joined.includes("first name*")) { headerIdx = i; break; }
  }

  const out: RawChildBulkRow[] = [];
  for (let i = headerIdx + 1; i < rowsJson.length; i++) {
    const r = rowsJson[i] as any[];
    if (!r || r.length === 0) continue;
    // Helper to get col safely
    const get = (idx: number) => {
      let v = r[idx];
      if (v == null) return "";
      // xlsx with cellDates:true may give Date object; but sheet_to_json with raw:false gives string. Still handle.
      if ((v as any) instanceof Date) return (v as any).toISOString().slice(0, 10);
      return String(v).trim();
    };
    const firstName = get(0);
    const lastName = get(1);
    const gender = get(2);
    let dateOfBirth = get(3);
    let admissionDate = get(4);
    const status = get(5);
    const bloodType = get(6);
    const allergies = get(7);
    const schoolName = get(8);
    const gradeLevel = get(9);
    const arrivalCategory = get(10);
    const arrivalDetails = get(11);
    const medicalNotes = get(12);

    // handle Date objects if still Date-like via fallback check
    if ((dateOfBirth as any) instanceof Date) dateOfBirth = (dateOfBirth as any).toISOString().slice(0,10);
    if ((admissionDate as any) instanceof Date) admissionDate = (admissionDate as any).toISOString().slice(0,10);

    if (!firstName && !lastName && !gender && !dateOfBirth && !admissionDate && !status && !bloodType && !allergies && !schoolName && !gradeLevel && !arrivalCategory && !arrivalDetails && !medicalNotes) continue;
    // skip echo header if someone pasted header again
    if (norm(firstName) === "first name*" || norm(firstName) === "first name") continue;

    out.push({
      rowIndex: i - headerIdx - 1,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      admissionDate,
      status,
      bloodType,
      allergies,
      schoolName,
      gradeLevel,
      arrivalCategory,
      arrivalDetails,
      medicalNotes,
    });
  }
  return out;
}
