import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Expense } from "../types";

// Use unpkg for better raw file availability for this font
const FONT_URL = 'https://unpkg.com/fireflysung@1.0.0/FireflySung.ttf';
const FONT_NAME = 'FireflySung';

const loadChineseFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    const response = await fetch(FONT_URL, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise<boolean>((resolve) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.includes(',')) {
          const base64data = result.split(',')[1];
          doc.addFileToVFS('FireflySung.ttf', base64data);
          doc.addFont('FireflySung.ttf', FONT_NAME, 'normal');
          doc.setFont(FONT_NAME);
          console.log('Chinese font loaded successfully');
          resolve(true);
        } else {
          console.warn('Failed to parse font data');
          resolve(false);
        }
      };
      reader.onerror = () => {
        console.warn('FileReader error reading font');
        resolve(false);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Warning: Could not load Chinese font. PDF will use standard fonts.', error);
    // Return false so we know to use the fallback font
    return false;
  }
};

export const generateExpenseReportPDF = async (expenses: Expense[], reportName: string, totalAmount: number) => {
  const doc = new jsPDF();
  
  // Load font for Chinese support
  const fontLoaded = await loadChineseFont(doc);

  const brandGreen = [0, 209, 111] as [number, number, number];

  // Title Section
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  // If font loaded, we can use it here too, otherwise default (Helvetica)
  if (fontLoaded) doc.setFont(FONT_NAME); 
  doc.text("Expense Report Summary", 14, 20);

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Name: ${reportName}`, 14, 30);
  doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 35);
  
  // Total Amount Highlight
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Reimbursement: CNY ¥${totalAmount.toFixed(2)}`, 14, 50);

  // Table Data Preparation
  const tableBody = expenses.map(expense => [
    new Date(expense.date).toLocaleDateString(),
    expense.merchant,
    expense.category || 'Uncategorized',
    expense.currency,
    expense.amount.toFixed(2),
    expense.status === 'warning' ? 'Pending Review' : 'Valid'
  ]);

  // Generate Table
  autoTable(doc, {
    head: [['Date', 'Merchant', 'Category', 'Currency', 'Amount', 'Status']],
    body: tableBody,
    startY: 60,
    theme: 'grid',
    styles: {
      font: fontLoaded ? FONT_NAME : 'helvetica', // Conditionally apply font
      fontStyle: 'normal',
      fontSize: 9,
      cellPadding: 4,
      textColor: [60, 60, 60],
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: brandGreen,
      textColor: [255, 255, 255],
      fontStyle: 'bold', 
    },
    columnStyles: {
      4: { halign: 'right' }, // Amount column
      5: { fontStyle: 'normal' } // Status column
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    foot: [['', '', '', 'Total', `CNY ${totalAmount.toFixed(2)}`, '']],
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [40, 40, 40],
      fontStyle: 'bold' 
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} - Generated via Yeahzea`, 
      doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' }
    );
  }

  // Save
  doc.save(`${reportName.replace(/\s+/g, '_')}.pdf`);
};