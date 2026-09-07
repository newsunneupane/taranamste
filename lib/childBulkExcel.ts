"use client";
import * as XLSX from "xlsx";
import { todayBs, formatBs } from "@itzsa/bs-date";

// Columns for Child bulk upload — mirrors the "Admit Child" form fields
// Required (*): First Name, Last Name, Gender, Date of Birth
// Optional: Admission Date (defaults to today), Status, Blood Type, Allergies,
//           School Name, Grade Level, Arrival Category, Arrival Details, Medical Notes
// BS/AD dates accepted in M/D/YYYY (e.g. 5/22/2083), status & gender enums explained in reference sheet.

const HEADERS = [
  "First Name*",
  "Last Name*",
  "Gender* (MALE/FEMALE/OTHER)",
  "Date of Birth* (BS/AD M/D/YYYY)",
  "Admission Date (BS/AD M/D/YYYY)",
  "Status (IN_CARE/FOSTERED/ADOPTED/REUNITED/GRADUATED)",
  "Blood Type (A+/A-/B+/B-/AB+/AB-/O+/O-)",
  "Allergies",
  "School Name",
  "Grade Level",
  "Arrival Category (POLICE_RESCUE/ABANDONED/FAMILY_SURRENDER/HOSPITAL_REFERRAL/OTHER)",
  "Arrival Details",
  "Medical Notes",
];

const ROWS = 100;

function toSlash(month: number, day: number, year: number): string {
  return `${month}/${day}/${year}`;
}

