import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { CreditCardTransaction } from '../types';
import { parseStatement, saveTransactions } from '../services/reconciliationService';
import { parseBillPDF, parseBillText } from '../services/billParserService';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onImportComplete: (transactions: CreditCardTransaction[]) => void;
}

const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  onClose,
  userId,
  onImportComplete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<CreditCardTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    const statementFile = files.find((f: File) => {
      const fileName = f.name.toLowerCase();
      return fileName.endsWith('.pdf') ||
             fileName.endsWith('.csv') || 
             fileName.endsWith('.xlsx') || 
             fileName.endsWith('.xls');
    });
    if (statementFile) {
      handleFileUpload(statementFile);
    } else {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    const fileName = file.name.toLowerCase();
    setIsProcessing(true);
    setError(null);

    try {
      let transactions: CreditCardTransaction[] = [];
      
      // Handle PDF files with LLM parsing
      if (fileName.endsWith('.pdf')) {
        console.log('Parsing PDF with LLM...');
        const arrayBuffer = await file.arrayBuffer();
        // Convert ArrayBuffer to base64 more efficiently
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        const result = await parseBillPDF(base64, 'application/pdf');
        transactions = result.transactions;
        console.log(`Parsed ${transactions.length} transactions from PDF`);
      }
      // Handle CSV/Excel files
      else if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Try structured parsing first
        try {
          transactions = await parseStatement(file);
        } catch (parseError) {
          console.warn('Structured parsing failed, trying LLM text parsing...', parseError);
          // Fallback: Read as text and use LLM
          const text = await file.text();
          const result = await parseBillText(text);
          transactions = result.transactions;
        }
      } else {
        setError('Unsupported file format. Please upload PDF, CSV, or Excel files.');
        setIsProcessing(false);
        return;
      }
      
      if (transactions.length === 0) {
        setError('No transactions found in the file. Please check the format. Make sure your file contains transaction data. Check the browser console for detailed error messages.');
        setIsProcessing(false);
        return;
      }

      // Set userId for all transactions
      const transactionsWithUserId = transactions.map(t => ({
        ...t,
        userId
      }));

      setImportedTransactions(transactionsWithUserId);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setError(err.message || 'Failed to parse file. Please check the format and try again.');
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (importedTransactions.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log(`Starting import of ${importedTransactions.length} transactions...`);
      const { data, error } = await saveTransactions(importedTransactions, userId);
      
      if (error) {
        console.error('Save error:', error);
        const errorMessage = error.message || error.details || JSON.stringify(error);
        setError(`Failed to save transactions: ${errorMessage}. Please check if the database fields are up to date.`);
        setIsProcessing(false);
        return;
      }

      if (data) {
        console.log(`Successfully imported ${data.length} transactions`);
        onImportComplete(data);
        setImportedTransactions([]);
        setIsProcessing(false);
        onClose();
      } else {
        setError('No data returned from save operation');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Failed to save transactions:', err);
      setError(err.message || 'Failed to save transactions. Please check the browser console for details.');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setImportedTransactions([]);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-brand-green" />
            <h2 className="text-xl font-bold text-gray-900">Import Credit Card Statement</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {importedTransactions.length === 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Upload your credit card statement to automatically match transactions with your expenses.
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, CSV (.csv), and Excel (.xlsx, .xls) files from any bank. 
                  AI will automatically parse and normalize the data regardless of bank format.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-brand-green bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-brand-green' : 'text-gray-400'}`} />
                <p className="text-gray-700 font-medium mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your PDF, CSV or Excel file here'}
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label className="inline-block px-4 py-2 bg-brand-green text-white rounded-lg cursor-pointer hover:bg-green-600 transition-colors">
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf,.csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Successfully parsed {importedTransactions.length} transactions
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview (first 5 transactions):</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Merchant</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importedTransactions.slice(0, 5).map((t, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-700">
                              {new Date(t.date).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-xs">
                              {t.merchant}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-700 text-right">
                              ${t.amount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500 capitalize">
                              {t.transactionType}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {importedTransactions.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... and {importedTransactions.length - 5} more transactions
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          {importedTransactions.length > 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing || importedTransactions.length === 0}
              className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing {importedTransactions.length} transactions...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Import {importedTransactions.length} Transactions
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReconciliationModal;

