import { CreditCardTransaction, Expense, MatchResult, BankReconciliation } from '../types';
import { supabase } from './supabaseService';
import * as XLSX from 'xlsx';
import { 
  normalizeMerchantName, 
  calculateStringSimilarity, 
  getMerchantCategory 
} from './merchantAliasService';

/**
 * Parse CSV credit card statement
 * Supports common formats: Chase, Bank of America, Amex, etc.
 */
export const parseCSVStatement = async (file: File): Promise<CreditCardTransaction[]> => {
  const text = await file.text();
  
  // Handle different line endings
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.warn('CSV file is empty');
    return [];
  }
  
  // Try to detect header - look for common header keywords
  let headerLineIndex = 0;
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('date') || 
                     firstLine.includes('transaction') || 
                     firstLine.includes('merchant') ||
                     firstLine.includes('description') ||
                     firstLine.includes('amount');
  
  // Parse header to map column names
  let headerMap: Record<string, number> = {};
  if (hasHeader) {
    const headerLine = lines[0];
    // Parse header with proper CSV handling
    const headerParts: string[] = [];
    let currentPart = '';
    let insideQuotes = false;
    
    for (let j = 0; j < headerLine.length; j++) {
      const char = headerLine[j];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        headerParts.push(currentPart.trim().replace(/^"|"$/g, ''));
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    headerParts.push(currentPart.trim().replace(/^"|"$/g, ''));
    
    // Map header names to column indices
    headerParts.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      headerMap[normalizedHeader] = index;
    });
    
    console.log('Detected headers:', headerMap);
  }
  
  // Skip header line if detected
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const transactions: CreditCardTransaction[] = [];
  
  console.log(`Parsing CSV: ${dataLines.length} data lines (header detected: ${hasHeader})`);
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;
    
    // Better CSV parsing - handle quoted fields with commas inside
    const parts: string[] = [];
    let currentPart = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        parts.push(currentPart.trim());
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart.trim()); // Add last part
    
    // Remove quotes from parts
    const cleanedParts = parts.map(p => p.replace(/^"|"$/g, ''));
    
    if (cleanedParts.length < 2) {
      console.warn(`Line ${i + 1} has too few columns: ${cleanedParts.length}`);
      continue;
    }
    
    try {
      // Try to find date column - check all columns
      let dateStr: string | null = null;
      let dateIndex = -1;
      let merchantIndex = -1;
      let amountIndex = -1;
      
      for (let j = 0; j < cleanedParts.length; j++) {
        const part = cleanedParts[j];
        if (!part) continue;
        
        // Check if this looks like a date
        if (parseDate(part)) {
          if (dateIndex === -1) {
            dateStr = part;
            dateIndex = j;
          }
        }
        
        // Check if this looks like an amount (contains numbers and decimal point or currency symbol)
        if (part.match(/^[\$€£¥]?[\d,]+\.?\d*$/) || part.match(/^-?[\d,]+\.?\d*$/)) {
          if (amountIndex === -1) {
            amountIndex = j;
          }
        }
      }
      
      // If we couldn't find date, try first column
      if (dateIndex === -1 && cleanedParts[0]) {
        dateStr = cleanedParts[0];
        dateIndex = 0;
      }
      
      // If we couldn't find amount, try last column
      if (amountIndex === -1) {
        amountIndex = cleanedParts.length - 1;
      }
      
      // Merchant is usually the description column - find the longest text field that's not date or amount
      for (let j = 0; j < cleanedParts.length; j++) {
        if (j !== dateIndex && j !== amountIndex && cleanedParts[j] && cleanedParts[j].length > 3) {
          merchantIndex = j;
          break;
        }
      }
      
      // Fallback: if no good merchant found, use column after date
      if (merchantIndex === -1) {
        merchantIndex = dateIndex + 1 < cleanedParts.length ? dateIndex + 1 : 1;
      }
      
      // Parse date
      const date = dateStr ? parseDate(dateStr) : null;
      if (!date) {
        console.warn(`Line ${i + 1}: Could not parse date from "${dateStr}"`);
        continue;
      }
      
      // Get merchant
      const merchant = cleanedParts[merchantIndex] || 'Unknown';
      if (merchant === 'Unknown' || merchant.length < 2) {
        console.warn(`Line ${i + 1}: Invalid merchant: "${merchant}"`);
        continue;
      }
      
      // Get amount
      let amountStr = cleanedParts[amountIndex] || '0';
      // Remove currency symbols, commas, and spaces
      amountStr = amountStr.replace(/[\$€£¥,\s]/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount === 0) {
        console.warn(`Line ${i + 1}: Could not parse amount from "${cleanedParts[amountIndex]}"`);
        continue;
      }
      
      // Determine transaction type
      const transactionType: 'purchase' | 'refund' | 'fee' | 'payment' = 
        amount < 0 ? 'refund' :
        merchant.toLowerCase().includes('payment') || merchant.toLowerCase().includes('pay') ? 'payment' :
        merchant.toLowerCase().includes('fee') ? 'fee' :
        'purchase';
      
      // Extract additional fields from header map
      const findField = (possibleNames: string[]): string | undefined => {
        if (!hasHeader || Object.keys(headerMap).length === 0) {
          return undefined;
        }
        
        for (const name of possibleNames) {
          const normalizedName = name.toLowerCase();
          // Find header that contains the name
          for (const [headerName, colIndex] of Object.entries(headerMap)) {
            if (headerName.includes(normalizedName) && cleanedParts[colIndex]) {
              return cleanedParts[colIndex].trim();
            }
          }
        }
        return undefined;
      };
      
      const counterParty = findField(['counter party', 'counterparty', 'payee', 'beneficiary', 'recipient']);
      const referenceNumber = findField(['reference', 'ref', 'reference number', 'transaction id', 'transaction number']);
      const accountNumber = findField(['account', 'account number', 'account no', 'acct']);
      const category = findField(['category', 'type', 'transaction type', 'classification']);
      const location = findField(['location', 'city', 'address', 'place']);
      const postDateStr = findField(['post date', 'posted date', 'posting date', 'settlement date']);
      const postDate = postDateStr ? parseDate(postDateStr) : undefined;
      
      // Store raw data for debugging and future enhancements
      const rawData: Record<string, any> = {};
      if (hasHeader) {
        Object.keys(headerMap).forEach(headerName => {
          const colIndex = headerMap[headerName];
          if (cleanedParts[colIndex]) {
            rawData[headerName] = cleanedParts[colIndex];
          }
        });
      } else {
        // If no header, store by index
        cleanedParts.forEach((part, idx) => {
          rawData[`column_${idx}`] = part;
        });
      }
      
      const transaction: CreditCardTransaction = {
        id: `cc_${Date.now()}_${i}`,
        userId: '', // Will be set by caller
        date: date.toISOString(),
        merchant: merchant.trim(),
        amount: Math.abs(amount),
        currency: 'USD', // Default, can be enhanced
        transactionType,
        description: merchant,
        matchStatus: 'unmatched',
        counterParty,
        referenceNumber,
        accountNumber,
        category,
        location,
        postDate: postDate?.toISOString(),
        rawData
      };
      
      transactions.push(transaction);
      console.log(`Parsed transaction ${i + 1}: ${merchant} - $${Math.abs(amount)} - ${date.toLocaleDateString()}`);
    } catch (error) {
      console.warn(`Failed to parse line ${i + 1}:`, error, 'Line content:', line);
      continue;
    }
  }
  
  console.log(`Successfully parsed ${transactions.length} transactions from ${dataLines.length} lines`);
  return transactions;
};

/**
 * Parse Excel credit card statement
 * Supports .xlsx and .xls formats
 */
export const parseExcelStatement = async (file: File): Promise<CreditCardTransaction[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON array
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  
  if (data.length === 0) {
    return [];
  }
  
  const transactions: CreditCardTransaction[] = [];
  
  // Try to identify column indices by header names
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  // Common header name mappings
  const findColumnIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  };
  
  const dateIndex = findColumnIndex(['date', 'transaction date', 'trans date']);
  const merchantIndex = findColumnIndex(['merchant', 'description', 'payee', 'vendor', 'name']);
  const amountIndex = findColumnIndex(['amount', 'debit', 'charge', 'transaction amount']);
  const typeIndex = findColumnIndex(['type', 'transaction type', 'category']);
  const counterPartyIndex = findColumnIndex(['counter party', 'counterparty', 'beneficiary', 'recipient']);
  const referenceNumberIndex = findColumnIndex(['reference', 'ref', 'reference number', 'transaction id', 'transaction number']);
  const accountNumberIndex = findColumnIndex(['account', 'account number', 'account no', 'acct']);
  const categoryIndex = findColumnIndex(['category', 'classification']);
  const locationIndex = findColumnIndex(['location', 'city', 'address', 'place']);
  const postDateIndex = findColumnIndex(['post date', 'posted date', 'posting date', 'settlement date']);
  
  // If we can't find date or amount, try positional (first few columns)
  const effectiveDateIndex = dateIndex !== -1 ? dateIndex : 0;
  const effectiveMerchantIndex = merchantIndex !== -1 ? merchantIndex : (dateIndex !== -1 ? 1 : 1);
  const effectiveAmountIndex = amountIndex !== -1 ? amountIndex : headers.length - 1;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowValues = Object.values(row);
    
    try {
      // Get date
      let dateStr = String(rowValues[effectiveDateIndex] || '');
      if (!dateStr) continue;
      
      // Excel dates might be numbers (Excel serial date)
      let date: Date | null = null;
      if (typeof rowValues[effectiveDateIndex] === 'number') {
        // Excel serial date: days since 1900-01-01
        const excelDate = rowValues[effectiveDateIndex] as number;
        // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
        // So we need to adjust: Excel date 1 = 1900-01-01
        const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899 (Excel's epoch)
        date = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
      } else {
        date = parseDate(dateStr);
      }
      
      if (!date) continue;
      
      // Get merchant
      const merchant = String(rowValues[effectiveMerchantIndex] || 'Unknown').trim();
      if (!merchant || merchant === 'Unknown') continue;
      
      // Get amount
      let amountStr = String(rowValues[effectiveAmountIndex] || '0');
      // Remove currency symbols and commas
      amountStr = amountStr.replace(/[^0-9.-]/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount === 0) continue;
      
      // Determine transaction type
      let transactionType: 'purchase' | 'refund' | 'fee' | 'payment' = 'purchase';
      if (typeIndex !== -1) {
        const typeStr = String(rowValues[typeIndex] || '').toLowerCase();
        if (typeStr.includes('refund')) transactionType = 'refund';
        else if (typeStr.includes('fee')) transactionType = 'fee';
        else if (typeStr.includes('payment')) transactionType = 'payment';
      } else if (amount < 0) {
        transactionType = 'refund';
      }
      
      // Extract additional fields
      const counterParty = counterPartyIndex !== -1 ? String(rowValues[counterPartyIndex] || '').trim() : undefined;
      const referenceNumber = referenceNumberIndex !== -1 ? String(rowValues[referenceNumberIndex] || '').trim() : undefined;
      const accountNumber = accountNumberIndex !== -1 ? String(rowValues[accountNumberIndex] || '').trim() : undefined;
      const categoryValue = categoryIndex !== -1 ? String(rowValues[categoryIndex] || '').trim() : undefined;
      const location = locationIndex !== -1 ? String(rowValues[locationIndex] || '').trim() : undefined;
      const postDateStr = postDateIndex !== -1 ? String(rowValues[postDateIndex] || '') : undefined;
      let postDate: Date | undefined = undefined;
      if (postDateStr) {
        if (typeof rowValues[postDateIndex] === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          postDate = new Date(excelEpoch.getTime() + (rowValues[postDateIndex] as number) * 24 * 60 * 60 * 1000);
        } else {
          postDate = parseDate(postDateStr);
        }
      }
      
      // Store raw data
      const rawData: Record<string, any> = {};
      headers.forEach((header, idx) => {
        if (rowValues[idx]) {
          rawData[header] = rowValues[idx];
        }
      });
      
      const transaction: CreditCardTransaction = {
        id: `cc_${Date.now()}_${i}`,
        userId: '', // Will be set by caller
        date: date.toISOString(),
        merchant: merchant,
        amount: Math.abs(amount),
        currency: 'USD', // Default, can be enhanced
        transactionType,
        description: merchant,
        matchStatus: 'unmatched',
        counterParty,
        referenceNumber,
        accountNumber,
        category: categoryValue,
        location,
        postDate: postDate?.toISOString(),
        rawData
      };
      
      transactions.push(transaction);
    } catch (error) {
      console.warn(`Failed to parse row ${i + 1}:`, error);
      continue;
    }
  }
  
  return transactions;
};

/**
 * Parse credit card statement (supports both CSV and Excel)
 */
export const parseStatement = async (file: File): Promise<CreditCardTransaction[]> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSVStatement(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelStatement(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
  }
};

/**
 * Parse date from various formats
 */
const parseDate = (dateStr: string): Date | null => {
  // Try MM/DD/YYYY
  const mmddyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try YYYY-MM-DD
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    return new Date(dateStr);
  }
  
  // Try DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try native Date parse
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
};

/**
 * Calculate match score using weighted scoring model
 * Returns score 0-1 and detailed reasons
 */
interface MatchScore {
  totalScore: number;
  amountScore: number;
  dateScore: number;
  merchantScore: number;
  categoryScore: number;
  reasons: string[];
}

const calculateMatchScore = (
  transaction: CreditCardTransaction,
  expense: Expense
): MatchScore => {
  const reasons: string[] = [];
  
  // 1. Amount matching (40% weight) - highest priority
  const amountDiff = Math.abs(transaction.amount - expense.amount);
  const amountTolerance = 1.0; // Allow ±1 currency unit difference
  const amountScore = amountDiff <= amountTolerance ? 1.0 : Math.max(0, 1 - (amountDiff / 10));
  if (amountScore === 1.0) reasons.push('Exact amount match');
  else if (amountScore >= 0.8) reasons.push(`Amount difference: ${amountDiff.toFixed(2)}`);
  
  // 2. Date matching (30% weight) - allow ±3 days tolerance
  const transactionDate = new Date(transaction.date);
  const expenseDate = new Date(expense.date);
  const dateDiff = Math.abs(transactionDate.getTime() - expenseDate.getTime());
  const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
  let dateScore = 0;
  if (daysDiff <= 1) {
    dateScore = 1.0;
    reasons.push('Same day');
  } else if (daysDiff <= 3) {
    dateScore = 1 - (daysDiff / 3) * 0.3; // Max 30% penalty
    reasons.push(`Within ${Math.round(daysDiff)} days`);
  } else if (daysDiff <= 7) {
    dateScore = 0.7 - ((daysDiff - 3) / 4) * 0.3; // 0.7 to 0.4
    reasons.push(`Within ${Math.round(daysDiff)} days`);
  } else {
    dateScore = Math.max(0, 0.4 - (daysDiff - 7) / 30); // Further penalty
    if (dateScore > 0) reasons.push(`Date difference: ${Math.round(daysDiff)} days`);
  }
  
  // 3. Merchant name similarity (20% weight) - use alias-aware matching
  const normalizedTransactionMerchant = normalizeMerchantName(transaction.merchant);
  const normalizedExpenseMerchant = normalizeMerchantName(expense.merchant);
  const merchantScore = calculateStringSimilarity(
    normalizedTransactionMerchant,
    normalizedExpenseMerchant
  );
  if (merchantScore >= 0.9) reasons.push('Merchant name match');
  else if (merchantScore >= 0.7) reasons.push('Similar merchant name');
  else if (merchantScore >= 0.5) reasons.push('Partial merchant match');
  
  // 4. Category hint (10% weight) - bonus if categories match
  let categoryScore = 0;
  const transactionCategory = getMerchantCategory(transaction.merchant);
  if (transactionCategory && expense.category) {
    if (transactionCategory === expense.category) {
      categoryScore = 0.2;
      reasons.push(`Category match: ${expense.category}`);
    } else {
      // Partial category match (e.g., "Meals" vs "Meals & Entertainment")
      const categoryLower = expense.category.toLowerCase();
      if (categoryLower.includes(transactionCategory.toLowerCase()) ||
          transactionCategory.toLowerCase().includes(categoryLower)) {
        categoryScore = 0.1;
        reasons.push(`Category hint: ${transactionCategory} vs ${expense.category}`);
      }
    }
  }
  
  // Calculate weighted total score
  const totalScore = 
    amountScore * 0.4 +
    dateScore * 0.3 +
    merchantScore * 0.2 +
    categoryScore;
  
  return {
    totalScore,
    amountScore,
    dateScore,
    merchantScore,
    categoryScore,
    reasons
  };
};

/**
 * Match credit card transactions with expenses using intelligent scoring
 * Uses weighted scoring model: Amount (40%) + Date (30%) + Merchant (20%) + Category (10%)
 */
export const matchTransactions = (
  transactions: CreditCardTransaction[],
  expenses: Expense[]
): MatchResult[] => {
  const matches: MatchResult[] = [];
  const matchedExpenseIds = new Set<string>();
  const matchedTransactionIds = new Set<string>();
  
  // Calculate match scores for all transaction-expense pairs
  const allScores: Array<{
    transaction: CreditCardTransaction;
    expense: Expense;
    score: MatchScore;
  }> = [];
  
  for (const transaction of transactions) {
    for (const expense of expenses) {
      const score = calculateMatchScore(transaction, expense);
      // Only consider matches with score >= 0.5
      if (score.totalScore >= 0.5) {
        allScores.push({ transaction, expense, score });
      }
    }
  }
  
  // Sort by score (highest first)
  allScores.sort((a, b) => b.score.totalScore - a.score.totalScore);
  
  // Match transactions to expenses (one-to-one, highest score first)
  for (const { transaction, expense, score } of allScores) {
    if (matchedTransactionIds.has(transaction.id) || matchedExpenseIds.has(expense.id)) {
      continue;
    }
    
    // Determine match type based on score
    let matchType: 'exact' | 'fuzzy' | 'partial' = 'partial';
    if (score.totalScore >= 0.9) {
      matchType = 'exact';
    } else if (score.totalScore >= 0.7) {
      matchType = 'fuzzy';
    }
    
    matches.push({
      transaction,
      expense,
      matchType,
      confidence: score.totalScore,
      reasons: score.reasons
    });
    
    matchedTransactionIds.add(transaction.id);
    matchedExpenseIds.add(expense.id);
  }
  
  // Sort matches by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);
  
  return matches;
};

