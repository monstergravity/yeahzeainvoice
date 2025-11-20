import React, { useState } from 'react';
import { Expense } from '../types';
import { auditReceipt } from '../services/geminiService';
import { BrainCircuit, ShieldAlert, CheckCircle, AlertTriangle, Loader2, FileSearch, Sparkles, FileText } from 'lucide-react';

interface AIAuditViewProps {
  expenses: Expense[];
  onUpdateExpense: (expense: Expense) => void;
  credits: number;
  onConsumeCredit: (amount: number) => void;
}

const AIAuditView: React.FC<AIAuditViewProps> = ({ expenses, onUpdateExpense, credits, onConsumeCredit }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{ current: number; total: number } | null>(null);
  
  const AUDIT_COST = 2;

  // Only audit expenses that have receipts and haven't been audited yet
  const unauditedExpenses = expenses.filter(e => e.receiptUrl && !e.aiAuditRan);
  const flaggedExpenses = expenses.filter(e => e.isPersonalExpense);

  const runAudit = async () => {
    if (unauditedExpenses.length === 0) return;
    
    const totalCost = unauditedExpenses.length * AUDIT_COST;

    if (totalCost > credits) {
        alert(`Not enough credits. You have ${credits} credits, but need ${totalCost} credits to audit ${unauditedExpenses.length} receipts (Cost: ${AUDIT_COST} credits per receipt).`);
        return;
    }

    setIsAuditing(true);
    setAuditProgress({ current: 0, total: unauditedExpenses.length });

    let processedCount = 0;

    for (let i = 0; i < unauditedExpenses.length; i++) {
      const expense = unauditedExpenses[i];
      setAuditProgress({ current: i + 1, total: unauditedExpenses.length });

      try {
        // Fetch blob from internal URL for Gemini
        const response = await fetch(expense.receiptUrl!);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
             const reader = new FileReader();
             reader.onloadend = () => {
                 const res = reader.result as string;
                 resolve(res.includes(',') ? res.split(',')[1] : res);
             };
             reader.readAsDataURL(blob);
        });
        
        const mimeType = blob.type || (expense.fileType === 'pdf' ? 'application/pdf' : 'image/png');

        const auditResult = await auditReceipt(base64, expense, mimeType);
        
        onUpdateExpense({
            ...expense,
            ...auditResult,
            warningMessage: auditResult.isPersonalExpense ? auditResult.auditWarning : expense.warningMessage,
            status: auditResult.isPersonalExpense ? 'warning' : expense.status
        });

        processedCount++;
      } catch (e) {
          console.error("Audit failed for", expense.id, e);
      }
    }

    onConsumeCredit(processedCount * AUDIT_COST);
    setIsAuditing(false);
    setAuditProgress(null);
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