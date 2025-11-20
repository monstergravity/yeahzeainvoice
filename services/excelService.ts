import * as XLSX from 'xlsx';
import { Expense } from '../types';

export const generateExpenseReportExcel = (expenses: Expense[], reportName: string) => {
  const data = expenses.map(e => {
    // Simple conversion logic for demonstration
    // In a real app, these would come from a live API based on the expense date
    let exchangeRate = 1;
    if (e.currency === 'USD') exchangeRate = 7.25;
    else if (e.currency === 'JPY') exchangeRate = 0.048;
    else if (e.currency === 'EUR') exchangeRate = 7.85;
    else if (e.currency === 'KRW') exchangeRate = 0.0052;
    else if (e.currency === 'THB') exchangeRate = 0.21;
    else if (e.currency === 'HKD') exchangeRate = 0.93;

    // If already CNY, rate is 1
    if (e.currency === 'CNY') {
        exchangeRate = 1;
    }

    const amountCNY = e.amount * exchangeRate;

    return {
      'Date': new Date(e.date).toLocaleDateString(),
      'Merchant': e.merchant,
      'Category': e.category || 'Uncategorized',
      'Original Currency': e.currency,
      'Original Amount': e.amount,
      'Est. Rate': exchangeRate.toFixed(4),
      'Amount (CNY)': Number(amountCNY.toFixed(2)),
      'Tax': e.tax || 0,
      'Status': e.status === 'warning' ? 'Pending Review' : 'Valid',
      'Type': e.isPersonalExpense ? 'Personal' : 'Business',
      'AI Notes': e.aiAnalysis || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  // Adjust column widths
  const wscols = [
    { wch: 12 }, // Date
    { wch: 25 }, // Merchant
    { wch: 15 }, // Category
    { wch: 10 }, // Orig Curr
    { wch: 12 }, // Orig Amt
    { wch: 10 }, // Rate
    { wch: 12 }, // CNY Amt
    { wch: 10 }, // Tax
    { wch: 15 }, // Status
    { wch: 10 }, // Type
    { wch: 40 }, // Notes
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, '_')}.xlsx`);
};