import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, CheckSquare, Square } from 'lucide-react';
import { useReimbursementWizard } from '../../contexts/ReimbursementWizardContext';
import { fadeVariants, cardFlyInVariants } from '../../utils/animations';

const WizardStepSelect: React.FC = () => {
  const {
    availableExpenses,
    selectedExpenses,
    toggleExpense,
    selectAllExpenses,
    deselectAllExpenses,
  } = useReimbursementWizard();

  const selectedIds = new Set(selectedExpenses.map(e => e.id));
  const allSelected = availableExpenses.length > 0 && selectedExpenses.length === availableExpenses.length;

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    selectedExpenses.forEach(expense => {
      totals[expense.currency] = (totals[expense.currency] || 0) + expense.amount;
    });
    return totals;
  }, [selectedExpenses]);

  const totalEntries = Object.entries(totalsByCurrency);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">选择要报销的发票</h3>
        <p className="text-sm text-gray-500">
          已自动过滤个人支出和无效发票。您可以选择全部或部分发票进行报销。
        </p>
      </div>

      {/* Summary Card */}
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-r from-brand-green/10 to-green-50 rounded-lg p-4 border border-green-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">已选择</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {selectedExpenses.length} / {availableExpenses.length} 张发票
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">总金额</p>
            <div className="mt-1">
              {totalEntries.length === 0 ? (
                <p className="text-2xl font-bold text-gray-900">¥0.00</p>
              ) : (
                totalEntries.map(([currency, amount]) => (
                  <p key={currency} className="text-2xl font-bold text-gray-900">
                    {currency} {amount.toFixed(2)}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Select All Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={allSelected ? deselectAllExpenses : selectAllExpenses}
          className="flex items-center gap-2 text-sm text-brand-green hover:text-green-700 font-medium"
        >
          {allSelected ? (
            <>
              <CheckSquare size={18} />
              取消全选
            </>
          ) : (
            <>
              <Square size={18} />
              全选
            </>
          )}
        </button>
        <span className="text-xs text-gray-500">
          共 {availableExpenses.length} 张可报销发票
        </span>
      </div>

      {/* Expense List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        {availableExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>没有可报销的发票</p>
            <p className="text-sm mt-2">请先上传发票</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {availableExpenses.map((expense, index) => {
              const isSelected = selectedIds.has(expense.id);
              return (
                <motion.div
                  key={expense.id}
                  variants={cardFlyInVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  onClick={() => toggleExpense(expense.id)}
                  className={`
                    p-4 cursor-pointer transition-colors hover:bg-gray-50
                    ${isSelected ? 'bg-green-50 border-l-4 border-l-brand-green' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="text-brand-green" size={24} />
                      ) : (
                        <Circle className="text-gray-300" size={24} />
                      )}
                    </div>

                    {/* Expense Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {expense.merchant}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 ml-4">
                          {expense.currency} {expense.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        {expense.category && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                            {expense.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      {selectedExpenses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <p className="text-sm text-blue-800">
            💡 请至少选择一张发票才能继续
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default WizardStepSelect;

