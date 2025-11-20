import React from 'react';
import { ChevronRight, AlertCircle, Trash2, User, FileText } from 'lucide-react';
import { Expense } from '../types';

interface ExpenseRowProps {
  expense: Expense;
  onToggle: (id: string) => void;
  onClick: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense, onToggle, onClick, onDelete }) => {
  const isPersonal = expense.isPersonalExpense;
  const isPdf = expense.fileType === 'pdf';

  return (
    <div 
        onClick={() => onClick(expense)}
        className={`group relative bg-white hover:bg-brand-hover border-b border-brand-border last:border-b-0 transition-colors cursor-pointer ${isPersonal ? 'bg-gray-50/50' : ''}`}
    >
      <div className="flex items-center py-4 px-4 gap-4">
        {/* Checkbox */}
        <div 
            className="flex items-center justify-center h-5 w-5"
            onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={expense.selected}
            onChange={() => onToggle(expense.id)}
            className="h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer"
          />
        </div>

        {/* Receipt Thumbnail */}
        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
            {isPdf ? (
                <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-500">
                    <FileText size={20} />
                </div>
            ) : expense.receiptUrl ? (
                <img src={expense.receiptUrl} alt="Receipt" className={`w-full h-full object-cover ${isPersonal ? 'opacity-50 grayscale' : 'opacity-80'}`} />
            ) : (
                <span className="text-xs text-gray-400">IMG</span>
            )}
        </div>

        {/* Date */}
        <div className="w-24 text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
          {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>

        {/* Merchant & Details Container */}
        <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
           {/* Merchant Name */}
           <div className={`col-span-6 text-sm font-medium truncate ${isPersonal ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
             {expense.merchant}
           </div>

           {/* Category */}
           <div className="col-span-4 text-sm text-gray-500 truncate flex items-center gap-2">
             {isPersonal && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    <User size={10} className="mr-1" />
                    Personal
                </span>
             )}
             <span>{expense.category || ''}</span>
           </div>
        </div>

        {/* Amount */}
        <div className={`w-32 text-right text-sm font-medium whitespace-nowrap ${isPersonal ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
          {expense.currency}¥{expense.amount.toFixed(2)}
        </div>

        {/* Actions (Visible on Hover) */}
        <div className="w-12 flex items-center justify-end gap-2 text-gray-300">
            <button 
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-full hover:text-red-600 transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(expense.id);
                }}
                title="Delete"
            >
                <Trash2 size={16} />
            </button>
            <div className="group-hover:text-gray-400 transition-colors">
                 <ChevronRight size={18} />
            </div>
        </div>
      </div>

      {/* Warning Line - Only if warning exists and NOT personal (personal usually has its own status, or we show warning if relevant) */}
      {expense.status === 'warning' && !isPersonal && (
        <div className="px-4 pb-3 ml-[4.5rem] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-status-warning"></div>
          <span className="text-xs text-status-warning font-medium">
            {expense.warningMessage}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExpenseRow;