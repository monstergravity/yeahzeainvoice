import React, { useState } from 'react';
import { Expense } from '../types';
import { auditReceipt } from '../services/geminiService';
import { BrainCircuit, ShieldAlert, CheckCircle, AlertTriangle, Loader2, FileSearch, Sparkles, FileText } from 'lucide-react';

interface AIAuditViewProps {
  expenses: Expense[];
  onUpdateExpense: (expense: Expense) => void;
  credits: number;
  onConsumeCredit: (amount: number, type?: 'scan' | 'audit') => void;
}

const AIAuditView: React.FC<AIAuditViewProps> = ({ expenses, onUpdateExpense, credits, onConsumeCredit }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{ current: number; total: number } | null>(null);
  
  const AUDIT_COST = 2;

  // Only audit expenses that have receipts and haven't been audited yet
  const unauditedExpenses = expenses.filter(e => e.receiptUrl && !e.aiAuditRan);
  const flaggedExpenses = expenses.filter(e => e.isPersonalExpense);

  const runAudit = async () => {
    // Capture the list of unaudited expenses at the start to avoid issues with re-renders
    const expensesToAudit = expenses.filter(e => e.receiptUrl && !e.aiAuditRan);
    
    if (expensesToAudit.length === 0) {
      alert('No unaudited expenses found. All expenses have already been audited.');
      return;
    }
    
    const totalCost = expensesToAudit.length * AUDIT_COST;

    if (totalCost > credits) {
        alert(`Not enough credits. You have ${credits} credits, but need ${totalCost} credits to audit ${expensesToAudit.length} receipts (Cost: ${AUDIT_COST} credits per receipt).`);
        return;
    }

    setIsAuditing(true);
    setAuditProgress({ current: 0, total: expensesToAudit.length });

    let processedCount = 0;
    let failedCount = 0;

    console.log(`Starting audit for ${expensesToAudit.length} expenses`);

    for (let i = 0; i < expensesToAudit.length; i++) {
      const expense = expensesToAudit[i];
      setAuditProgress({ current: i + 1, total: expensesToAudit.length });

      console.log(`Auditing expense ${i + 1}/${expensesToAudit.length}: ${expense.merchant}`);

      try {
        // Fetch blob from internal URL for Gemini
        let blob: Blob;
        try {
          const response = await fetch(expense.receiptUrl!);
          if (!response.ok) {
            throw new Error(`Failed to fetch receipt: ${response.status} ${response.statusText}`);
          }
          blob = await response.blob();
        } catch (fetchError) {
          console.error(`Failed to fetch receipt for ${expense.id}:`, fetchError);
          failedCount++;
          continue;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => {
                 const res = reader.result as string;
                 resolve(res.includes(',') ? res.split(',')[1] : res);
             };
             reader.onerror = reject;
             reader.readAsDataURL(blob);
        });
        
        const mimeType = blob.type || (expense.fileType === 'pdf' ? 'application/pdf' : 'image/png');

        console.log(`Calling auditReceipt for ${expense.id}`);
        const auditResult = await auditReceipt(base64, expense, mimeType);
        console.log(`Audit result for ${expense.id}:`, auditResult);
        
        const updatedExpense: Expense = {
            ...expense,
            ...auditResult,
            warningMessage: auditResult.isPersonalExpense ? auditResult.auditWarning : expense.warningMessage,
            status: auditResult.isPersonalExpense ? 'warning' : expense.status
        };

        onUpdateExpense(updatedExpense);
        processedCount++;
        console.log(`Successfully audited expense ${i + 1}/${expensesToAudit.length}`);
      } catch (e) {
          console.error(`Audit failed for expense ${expense.id} (${expense.merchant}):`, e);
          failedCount++;
      }
    }

    console.log(`Audit completed: ${processedCount} succeeded, ${failedCount} failed out of ${expensesToAudit.length} total`);

    if (processedCount > 0) {
      onConsumeCredit(processedCount, 'audit');
    }

    setIsAuditing(false);
    setAuditProgress(null);

    if (failedCount > 0) {
      alert(`Audit completed with ${failedCount} failure(s). ${processedCount} expense(s) were successfully audited.`);
    } else if (processedCount > 0) {
      alert(`Successfully audited ${processedCount} expense(s)!`);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen overflow-y-auto">
      
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BrainCircuit className="text-brand-green" />
                AI Expense Analyst
            </h2>
            <p className="text-gray-500 mt-1">Deep-dive analysis for compliance, personal expenses, and translation.</p>
        </div>

        <div className="text-right">
            <p className="text-xs text-gray-400 mb-2">Powered by Gemini 3 Pro Preview</p>
            <button 
                onClick={runAudit}
                disabled={isAuditing || unauditedExpenses.length === 0}
                className="bg-brand-dark text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isAuditing ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Auditing ({auditProgress?.current}/{auditProgress?.total})
                    </>
                ) : (
                    <>
                        <FileSearch size={18} />
                        Run Audit ({AUDIT_COST} credits/item)
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                     <CheckCircle size={20} />
                 </div>
                 <span className="text-sm font-semibold text-gray-500 uppercase">Audited</span>
             </div>
             <div className="text-2xl font-bold text-gray-900">{expenses.filter(e => e.aiAuditRan).length} <span className="text-sm font-normal text-gray-400">/ {expenses.length}</span></div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                     <ShieldAlert size={20} />
                 </div>
                 <span className="text-sm font-semibold text-gray-500 uppercase">Personal / Flagged</span>
             </div>
             <div className="text-2xl font-bold text-red-600">{flaggedExpenses.length}</div>
             <div className="text-xs text-gray-400 mt-1">Invoices containing restricted items</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                     <BrainCircuit size={20} />
                 </div>
                 <span className="text-sm font-semibold text-gray-500 uppercase">Translations</span>
             </div>
             <div className="text-2xl font-bold text-gray-900">{expenses.filter(e => e.aiAnalysis).length}</div>
          </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Recent Audits</h3>
          </div>
          
          {expenses.filter(e => e.aiAuditRan).length === 0 ? (
               <div className="p-12 text-center text-gray-400">
                   <FileSearch size={48} className="mx-auto mb-4 text-gray-200" />
                   <p>No expenses have been audited yet.</p>
                   <p className="text-sm">Click "Run Audit" to analyze your receipts.</p>
               </div>
          ) : (
            <div className="divide-y divide-gray-100">
                {expenses.filter(e => e.aiAuditRan).map(expense => (
                    <div key={expense.id} className="p-6 flex gap-6 hover:bg-gray-50 transition-colors">
                         {/* Thumb */}
                         <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                             {expense.fileType === 'pdf' ? (
                                <FileText className="text-red-500" size={32} />
                             ) : expense.receiptUrl ? (
                                <img src={expense.receiptUrl} className="w-full h-full object-cover" />
                             ) : (
                                <FileText className="text-gray-300" size={32} />
                             )}
                         </div>

                         {/* Content */}
                         <div className="flex-1">
                             <div className="flex justify-between mb-2">
                                 <div>
                                     <h4 className="font-bold text-gray-900">{expense.merchant}</h4>
                                     <p className="text-xs text-gray-500">{expense.date}</p>
                                 </div>
                                 <div className="text-right">
                                     <div className="font-mono font-bold">{expense.currency} {expense.amount.toFixed(2)}</div>
                                     {expense.tax && <div className="text-xs text-gray-400">Tax: {expense.tax}</div>}
                                 </div>
                             </div>

                             {/* AI Analysis Box */}
                             <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-2">
                                 <div className="flex items-start gap-2">
                                     <Sparkles size={14} className="text-brand-green mt-0.5 flex-shrink-0" />
                                     <div>
                                        <p className="text-xs font-bold text-brand-text mb-0.5">AI Commentary</p>
                                        <p className="text-sm text-gray-700">{expense.aiAnalysis}</p>
                                     </div>
                                 </div>
                             </div>

                             {/* Warning Box */}
                             {expense.isPersonalExpense && (
                                 <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 items-start animate-pulse">
                                     <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                                     <div>
                                         <p className="text-xs font-bold text-red-800">Personal Expense Detected</p>
                                         <p className="text-sm text-red-700 font-medium">{expense.auditWarning}</p>
                                     </div>
                                 </div>
                             )}
                         </div>
                    </div>
                ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default AIAuditView;