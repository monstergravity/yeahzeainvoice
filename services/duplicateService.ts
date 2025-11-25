import { Expense } from '../types';

export interface DuplicateMatch {
  expense: Expense;
  similarity: number; // 0-1, higher means more similar
  reason: string;
}

/**
 * Check if two expenses are likely duplicates
 * Returns similarity score (0-1) and reason
 */
export const checkExpenseDuplicate = (
  expense1: Expense,
  expense2: Expense
): { isDuplicate: boolean; similarity: number; reason: string } => {
  // Normalize merchant names (lowercase, trim, remove extra spaces)
  const normalizeMerchant = (merchant: string) => {
    return merchant.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const merchant1 = normalizeMerchant(expense1.merchant);
  const merchant2 = normalizeMerchant(expense2.merchant);

  // Check amount match (allow 0.01 difference for rounding)
  const amountDiff = Math.abs(expense1.amount - expense2.amount);
  const amountMatch = amountDiff <= 0.01 || 
                     (expense1.amount > 0 && amountDiff / expense1.amount < 0.001); // 0.1% tolerance

  // Check merchant match (exact or very similar)
  const merchantExactMatch = merchant1 === merchant2;
  const merchantSimilar = merchant1.includes(merchant2) || merchant2.includes(merchant1) ||
                          merchant1.length > 5 && merchant2.length > 5 && 
                          (merchant1.substring(0, 5) === merchant2.substring(0, 5));

  // Check date match (same day or within 7 days)
  const date1 = new Date(expense1.date);
  const date2 = new Date(expense2.date);
  const dateDiff = Math.abs(date1.getTime() - date2.getTime());
  const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
  const dateMatch = daysDiff <= 7; // Within 7 days
  const sameDay = daysDiff < 1; // Same day

  // Check currency match
  const currencyMatch = expense1.currency === expense2.currency;

  // Calculate similarity score
  let similarity = 0;
  let reasons: string[] = [];

  if (amountMatch) {
    similarity += 0.4;
    reasons.push('same amount');
  }

  if (merchantExactMatch) {
    similarity += 0.4;
    reasons.push('same merchant');
  } else if (merchantSimilar) {
    similarity += 0.2;
    reasons.push('similar merchant');
  }

  if (sameDay) {
    similarity += 0.15;
    reasons.push('same day');
  } else if (dateMatch) {
    similarity += 0.05;
    reasons.push('within 7 days');
  }

  if (currencyMatch) {
    similarity += 0.05;
  }

  // Consider it a duplicate if similarity >= 0.7 (70%)
  const isDuplicate = similarity >= 0.7;

  return {
    isDuplicate,
    similarity,
    reason: reasons.join(', ')
  };
};

/**
 * Find duplicate expenses for a given expense
 */
export const findDuplicateExpenses = (
  newExpense: Expense,
  existingExpenses: Expense[]
): DuplicateMatch[] => {
  const duplicates: DuplicateMatch[] = [];

  for (const existing of existingExpenses) {
    // Skip if it's the same expense (by ID)
    if (existing.id === newExpense.id) continue;

    const match = checkExpenseDuplicate(newExpense, existing);
    
    if (match.isDuplicate) {
      duplicates.push({
        expense: existing,
        similarity: match.similarity,
        reason: match.reason
      });
    }
  }

  // Sort by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity);
};

