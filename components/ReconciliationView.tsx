import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertCircle, XCircle, Download, RefreshCw, Link2, Unlink, Upload } from 'lucide-react';
import { BankReconciliation, CreditCardTransaction, Expense, MatchResult } from '../types';
import { updateTransactionMatch } from '../services/reconciliationService';
import { generateExpenseReportPDF } from '../services/pdfService';

interface ReconciliationViewProps {
  reconciliation: BankReconciliation;
  userId: string;
  onRefresh: () => void;
  onMatchUpdate: () => void;
  onImportClick: () => void;
}

const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  reconciliation,
  userId,
  onRefresh,
  onMatchUpdate,
  onImportClick
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'matched' | 'pending' | 'unmatched'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleConfirmMatch = async (match: MatchResult) => {
    setIsUpdating(match.transaction.id);
    try {
      const { error } = await updateTransactionMatch(
        match.transaction.id,
        match.expense.id,
        'matched',
        match.confidence
      );
      if (!error) {
        onMatchUpdate();
      }
    } catch (err) {
      console.error('Failed to confirm match:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRejectMatch = async (transactionId: string) => {
    setIsUpdating(transactionId);
    try {
      const { error } = await updateTransactionMatch(transactionId, null, 'unmatched');
      if (!error) {
        onMatchUpdate();
      }
    } catch (err) {
      console.error('Failed to reject match:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleExportReport = async () => {
    const matchedExpenses = reconciliation.matches
      .filter(m => m.confidence >= 0.8)
      .map(m => m.expense);
    
    if (matchedExpenses.length === 0) {
      alert('No matched expenses to export');
      return;
    }

    const totalAmount = matchedExpenses.reduce((sum, e) => sum + e.amount, 0);
    await generateExpenseReportPDF(
      matchedExpenses,
      `Bank Reconciliation Report - ${new Date().toLocaleDateString()}`,
      totalAmount
    );
  };

  const filteredMatches = useMemo(() => {
    switch (selectedTab) {
      case 'matched':
        return reconciliation.matches.filter(m => m.confidence >= 0.8);
      case 'pending':
        return reconciliation.matches.filter(m => m.confidence < 0.8);
      case 'unmatched':
        return [];
      default:
        return reconciliation.matches;
    }
  }, [reconciliation.matches, selectedTab]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
            <p className="text-sm text-gray-500 mt-1">
              Match credit card transactions with your expenses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onImportClick}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              Import Statement
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleExportReport}
              className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Transactions</div>
            <div className="text-2xl font-bold text-blue-900">{reconciliation.summary.totalTransactions}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Matched</div>
            <div className="text-2xl font-bold text-green-900">{reconciliation.summary.matchedCount}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-600 font-medium mb-1">Pending Review</div>
            <div className="text-2xl font-bold text-yellow-900">{reconciliation.summary.pendingCount}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium mb-1">Unmatched</div>
            <div className="text-2xl font-bold text-red-900">{reconciliation.summary.unmatchedTransactionCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'All Matches', count: reconciliation.matches.length },
            { id: 'matched', label: 'Matched', count: reconciliation.summary.matchedCount },
            { id: 'pending', label: 'Pending', count: reconciliation.summary.pendingCount },
            { id: 'unmatched', label: 'Unmatched', count: reconciliation.summary.unmatchedTransactionCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedTab === 'unmatched' ? (
          <div className="space-y-4">
            {/* Unmatched Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Unmatched Transactions ({reconciliation.unmatchedTransactions.length})
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Merchant</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reconciliation.unmatchedTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(t.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{t.merchant}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            ${t.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                            {t.transactionType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Unmatched Expenses */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Unmatched Expenses ({reconciliation.unmatchedExpenses.length})
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Merchant</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reconciliation.unmatchedExpenses.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(e.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{e.merchant}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            {e.currency}${e.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{e.category || 'Uncategorized'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No matches found</p>
              </div>
            ) : (
              filteredMatches.map((match, index) => (
                <div
                  key={`${match.transaction.id}-${match.expense.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      {/* Transaction */}
                      <div className="border-r border-gray-200 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Credit Card Transaction</span>
                          {match.matchType === 'exact' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Exact</span>
                          )}
                          {match.matchType === 'fuzzy' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Fuzzy</span>
                          )}
                          {match.matchType === 'partial' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Partial</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{match.transaction.merchant}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(match.transaction.date).toLocaleDateString()} • ${match.transaction.amount.toFixed(2)}
                        </div>
                      </div>

                      {/* Expense */}
                      <div className="pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Expense</span>
                          <span className="text-xs text-gray-400">
                            {(match.confidence * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{match.expense.merchant}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(match.expense.date).toLocaleDateString()} • {match.expense.currency}${match.expense.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {match.reasons.join(' • ')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {match.confidence >= 0.8 ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="text-sm font-medium">Matched</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleConfirmMatch(match)}
                            disabled={isUpdating === match.transaction.id}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                          >
                            <Link2 size={14} />
                            Confirm
                          </button>
                          <button
                            onClick={() => handleRejectMatch(match.transaction.id)}
                            disabled={isUpdating === match.transaction.id}
                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                          >
                            <Unlink size={14} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconciliationView;