/**
 * Generate bank reconciliation report
 */
export const generateReconciliation = (
  transactions: CreditCardTransaction[],
  expenses: Expense[],
  matches: MatchResult[]
): BankReconciliation => {
  const matchedTransactionIds = new Set(matches.map(m => m.transaction.id));
  const matchedExpenseIds = new Set(matches.map(m => m.expense.id));
  
  const unmatchedTransactions = transactions.filter(t => !matchedTransactionIds.has(t.id));
  const unmatchedExpenses = expenses.filter(e => !matchedExpenseIds.has(e.id));
  
  // Update match status for transactions
  const updatedTransactions: CreditCardTransaction[] = transactions.map(t => {
    const match = matches.find(m => m.transaction.id === t.id);
    if (match) {
      return {
        ...t,
        matchStatus: (match.confidence >= 0.8 ? 'matched' : 'pending') as 'matched' | 'pending' | 'unmatched',
        matchedExpenseId: match.expense.id,
        matchConfidence: match.confidence
      };
    }
    return t;
  });
  
  return {
    transactions: updatedTransactions,
    expenses,
    matches,
    unmatchedTransactions,
    unmatchedExpenses,
    summary: {
      totalTransactions: transactions.length,
      totalExpenses: expenses.length,
      matchedCount: matches.filter(m => m.confidence >= 0.8).length,
      pendingCount: matches.filter(m => m.confidence < 0.8).length,
      unmatchedTransactionCount: unmatchedTransactions.length,
      unmatchedExpenseCount: unmatchedExpenses.length
    }
  };
};

/**
 * Save transactions to Supabase
 */
