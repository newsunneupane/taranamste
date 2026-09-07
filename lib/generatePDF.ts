import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportOptions {
    title: string;
    subtitle?: string;
    filename: string;
    headers: string[][];
    data: any[][];
    summaryLabel?: string;
    summaryValue?: string | number;
    colorCodeAmount?: boolean;
}

export const generateStandardPDF = ({
    title,
    subtitle,
    filename,
    headers,
    data,
    summaryLabel,
    summaryValue,
    colorCodeAmount = false
}: ReportOptions) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // 1. Branding Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Dark slate
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle || `Report generated on ${date}`, 14, 30);

    // 2. Summary Card (if provided)
    if (summaryLabel) {
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 35, 182, 18, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "bold");
        doc.text(`${summaryLabel}: ${summaryValue}`, 20, 46);
    }

    // 3. Table
    autoTable(doc, {
        startY: summaryLabel ? 60 : 40,
        head: headers,
        body: data,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: (cellData) => {
            if (colorCodeAmount && cellData.section === 'body') {
                const text = cellData.cell.text[0];
                if (text.startsWith('+')) cellData.cell.styles.textColor = [5, 150, 105];
                if (text.startsWith('-')) cellData.cell.styles.textColor = [220, 38, 38];
            }
        }
    });

    doc.save(`${filename}.pdf`);
};

export const generateAccountsPDF = (accounts: any[]) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Chart of Accounts (खता सूची)", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableData = accounts.map(acc => [
        acc.code,
        acc.name,
        acc.type,
        acc.description || '-'
    ]);

    autoTable(doc, {
        startY: 35,
        head: [['Code', 'Account Name', 'Type', 'Description']],
        body: tableData,
        headStyles: { fillColor: [63, 63, 70] }, // Zinc-700
        styles: { fontSize: 8 },
    });

    doc.save("Chart_of_Accounts.pdf");
};