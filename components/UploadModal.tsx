import React, { useCallback, useState } from 'react';
import { X, UploadCloud, Loader2, AlertCircle, CreditCard, Mail, FileText } from 'lucide-react';
import { parseReceiptImage } from '../services/geminiService';
import { Expense } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Expense) => void;
  credits: number;
  onConsumeCredit: (amount: number) => void;
  onOpenBuyCredits: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddExpense, credits, onConsumeCredit, onOpenBuyCredits }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState({ current: 0, total: 0 });
  const [oversizedUploadCount, setOversizedUploadCount] = useState<number | null>(null);

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

    let successfulUploads = 0;

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

        onAddExpense(newExpense);
        successfulUploads++;
      } catch (error) {
        console.error(`Failed to process file ${file.name}`, error);
      }
    }

    if (successfulUploads > 0) {
       onConsumeCredit(successfulUploads);
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

        {oversizedUploadCount !== null ? (
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