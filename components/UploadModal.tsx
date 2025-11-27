import React, { useCallback, useState } from 'react';
import { X, UploadCloud, Loader2, AlertCircle, CreditCard, Mail, FileText, AlertTriangle } from 'lucide-react';
import { parseReceiptImage } from '../services/geminiService';
import { Expense } from '../types';
import { findDuplicateExpenses, DuplicateMatch } from '../services/duplicateService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Expense) => void;
  credits: number;
  onConsumeCredit: (amount: number) => void;
  onOpenBuyCredits: () => void;
  existingExpenses: Expense[]; // Add existing expenses for duplicate check
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddExpense, credits, onConsumeCredit, onOpenBuyCredits, existingExpenses }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState({ current: 0, total: 0 });
  const [oversizedUploadCount, setOversizedUploadCount] = useState<number | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    expense: Expense;
    duplicates: DuplicateMatch[];
  } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [processedExpenses, setProcessedExpenses] = useState<Expense[]>([]);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // 1. Credit Check
    if (fileArray.length > credits) {
      setOversizedUploadCount(fileArray.length);
      return;
    }

    setIsProcessing(true);
    setProcessingCount({ current: 0, total: fileArray.length });

    // Process all files first
    const processedExpenses: Expense[] = [];
    let currentIndex = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProcessingCount({ current: i + 1, total: fileArray.length });
      
      try {
        const base64String = await readFileAsBase64(file);
        
        // Detect type for rendering and processing
        const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
        const parsedData = await parseReceiptImage(base64String, file.type);
        
        const newExpense: Expense = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: parsedData.date || new Date().toISOString(),
          merchant: parsedData.merchant || "Unknown",
          buyerName: parsedData.buyerName,
          buyerTaxId: parsedData.buyerTaxId,
          amount: parsedData.amount || 0,
          currency: parsedData.currency || "CNY",
          tax: parsedData.tax || 0,
          category: parsedData.category,
          status: parsedData.status || 'valid',
          warningMessage: parsedData.warningMessage,
          selected: false,
          receiptUrl: URL.createObjectURL(file),
          fileType: fileType
        };

        // Check for duplicates
        const duplicates = findDuplicateExpenses(newExpense, existingExpenses);
        
        if (duplicates.length > 0) {
          // Show duplicate warning and pause processing
          setDuplicateWarning({ expense: newExpense, duplicates });
          setPendingFiles(fileArray.slice(i + 1));
          setProcessedExpenses(processedExpenses);
          setIsProcessing(false);
          return; // Wait for user decision
        }

        processedExpenses.push(newExpense);
      } catch (error) {
        console.error(`Failed to process file ${file.name}`, error);
      }
    }

    // If we get here, no duplicates were found - add all expenses
    if (processedExpenses.length > 0) {
      processedExpenses.forEach(expense => onAddExpense(expense));
      onConsumeCredit(processedExpenses.length, 'scan');
    }

    setIsProcessing(false);
    onClose();
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [credits]); 

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDuplicateContinue = async () => {
    if (!duplicateWarning) return;

    // Add the duplicate expense
    onAddExpense(duplicateWarning.expense);
    
    // Add already processed expenses
    if (processedExpenses.length > 0) {
      processedExpenses.forEach(expense => onAddExpense(expense));
    }
    
    const currentExpense = duplicateWarning.expense;
    const currentProcessed = processedExpenses;
    setDuplicateWarning(null);
    
    // Continue processing remaining files if any
    if (pendingFiles.length > 0) {
      setIsProcessing(true);
      setProcessingCount({ current: 0, total: pendingFiles.length });
      
      const remainingFiles = [...pendingFiles];
      const newProcessedExpenses: Expense[] = [...currentProcessed, currentExpense];
      setPendingFiles([]);
      setProcessedExpenses([]);
      
      let successfulUploads = newProcessedExpenses.length;
      
      for (let i = 0; i < remainingFiles.length; i++) {
        const file = remainingFiles[i];
        setProcessingCount({ current: i + 1, total: remainingFiles.length });
        
        try {
          const base64String = await readFileAsBase64(file);
          const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
          const parsedData = await parseReceiptImage(base64String, file.type);
          
          const newExpense: Expense = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: parsedData.date || new Date().toISOString(),
            merchant: parsedData.merchant || "Unknown",
            amount: parsedData.amount || 0,
            currency: parsedData.currency || "CNY",
            tax: parsedData.tax || 0,
            category: parsedData.category,
            status: parsedData.status || 'valid',
            warningMessage: parsedData.warningMessage,
            selected: false,
            receiptUrl: URL.createObjectURL(file),
            fileType: fileType
          };

          // Check for duplicates again (including expenses we just added)
          const updatedExpenses = [...existingExpenses, ...newProcessedExpenses];
          const duplicates = findDuplicateExpenses(newExpense, updatedExpenses);
          
          if (duplicates.length > 0) {
            // Another duplicate found - show warning again
            setDuplicateWarning({ expense: newExpense, duplicates });
            setPendingFiles(remainingFiles.slice(i + 1));
            setProcessedExpenses(newProcessedExpenses);
            setIsProcessing(false);
            return;
          }

          newProcessedExpenses.push(newExpense);
          onAddExpense(newExpense);
          successfulUploads++;
        } catch (error) {
          console.error(`Failed to process file ${file.name}`, error);
        }
      }
      
      if (successfulUploads > 0) {
        onConsumeCredit(successfulUploads, 'scan');
      }
    } else {
      // No more files, just consume credit for the one we added
      onConsumeCredit(1, 'scan');
    }
    
    setIsProcessing(false);
    setPendingFiles([]);
    setProcessedExpenses([]);
    onClose();
  };

  const handleDuplicateCancel = () => {
    setDuplicateWarning(null);
    setPendingFiles([]);
    setProcessedExpenses([]);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {duplicateWarning ? (
          <div className="py-4">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Possible Duplicate Invoice</h2>
              <p className="text-gray-600 mb-4">
                This invoice may be a duplicate of an existing expense.
              </p>
              
              {/* Show duplicate details */}
              <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-2">New Invoice:</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Merchant:</span> {duplicateWarning.expense.merchant}</p>
                  <p><span className="font-medium">Amount:</span> {duplicateWarning.expense.currency} {duplicateWarning.expense.amount.toFixed(2)}</p>
                  <p><span className="font-medium">Date:</span> {new Date(duplicateWarning.expense.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Similar Existing Invoice{duplicateWarning.duplicates.length > 1 ? 's' : ''}:</p>
                <div className="space-y-3">
                  {duplicateWarning.duplicates.slice(0, 3).map((dup, idx) => (
                    <div key={idx} className="text-sm text-gray-700 border-l-2 border-yellow-400 pl-3">
                      <p><span className="font-medium">Merchant:</span> {dup.expense.merchant}</p>
                      <p><span className="font-medium">Amount:</span> {dup.expense.currency} {dup.expense.amount.toFixed(2)}</p>
                      <p><span className="font-medium">Date:</span> {new Date(dup.expense.date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Match: {dup.reason} ({(dup.similarity * 100).toFixed(0)}% similar)</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to add this invoice? It may result in duplicate reimbursement.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDuplicateContinue}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle size={18} />
                Yes, Add Anyway
              </button>
              <button 
                onClick={handleDuplicateCancel}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : oversizedUploadCount !== null ? (
           <div className="py-4">
             <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Insufficient Credits</h2>
                <p className="text-gray-600">
                  You selected <span className="font-bold text-gray-900">{oversizedUploadCount}</span> items, but only have <span className="font-bold text-brand-green">{credits}</span> credits remaining.
                </p>
             </div>
             
             <div className="flex flex-col gap-3">
                <button 
                  onClick={onOpenBuyCredits}
                  className="w-full bg-brand-green hover:bg-green-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard size={18} />
                  Buy More Credits
                </button>
                <button 
                  onClick={() => setOversizedUploadCount(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                >
                  Adjust Selection
                </button>
             </div>
           </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Receipts</h2>
            
            {credits === 0 ? (
                <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="text-red-500 shrink-0" />
                    <div>
                        <p className="text-sm text-red-800 font-bold">Out of Credits</p>
                        <p className="text-xs text-red-600 mt-1">You have 0 credits remaining. Please buy more credits to continue processing invoices.</p>
                    </div>
                </div>
            ) : (
                <p className="text-gray-500 mb-6">We'll use AI to automatically extract details. Cost: 1 credit per invoice.</p>
            )}

            <div
              onDrop={credits > 0 ? onDrop : undefined}
              onDragOver={credits > 0 ? onDragOver : undefined}
              onDragLeave={credits > 0 ? onDragLeave : undefined}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200
                ${isDragging ? 'border-brand-green bg-green-50 scale-105' : 'border-gray-300 hover:border-brand-green/50'}
                ${isProcessing || credits === 0 ? 'pointer-events-none opacity-60' : ''}
              `}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="animate-spin text-brand-green mb-4" size={48} />
                  <p className="text-gray-900 font-medium">Analyzing documents...</p>
                  <p className="text-sm text-gray-500 mt-1">Processed {processingCount.current} of {processingCount.total}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-green-100 text-brand-green rounded-full flex items-center justify-center mb-4">
                    <UploadCloud size={32} />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-1">Drag & Drop or Click to Upload</p>
                  <p className="text-sm text-gray-400 mb-6">Supports JPG, PNG, PDF (Max 10MB)</p>
                  
                  <label className={`bg-brand-green hover:bg-green-600 text-white font-medium py-2.5 px-6 rounded-full cursor-pointer transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${credits === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    Browse Files
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,application/pdf" 
                        multiple 
                        onChange={handleFileInput} 
                        disabled={credits === 0}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Inbox Zero Tip */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="bg-blue-50 rounded-lg p-3 flex gap-3 items-start">
                    <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full mt-0.5">
                        <Mail size={14} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-900 mb-0.5">Inbox Zero Tip</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Hate downloading files? Forward email receipts directly to <span className="font-mono bg-blue-100 px-1 rounded">goodfoodgramz@inbox.yeahzea.com</span> and they'll appear here automatically.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-400">Powered by Google Gemini</p>
                <p className="text-xs font-semibold text-gray-500">Available Credits: {credits}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadModal;