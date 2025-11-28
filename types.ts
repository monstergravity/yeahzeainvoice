export interface Expense {
  id: string;
  date: string;
  merchant: string;
  category?: string; // Optional because it might be missing
  amount: number;
  currency: string;
  tax?: number;
  originalAmount?: number;
  originalCurrency?: string;
  receiptUrl?: string;
  fileType?: 'image' | 'pdf'; // New field to track file type
  status: 'valid' | 'warning' | 'error';
  warningMessage?: string;
  selected: boolean;
  tripId?: string;
  buyerName?: string;
  buyerTaxId?: string;
  
  // AI Audit Fields
  aiAuditRan?: boolean;
  aiAnalysis?: string;     // The "Nature of purchase" comment
  isPersonalExpense?: boolean; // Flag for beer/cigarettes
  auditWarning?: string;   // Specific warning text
}

export interface Trip {
  id: string;
  name: string;
  createdAt: string;
}

export interface Report {
  id: string;
  name: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  owner: string;
  ownerEmail: string;
  workspace: string;
  totalAmount: number;
  currency: string;
  createdDate: string;
  expenses: Expense[];
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export enum ProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Bank Reconciliation Types
export interface CreditCardTransaction {
  id: string;
  userId: string;
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  transactionType: 'purchase' | 'refund' | 'fee' | 'payment';
  cardLast4?: string;
  description?: string;
  statementId?: string;
  matchedExpenseId?: string;
  matchStatus: 'matched' | 'pending' | 'unmatched';
  matchConfidence?: number; // 0-1, similarity score
  // Additional fields for better bank statement support
  counterParty?: string;
  referenceNumber?: string;
  accountNumber?: string;
  category?: string;
  location?: string;
  postDate?: string;
  rawData?: Record<string, any>; // Store original row data
  createdAt?: string;
}

export interface MatchResult {
  transaction: CreditCardTransaction;
  expense: Expense;
  matchType: 'exact' | 'fuzzy' | 'partial';
  confidence: number; // 0-1
  reasons: string[]; // Why it matched
}

export interface BankReconciliation {
  transactions: CreditCardTransaction[];
  expenses: Expense[];
  matches: MatchResult[];
  unmatchedTransactions: CreditCardTransaction[];
  unmatchedExpenses: Expense[];
  summary: {
    totalTransactions: number;
    totalExpenses: number;
    matchedCount: number;
    pendingCount: number;
    unmatchedTransactionCount: number;
    unmatchedExpenseCount: number;
  };
}