export const saveTransactions = async (
  transactions: CreditCardTransaction[],
  userId: string
): Promise<{ data: CreditCardTransaction[] | null; error: any }> => {
  // Build transaction objects, only include fields that exist
  const transactionsToInsert = transactions.map(t => {
    const baseTransaction: any = {
      id: t.id,
      user_id: userId,
      date: t.date,
      merchant: t.merchant,
      amount: t.amount,
      currency: t.currency,
      transaction_type: t.transactionType,
      match_status: t.matchStatus,
    };
    
    // Add optional fields only if they exist
    if (t.cardLast4) baseTransaction.card_last4 = t.cardLast4;
    if (t.description) baseTransaction.description = t.description;
    if (t.statementId) baseTransaction.statement_id = t.statementId;
    if (t.matchConfidence !== undefined) baseTransaction.match_confidence = t.matchConfidence;
    if (t.counterParty) baseTransaction.counter_party = t.counterParty;
    if (t.referenceNumber) baseTransaction.reference_number = t.referenceNumber;
    if (t.accountNumber) baseTransaction.account_number = t.accountNumber;
    if (t.category) baseTransaction.category = t.category;
    if (t.location) baseTransaction.location = t.location;
    if (t.postDate) baseTransaction.post_date = t.postDate;
    if (t.rawData) baseTransaction.raw_data = JSON.stringify(t.rawData);
    
    return baseTransaction;
  });
  
  console.log(`Attempting to save ${transactionsToInsert.length} transactions to Supabase...`);
  console.log('Sample transaction:', transactionsToInsert[0]);
  
  try {
    const { data, error } = await supabase
      .from('credit_card_transactions')
      .insert(transactionsToInsert)
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { data: null, error };
    }
    
    console.log(`Successfully saved ${data?.length || 0} transactions`);
    
    const savedTransactions: CreditCardTransaction[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      merchant: row.merchant,
      amount: parseFloat(row.amount),
      currency: row.currency,
      transactionType: row.transaction_type,
      cardLast4: row.card_last4,
      description: row.description,
      statementId: row.statement_id,
      matchedExpenseId: row.matched_expense_id,
      matchStatus: row.match_status,
      matchConfidence: row.match_confidence ? parseFloat(row.match_confidence) : undefined,
      counterParty: row.counter_party,
      referenceNumber: row.reference_number,
      accountNumber: row.account_number,
      category: row.category,
      location: row.location,
      postDate: row.post_date,
      rawData: row.raw_data ? JSON.parse(row.raw_data) : undefined,
      createdAt: row.created_at
    }));
    
    return { data: savedTransactions, error: null };
  } catch (err: any) {
    console.error('Unexpected error saving transactions:', err);
    return { data: null, error: { message: err.message || 'Unexpected error', details: err } };
  }
};

/**
 * Get user's credit card transactions
 */
export const getTransactions = async (userId: string): Promise<{ data: CreditCardTransaction[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('credit_card_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  if (error) {
    return { data: null, error };
  }
  
  const transactions: CreditCardTransaction[] = (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    merchant: row.merchant,
    amount: parseFloat(row.amount),
    currency: row.currency,
    transactionType: row.transaction_type,
    cardLast4: row.card_last4,
    description: row.description,
    statementId: row.statement_id,
    matchedExpenseId: row.matched_expense_id,
    matchStatus: row.match_status,
    matchConfidence: row.match_confidence ? parseFloat(row.match_confidence) : undefined,
    counterParty: row.counter_party,
    referenceNumber: row.reference_number,
    accountNumber: row.account_number,
    category: row.category,
    location: row.location,
    postDate: row.post_date,
    rawData: row.raw_data ? JSON.parse(row.raw_data) : undefined,
    createdAt: row.created_at
  }));
  
  return { data: transactions, error: null };
};

/**
 * Update transaction match status
 */
export const updateTransactionMatch = async (
  transactionId: string,
  expenseId: string | null,
  matchStatus: 'matched' | 'pending' | 'unmatched',
  confidence?: number
): Promise<{ data: any; error: any }> => {
  const { data, error } = await supabase
    .from('credit_card_transactions')
    .update({
      matched_expense_id: expenseId,
      match_status: matchStatus,
      match_confidence: confidence,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select();
  
  return { data, error };
};