export function generateChildBulkExcel() {
  const workbook = XLSX.utils.book_new();

  // Example dates — show BS is allowed (today BS) in M/D/YYYY e.g. 5/22/2083
  const exampleDobBs = (() => {
    try {
      const bs = todayBs();
      const dobYear = bs.year - 10;
      return toSlash(bs.month, bs.day, dobYear);
    } catch {
      return "6/15/2015";
    }
  })();
  const exampleAdmitBs = (() => {
    try {
      const bs = todayBs();
      return toSlash(bs.month, bs.day, bs.year);
    } catch {
      const d = new Date();
      return toSlash(d.getMonth() + 1, d.getDate(), d.getFullYear());
    }
  })();

  const data: any[][] = [];

  // row 0: headers
  data.push(HEADERS);

  // row 1: two example rows (diversity + copy-paste sample)
  data.push([
    "Ram",
    "Bahadur",
    "MALE",
    exampleDobBs,
    exampleAdmitBs,
    "IN_CARE",
    "O+",
    "Peanuts",
    "Shree Secondary School",
    "5",
    "ABANDONED",
    "Found near Taranamaste gate, Ward 4",
    "Healthy, no chronic issues",
  ]);
  data.push([
    "Sita",
    "Kumari",
    "FEMALE",
    "3/22/2014",
    "", // leave blank -> defaults to today on import
    "IN_CARE",
    "B+",
    "",
    "Janapath School",
    "3",
    "POLICE_RESCUE",
    "Case No. 2079/112, Baneshwor Police",
    "Mild asthma",
  ]);

  // blank rows for paste (rows 4..103)
  for (let i = 0; i < ROWS; i++) {
    data.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws["!cols"] = [
    { wch: 16 }, // First
    { wch: 16 }, // Last
    { wch: 20 }, // Gender
    { wch: 22 }, // DOB
    { wch: 22 }, // Admission
    { wch: 24 }, // Status
    { wch: 18 }, // Blood
    { wch: 18 }, // Allergies
    { wch: 22 }, // School
    { wch: 12 }, // Grade
    { wch: 28 }, // Arrival Cat
    { wch: 28 }, // Arrival Details
    { wch: 30 }, // Medical Notes
  ];

  // Auto filter & freeze
  (ws as any)["!autofilter"] = { ref: `A1:M${ROWS + 3}` };
  (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Row heights: header a bit taller
  (ws as any)["!rows"] = [{ hpt: 28 }, { hpt: 14 }, { hpt: 14 }];

  // Reference sheet — allowed values, tips, examples
  const ref: any[][] = [];
  ref.push(["🏠 Taranamaste — Children Bulk Upload — Reference & Instructions"]);
  ref.push([]);
  ref.push(["Instructions — READ BEFORE FILLING"]);
  ref.push(["1) Keep the header row (row 1). Do NOT rename headers."]);
  ref.push(["2) Fill from row 2 onward. Example rows (2 & 3) show the format — overwrite or keep them. Empty rows are ignored."]);
  ref.push(["3) Required*: First Name, Last Name, Gender, Date of Birth. Leave other columns blank if not applicable."]);
  ref.push(["4) Dates: BS or AD both accepted as M/D/YYYY — e.g., 5/22/2083 BS (→ AD) or 8/31/2008 AD. Also accepts YYYY-MM-DD. BS years 2070-2100 auto-convert to AD. Use 5/22/2083 format."]);
  ref.push(["5) Admission Date: leave blank to default to today. Or provide BS/AD in M/D/YYYY."]);
  ref.push(["6) Gender: MALE / FEMALE / OTHER (case-insensitive). Variations like 'male', 'F', 'other' are normalized."]);
  ref.push(["7) Status: IN_CARE / FOSTERED / ADOPTED / REUNITED / GRADUATED (defaults to IN_CARE if blank)."]);
  ref.push(["8) Blood Type: A+ / A- / B+ / B- / AB+ / AB- / O+ / O- (or leave blank)."]);
  ref.push(["9) Arrival Category: POLICE_RESCUE / ABANDONED / FAMILY_SURRENDER / HOSPITAL_REFERRAL / OTHER (or blank → OTHER)."]);
  ref.push(["10) School / Grade / Allergies / Details / Medical Notes: free text, optional."]);
  ref.push(["11) Copy-paste friendly: select rows from your sheet and paste starting at A2. 100 blank rows included; add more if needed (up to 500 rows per upload)."]);
  ref.push(["12) Upload via Children → Bulk Upload (top-right) or inside Admit Child → Bulk tab. Supports .xlsx / .xls up to 15 MB, 500 rows max."]);
  ref.push(["13) Duplicates blocked: same First + Last + DOB is considered duplicate (within file & against existing records)."]);
  ref.push([]);
  ref.push(["— Allowed Values Detail —"]);
  ref.push(["Field", "Allowed Values", "Notes"]);
  ref.push(["Gender*", "MALE, FEMALE, OTHER", "Required. Case-insensitive; M->MALE, F->FEMALE accepted"]);
  ref.push(["Status", "IN_CARE, FOSTERED, ADOPTED, REUNITED, GRADUATED", "Blank = IN_CARE"]);
  ref.push(["Blood Type", "A+, A-, B+, B-, AB+, AB-, O+, O-", "Blank = not set"]);
  ref.push(["Arrival Category", "POLICE_RESCUE, ABANDONED, FAMILY_SURRENDER, HOSPITAL_REFERRAL, OTHER", "Blank = OTHER"]);
  ref.push(["Date of Birth*", "M/D/YYYY (BS 2070-2100 or AD)", "Example: 3/15/2065 (BS → AD) or 6/15/2008 (AD)"]);
  ref.push(["Admission Date", "M/D/YYYY (BS/AD) or blank", "Example: 5/22/2083 BS or 9/07/2026 AD — blank = today"]);
  ref.push([]);
  ref.push(["Tips"]);
  ref.push(["• Use Nepali BS dates naturally — e.g., type 5/22/2083 and it will convert to AD on import. Preview shows 5/22/2083 (BS→AD) conversion. Excel display is M/D/YYYY."]);
  ref.push(["• Keep First + Last + DOB unique. If you re-upload the same child, it will be flagged as duplicate."]);
  ref.push(["• For very long Medical Notes / Details, you can use line breaks inside the cell (Alt+Enter in Excel)."]);
  ref.push(["• If a row shows 'Invalid' after upload, fix the highlighted error and re-upload only the failed rows (or all)."]);

  const wsRef = XLSX.utils.aoa_to_sheet(ref);
  wsRef["!cols"] = [{ wch: 22 }, { wch: 60 }, { wch: 40 }];

  XLSX.utils.book_append_sheet(workbook, ws, "Children_Bulk_100");
  XLSX.utils.book_append_sheet(workbook, wsRef, "Instructions");

  // Trigger download
  const fname = `Children_Bulk_100_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fname);
}
