import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, DollarSign, Tag, Map } from 'lucide-react';
import { useReimbursementWizard } from '../../contexts/ReimbursementWizardContext';
import { fadeVariants, scaleVariants } from '../../utils/animations';

const WizardStepReview: React.FC = () => {
  const { selectedExpenses } = useReimbursementWizard();

  // Calculate summary
  const summary = useMemo(() => {
    const totalsByCurrency: Record<string, number> = {};
    const categories: Record<string, number> = {};
    const dateRange = {
      min: new Date(selectedExpenses[0]?.date || Date.now()),
      max: new Date(selectedExpenses[0]?.date || Date.now()),
    };

    selectedExpenses.forEach(expense => {
      // Totals by currency
      totalsByCurrency[expense.currency] = (totalsByCurrency[expense.currency] || 0) + expense.amount;
      
      // Categories
      const category = expense.category || 'Other';
      categories[category] = (categories[category] || 0) + expense.amount;

      // Date range
      const expenseDate = new Date(expense.date);
      if (expenseDate < dateRange.min) dateRange.min = expenseDate;
      if (expenseDate > dateRange.max) dateRange.max = expenseDate;
    });

    return {
      totalExpenses: selectedExpenses.length,
      totalsByCurrency,
      categories,
      dateRange,
    };
  }, [selectedExpenses]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">预览报销单</h3>
        <p className="text-sm text-gray-500">
          请检查以下信息，确认无误后提交报销单。
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={scaleVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">发票数量</p>
              <p className="text-xl font-bold text-gray-900">{summary.totalExpenses}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleVariants}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">总金额</p>
              <div className="text-xl font-bold text-gray-900">
                {Object.entries(summary.totalsByCurrency).map(([currency, amount]) => (
                  <div key={currency}>{currency} {amount.toFixed(2)}</div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleVariants}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="bg-purple-50 border border-purple-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">日期范围</p>
              <p className="text-sm font-bold text-gray-900">
                {summary.dateRange.min.toLocaleDateString()} - {summary.dateRange.max.toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Categories Breakdown */}
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        className="bg-white border border-gray-200 rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Tag size={18} className="text-gray-400" />
          <h4 className="font-semibold text-gray-900">分类汇总</h4>
        </div>
        <div className="space-y-2">
          {Object.entries(summary.categories)
            .sort(([, a], [, b]) => b - a)
            .map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedExpenses[0]?.currency || 'CNY'} {amount.toFixed(2)}
                </span>
              </div>
            ))}
        </div>
      </motion.div>

      {/* Expense List Preview */}
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      >
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">发票列表</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {selectedExpenses.slice(0, 10).map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {expense.merchant}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                    {expense.category && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {expense.category}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 ml-4">
                  {expense.currency} {expense.amount.toFixed(2)}
                </span>
              </motion.div>
            ))}
          </div>
          {selectedExpenses.length > 10 && (
            <div className="px-4 py-3 text-center text-sm text-gray-500 bg-gray-50">
              还有 {selectedExpenses.length - 10} 张发票...
            </div>
          )}
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <p className="text-sm text-blue-800">
          💡 提交后，报销单将进入审批流程。审批通过后会自动生成会计凭证。
        </p>
      </motion.div>
    </div>
  );
};

export default WizardStepReview;

