"use client";
import * as XLSX from "xlsx";
import { todayBs, formatBs } from "@itzsa/bs-date";

// Spreadsheet-style Excel template: 100 blank rows, copy-paste friendly
// Columns: Date* (YYYY-MM-DD) | Head* | Sub-Head | Amount (NPR)* | Vendor | Ref | Description (optional)
// Head/Sub-Head case-insensitive, must already exist (strict). Money Account removed. Description optional.

export interface BulkExcelAccount {
  _id: string;
  name: string;
  code: string;
  subType: string[];
}
export interface BulkExcelCategory {
  _id: string;
  name: string;
  identifier: string;
}

const HEADERS = ["Date* BS/AD (YYYY-MM-DD)", "Head*", "Sub-Head", "Amount (NPR)*", "Vendor Name", "Ref No.", "Description"];
const ROWS = 100;

export function generateExpenseBulkExcel(
  accounts: BulkExcelAccount[],
  categories: BulkExcelCategory[]
) {
  const workbook = XLSX.utils.book_new();

  // 1. Build data rows: example row uses BS today to show BS is allowed
  const exampleDate = (() => {
    try {
      const bs = todayBs();
      return formatBs(bs, "YYYY-MM-DD", { locale: "en" });
    } catch { return new Date().toISOString().slice(0, 10); }
  })();
  const exampleHead = accounts.find(a => a.name)?.name || accounts[0]?.name || "Food";
  const exampleSub = accounts.find(a => a.name === exampleHead)?.subType?.[0] || "";

  const data: any[][] = [];

  // row 0: headers
  data.push(HEADERS);

  // row 1: example (highlighted via style hints — we add comment)
  data.push([exampleDate, exampleHead, exampleSub, 2500, "ABC Store", "INV-001", "Lunch for children"]);

  // blank rows for paste (rows 3..101)
  for (let i = 0; i < ROWS; i++) {
    data.push(["", "", "", "", "", "", ""]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // 2. Column widths (wch)
  ws["!cols"] = [
    { wch: 16 }, // Date
    { wch: 20 }, // Head
    { wch: 18 }, // Sub
    { wch: 14 }, // Amount
    { wch: 18 }, // Vendor
    { wch: 12 }, // Ref
    { wch: 30 }, // Desc
  ];

  // 3. Styling headers via !ref? xlsx community doesn't support rich styling without pro, but we can set bold via cell style hack for js viewers
  // Add auto-filter for easy paste
  (ws as any)["!autofilter"] = { ref: `A1:G${ROWS + 2}` };

  // 4. Freeze header row
  (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };

  // 5. Data validation hints: add second sheet as reference
  const refData: any[][] = [];
  refData.push(["Existing Heads (name) — must already exist (strict, case-insensitive) — create via Finance → Chart of Accounts first"]);
  refData.push(["Head Name", "Sub-Heads (comma separated)"]);
  accounts.slice(0, 80).forEach(a => {
    refData.push([a.name, (a.subType || []).join(", ") || "—"]);
  });
  if (categories.length) {
    refData.push([]);
    refData.push(["Money Accounts (reference only — not in this sheet)"]);
    refData.push(["Name", "Identifier"]);
    categories.slice(0, 40).forEach(c => refData.push([c.name, c.identifier]));
  }
  refData.push([]);
  refData.push(["Instructions:"]);
  refData.push(["- Fill ONLY EXPENSE rows. Compulsory: Head, Amount>0, Date BS or AD (YYYY-MM-DD, e.g. 2082-05-17 BS auto-converts to AD). Description optional."]);
  refData.push(["- Head/Sub-Head name only, case-insensitive. Must already exist — create them first. Unknown values will be rejected on upload."]);
  refData.push(["- Copy full rows from your spreadsheet and paste starting at A3 (below example)."]);
  refData.push(["- Keep header row. Upload via Finance > Bulk Upload (multifile .pdf/.xlsx, 15 MB)."]);
  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef["!cols"] = [{ wch: 22 }, { wch: 50 }];

  // 6. Notes sheet: instructions
  XLSX.utils.book_append_sheet(workbook, ws, "Expenses_Bulk_100");
  XLSX.utils.book_append_sheet(workbook, wsRef, "Reference_Heads");

  // 7. Trigger download
  XLSX.writeFile(workbook, `Expense_Bulk_100_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
