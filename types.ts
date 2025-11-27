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