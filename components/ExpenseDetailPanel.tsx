import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, Tag, MapPin, AlertCircle, Trash2, ZoomIn, Briefcase, User, Lightbulb, FileText } from 'lucide-react';
import { Expense } from '../types';

interface ExpenseDetailPanelProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedExpense: Expense) => void;
  onDelete?: () => void;
}

const ExpenseDetailPanel: React.FC<ExpenseDetailPanelProps> = ({ expense, isOpen, onClose, onUpdate, onDelete }) => {
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [showSmartSuggestion, setShowSmartSuggestion] = useState(false);

  // Close expanded view if the panel is closed or expense changes
  useEffect(() => {
    if (!isOpen) {
        setIsImageExpanded(false);
        setShowSmartSuggestion(false);
    } else {
        // Mock smart suggestion logic: If category is missing but merchant is present, show tip
        if (expense && !expense.category && expense.merchant && expense.merchant !== "Unknown") {
             setShowSmartSuggestion(true);
        } else {
             setShowSmartSuggestion(false);
        }
    }
  }, [isOpen, expense]);

  if (!expense && !isOpen) return null;

  const panelClasses = `fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-brand-border transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
    isOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  const handleChange = (field: keyof Expense, value: any) => {
    if (!expense) return;
    
    const updated = { ...expense, [field]: value };
    
    // Basic re-validation logic for category
    if (field === 'category') {
        if (value && value.trim() !== "") {
            updated.status = 'valid';
            updated.warningMessage = undefined;
            setShowSmartSuggestion(false); // Dismiss hint on manual selection
        } else {
            updated.status = 'warning';
            updated.warningMessage = 'Missing category.';
        }
    }
    
    onUpdate(updated);
  };

  const applySmartCategory = () => {
      // Mock smart recall
      handleChange('category', 'Meals'); // Just a default for the mock
  };

  // Don't render contents if no expense (unless closing)
  const displayExpense = expense || { 
      merchant: '', amount: 0, currency: '', date: '', receiptUrl: '' 
  } as Expense;

  const isPersonal = displayExpense.isPersonalExpense || false;
  const isPdf = displayExpense.fileType === 'pdf';

  return (
    <>
        {/* Backdrop */}
        {isOpen && (
            <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]" onClick={onClose}></div>
        )}
        
        <div className={panelClasses}>
            <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Expense Details</h2>
                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <button 
                                onClick={onDelete}
                                className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete Expense"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {displayExpense.status === 'warning' && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-3 flex gap-3 items-start">
                        <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                            <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Attention Needed</h4>
                            <p className="text-sm text-red-600">{displayExpense.warningMessage || "Please review this expense."}</p>
                        </div>
                    </div>
                )}

                {/* Receipt Preview Area */}
                <div 
                    className={`mb-6 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center min-h-[240px] relative group ${displayExpense.receiptUrl ? 'cursor-zoom-in' : ''}`}
                    onClick={() => displayExpense.receiptUrl && setIsImageExpanded(true)}
                >
                    {displayExpense.receiptUrl ? (
                        isPdf ? (
                            <div className="relative w-full h-[240px]">
                                {/* Overlay to capture clicks ensures expansion works reliably */}
                                <div className="absolute inset-0 z-10 bg-transparent"></div>
                                <iframe 
                                    src={`${displayExpense.receiptUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                                    className="w-full h-full border-0" 
                                    title="PDF Preview" 
                                />
                                <div className="absolute top-2 right-2 z-20 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                    <FileText size={12} /> PDF
                                </div>
                            </div>
                        ) : (
                            <>
                                <img src={displayExpense.receiptUrl} alt="Receipt" className="w-full h-auto object-contain max-h-[300px]" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-white/90 rounded-full p-2 shadow-sm">
                                        <ZoomIn size={20} className="text-gray-700" />
                                    </div>
                                </div>
                            </>
                        )
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center p-4 text-center">
                            <span className="text-sm">No Receipt Image</span>
                        </div>
                    )}
                </div>

                {/* Type Toggle (Business vs Personal) */}
                <div className="mb-6 bg-gray-100 p-1 rounded-lg flex">
                    <button
                        onClick={() => handleChange('isPersonalExpense', false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${!isPersonal ? 'bg-white text-brand-green shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Briefcase size={16} />
                        Business
                    </button>
                    <button
                        onClick={() => handleChange('isPersonalExpense', true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${isPersonal ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User size={16} />
                        Personal
                    </button>
                </div>

                {isPersonal && (
                    <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Not Reimbursable</p>
                        <p className="text-sm text-gray-600">This amount will be excluded from the report total.</p>
                    </div>
                )}

                {/* Form Fields */}
                <div className={`space-y-5 flex-1 ${isPersonal ? 'opacity-75' : ''}`}>
                    
                    {/* Merchant */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Merchant
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-green">
                                <MapPin size={16} />
                            </div>
                            <input 
                                type="text"
                                value={displayExpense.merchant}
                                onChange={(e) => handleChange('merchant', e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green focus:outline-none text-sm text-gray-800 transition-all shadow-sm"
                                placeholder="Merchant Name"
                            />
                        </div>
                    </div>

                    {/* Amount, Tax & Currency */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Amount
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-green">
                                    <DollarSign size={16} />
                                </div>
                                <input 
                                    type="number"
                                    value={displayExpense.amount}
                                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green focus:outline-none text-sm transition-all shadow-sm font-mono ${isPersonal ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Currency
                            </label>
                             <select 
                                value={displayExpense.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green focus:outline-none text-sm text-gray-800 transition-all shadow-sm"
                             >
                                <option value="CNY">CNY</option>
                                <option value="USD">USD</option>
                                <option value="JPY">JPY</option>
                                <option value="KRW">KRW</option>
                                <option value="THB">THB</option>
                             </select>
                        </div>
                    </div>

                    {/* Tax Field */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Tax
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-green">
                                <DollarSign size={16} />
                            </div>
                            <input 
                                type="number"
                                value={displayExpense.tax || ''}
                                onChange={(e) => handleChange('tax', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green focus:outline-none text-sm text-gray-800 transition-all shadow-sm font-mono"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Date
                        </label>
                        <div className="relative group">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-green">
                                <Calendar size={16} />
                            </div>
                            <input 
                                type="date"
                                value={displayExpense.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green focus:outline-none text-sm text-gray-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Category
                        </label>
                        <div className="relative group">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-green">
                                <Tag size={16} />
                            </div>
                            <select 
                                value={displayExpense.category || ""}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green focus:outline-none text-sm transition-all shadow-sm appearance-none ${!displayExpense.category ? 'border-red-300 text-red-500' : 'border-gray-200 text-gray-800'}`}
                            >
                                <option value="">Select Category...</option>
                                <option value="Travel">Travel</option>
                                <option value="Meals">Meals</option>
                                <option value="Office">Office</option>
                                <option value="Transport">Transport</option>
                                <option value="Lodging">Lodging</option>
                                <option value="Other">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {!displayExpense.category && (
                            <p className="text-xs text-red-500 mt-1.5 pl-1">Category is required.</p>
                        )}

                        {/* Smart Suggestion Cue */}
                        {showSmartSuggestion && (
                            <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg p-2.5 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 cursor-pointer hover:bg-yellow-100 transition-colors" onClick={applySmartCategory}>
                                <Lightbulb className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-xs font-bold text-yellow-800">Smart Recall</p>
                                    <p className="text-xs text-yellow-700">
                                        You usually categorize <span className="font-medium">"{displayExpense.merchant}"</span> as <span className="font-medium">Meals</span>. 
                                        <span className="underline ml-1">Apply?</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                    <button 
                        onClick={onClose}
                        className="w-full bg-brand-green hover:bg-green-600 text-white font-medium py-2.5 rounded-lg shadow transition-colors"
                    >
                        Done
                    </button>
                    
                    {onDelete && (
                        <button 
                            onClick={onDelete}
                            className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete Expense
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Full Screen Modal */}
        {isImageExpanded && displayExpense.receiptUrl && (
            <div 
                className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={() => setIsImageExpanded(false)}
            >
                <button 
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20 z-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsImageExpanded(false);
                    }}
                >
                    <X size={24} />
                </button>
                
                {isPdf ? (
                     <div 
                        className="w-full h-full max-w-5xl bg-white rounded-lg overflow-hidden shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                     >
                         <iframe 
                             src={displayExpense.receiptUrl} 
                             className="w-full h-full border-0" 
                             title="PDF Full View" 
                         />
                     </div>
                ) : (
                    <img 
                        src={displayExpense.receiptUrl} 
                        alt="Receipt Full View" 
                        className="max-w-full max-h-full object-contain rounded shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </div>
        )}
    </>
  );
};

export default ExpenseDetailPanel;