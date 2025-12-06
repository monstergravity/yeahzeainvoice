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

// ============================================
// Reimbursement & Approval Types
// ============================================

export type ReimbursementStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalAction = 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled';

export interface ReimbursementRequest {
  id: string;
  userId: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  status: ReimbursementStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Related data (loaded separately)
  expenses?: Expense[];
  approvalWorkflows?: ApprovalWorkflow[];
  approvalHistory?: ApprovalHistory[];
}

export interface ReimbursementExpense {
  id: string;
  reimbursementId: string;
  expenseId: string;
  createdAt: string;
}

export interface ApprovalWorkflow {
  id: string;
  reimbursementId: string;
  approverId: string;
  level: number; // 审批层级
  status: ApprovalStatus;
  approvedAt?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistory {
  id: string;
  reimbursementId: string;
  action: ApprovalAction;
  actorId: string;
  comments?: string;
  createdAt: string;
}

// ============================================
// Accounting Types
// ============================================

export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type VoucherStatus = 'draft' | 'posted' | 'cancelled';

export interface ChartOfAccount {
  id: string;
  code: string; // 科目代码，如 "6001"
  name: string; // 科目名称（中文）
  nameEn?: string; // 科目名称（英文）
  category: AccountCategory;
  parentId?: string; // 父科目ID（支持层级）
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseAccountMapping {
  id: string;
  userId?: string; // NULL 表示全局映射
  expenseCategory?: string; // 费用分类
  merchantKeyword?: string; // 商户关键词
  accountId: string;
  priority: number; // 优先级
  createdAt: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string; // 凭证号，如 "V-2025-001"
  reimbursementId?: string; // 关联的报销单
  voucherDate: string; // DATE format
  description?: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  status: VoucherStatus;
  postedAt?: string;
  postedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Related data (loaded separately)
  entries?: AccountingEntry[];
  attachments?: Expense[];
}

export interface AccountingEntry {
  id: string;
  voucherId: string;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  description?: string;
  createdAt: string;
  // Related data (loaded separately)
  account?: ChartOfAccount;
}

export interface VoucherAttachment {
  id: string;
  voucherId: string;
  expenseId: string;
  createdAt: string;
}

// ============================================
// Wizard Types (for One-Click Reimbursement)
// ============================================

export type WizardStep = 'select' | 'classify' | 'audit' | 'review' | 'complete';

export interface WizardState {
  currentStep: WizardStep;
  selectedExpenses: Expense[];
  reimbursementRequest?: ReimbursementRequest;
  isProcessing: boolean;
  error?: string;
}