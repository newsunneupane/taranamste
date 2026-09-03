"use client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Compulsory: amount*, head*, date* — type locked EXPENSE. Description is OPTIONAL.
// Head = name only (case-insensitive, must already exist — strict). No money account.

export interface BulkTemplateAccount {
  _id: string;
  name: string;
  code: string;
  subType: string[];
}
export interface BulkTemplateCategory {
  _id: string;
  name: string;
  identifier: string;
}

const COLS = ["Date* BS/AD (YYYY-MM-DD)", "Head*", "Sub-Head", "Amount (NPR)*", "Vendor Name", "Ref No.", "Description"];
const ROWS_PER_PAGE = 28; // fits landscape A4 with given rowH/header

export async function generateExpenseBulkTemplatePDF(
  accounts: BulkTemplateAccount[],
  categories: BulkTemplateCategory[],
  totalRows: number = 100
) {
  const rows = Math.max(1, Math.min(totalRows, 100));
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form = pdfDoc.getForm();

  const colWeights = [0.14, 0.16, 0.14, 0.12, 0.12, 0.10, 0.22]; // 7 cols: Date, Head, SubHead, Amount, Vendor, Ref, Desc

  const totalPages = Math.ceil(rows / ROWS_PER_PAGE);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();
    let y = height - 30;

    // Header on first page only (full), subsequent pages compact
    if (pageIdx === 0) {
      page.drawText("Tara Namaste — Expense Bulk Upload Template (100 rows)", {
        x: 24, y, size: 13, font: fontBold, color: rgb(0.09, 0.09, 0.12),
      });
      y -= 12;
      page.drawText("Instructions: 1) Fill ONLY EXPENSE rows.  2) Compulsory *.  3) Date BS or AD (YYYY-MM-DD, e.g. 2082-05-17).  4) Head/Sub-Head = name only (case-insensitive, must already exist in Finance → Chart of Accounts, e.g. Food).  5) Save PDF and upload via Finance > Bulk Upload (multifile 15 MB).", {
        x: 24, y, size: 6, font, color: rgb(0.35, 0.35, 0.38), maxWidth: width - 48,
      });
      y -= 8;
      page.drawText("Compulsory *: Amount > 0, Head (must exist), Date (BS or AD). Description optional. Head/Sub-Head strict, case-insensitive. Empty rows ignored.", {
        x: 24, y, size: 6, font: fontBold, color: rgb(0.7, 0.15, 0.15),
      });
      y -= 10;
    } else {
      page.drawText(`Tara Namaste — Expense Bulk Upload (page ${pageIdx + 1}/${totalPages})`, {
        x: 24, y, size: 9, font: fontBold, color: rgb(0.09, 0.09, 0.12),
      });
      y -= 8;
    }

    const margin = 24;
    const tableWidth = width - margin * 2;
    const colWidths = colWeights.map(w => w * tableWidth);
    const colX: number[] = [];
    let acc = margin;
    for (const w of colWidths) { colX.push(acc); acc += w; }
    const rowH = 16;
    const headerH = 18;

    page.drawRectangle({ x: margin, y: y - headerH + 8, width: tableWidth, height: headerH, color: rgb(0.06, 0.09, 0.16) });
    COLS.forEach((c, i) => {
      page.drawText(c, { x: colX[i] + 4, y: y - 1, size: 5.8, font: fontBold, color: rgb(1, 1, 1), maxWidth: colWidths[i] - 8 });
    });
    y -= headerH - 2;

    const startRow = pageIdx * ROWS_PER_PAGE;
    const endRow = Math.min(rows, startRow + ROWS_PER_PAGE);

    for (let r = startRow; r < endRow; r++) {
      const localIdx = r - startRow;
      const rowY = y - localIdx * rowH;
      if (r % 2 === 0) page.drawRectangle({ x: margin, y: rowY - 2, width: tableWidth, height: rowH, color: rgb(0.98, 0.98, 0.99) });
      page.drawRectangle({ x: margin, y: rowY - 2, width: tableWidth, height: rowH, borderColor: rgb(0.86, 0.88, 0.90), borderWidth: 0.6 });
      colX.forEach((x, i) => {
        if (i === 0) return;
        page.drawLine({ start: { x, y: rowY - 2 }, end: { x, y: rowY - 2 + rowH }, thickness: 0.5, color: rgb(0.86, 0.88, 0.90) });
      });
      page.drawText(String(r + 1), { x: margin + 2, y: rowY + 4, size: 5, font, color: rgb(0.5, 0.5, 0.55) });

      const fields = [
        { name: `date_${r}` },
        { name: `account_${r}` }, // Head
        { name: `subType_${r}` },
        { name: `amount_${r}` },
        { name: `vendor_${r}` },
        { name: `ref_${r}` },
        { name: `desc_${r}` },
      ];
      fields.forEach((f, ci) => {
        const tf = form.createTextField(f.name);
        tf.addToPage(page, { x: colX[ci] + 14, y: rowY + 1, width: colWidths[ci] - 18, height: rowH - 5 });
        (tf as any).updateAppearances?.(font);
      });
    }

    // footer
    page.drawText(`Rows ${startRow + 1}-${endRow} of ${rows} | Type: EXPENSE | Upload: Finance > Bulk Upload (multifile, 15 MB max)`, {
      x: margin, y: 16, size: 5.5, font, color: rgb(0.45, 0.45, 0.48)
    });
    page.drawText(`Page ${pageIdx + 1}/${totalPages} — Generated: ${new Date().toLocaleString()}`, { x: width - 210, y: 16, size: 5.5, font, color: rgb(0.45, 0.45, 0.48) });
  }

  // Reference page — Head names only (case-insensitive, must exist)
  const refPage = pdfDoc.addPage([595, 842]);
  let ry = 800;
  const fontSmall = font;
  refPage.drawText("Reference — Existing Heads (must already exist, case-insensitive)", { x: 24, y: ry, size: 10, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
  ry -= 12;
  refPage.drawText("Column 2: Head name only (e.g. Food). Must match an existing Head (Finance → Chart of Accounts). Sub-Head must already exist under that Head. Description optional.", { x: 24, y: ry, size: 6.5, font: fontSmall, color: rgb(0.35, 0.35, 0.38) });
  ry -= 14;
  refPage.drawText("Existing Expense Heads (name / sub-heads)", { x: 24, y: ry, size: 7.5, font: fontBold, color: rgb(0.09, 0.09, 0.12) });
  ry -= 8;
  const drawAccounts = accounts.filter(a => a.name);
  for (const a of drawAccounts.slice(0, 80)) {
    if (ry < 40) break;
    const subs = (a.subType || []).join(", ") || "—";
    const line = `${a.name}  |  Sub: ${subs}`;
    refPage.drawText(line, { x: 26, y: ry, size: 6, font: fontSmall, color: rgb(0.2, 0.2, 0.22), maxWidth: 545 });
    ry -= 10;
  }
  if (categories.length) {
    ry -= 6;
    refPage.drawText("Money Accounts (reference only — not in this PDF)", { x: 24, y: ry, size: 7.5, font: fontBold, color: rgb(0.09, 0.09, 0.12) });
    ry -= 8;
    for (const c of categories.slice(0, 40)) {
      if (ry < 30) break;
      refPage.drawText(`${c.name} (${c.identifier})`, { x: 26, y: ry, size: 6, font: fontSmall, color: rgb(0.2, 0.2, 0.22) });
      ry -= 10;
    }
  }
  refPage.drawText("Unknown Head/Sub-Head will be rejected — create them in Finance → Chart of Accounts first (case-insensitive). Download fresh template after creating heads.", {
    x: 24, y: 22, size: 5.5, font: fontSmall, color: rgb(0.45, 0.45, 0.48)
  });

  // ensure appearances
  try { form.updateFieldAppearances(font); } catch {}

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Expense_Bulk_Template_100_${new Date().toISOString().slice(0,10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
