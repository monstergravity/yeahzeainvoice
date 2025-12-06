import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, SkipForward } from 'lucide-react';
import { useReimbursementWizard } from '../../contexts/ReimbursementWizardContext';
import { fadeVariants, pulseVariants } from '../../utils/animations';

interface WizardStepAuditProps {
  onRunAudit?: (expenseIds: string[]) => Promise<void>;
  credits?: number;
}

const WizardStepAudit: React.FC<WizardStepAuditProps> = ({
  onRunAudit,
  credits = 0,
}) => {
  const { selectedExpenses } = useReimbursementWizard();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<Map<string, { isPersonal: boolean; warning?: string }>>(new Map());
  const [skipped, setSkipped] = useState(false);

  const handleRunAudit = async () => {
    if (!onRunAudit) return;
    
    setIsAuditing(true);
    try {
      await onRunAudit(selectedExpenses.map(e => e.id));
      // Simulate audit results (in real implementation, this would come from the audit function)
      const results = new Map();
      selectedExpenses.forEach(expense => {
        results.set(expense.id, {
          isPersonal: expense.isPersonalExpense || false,
          warning: expense.auditWarning,
        });
      });
      setAuditResults(results);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
  };

  const auditedExpenses = Array.from(auditResults.keys());
  const personalExpenses = Array.from(auditResults.values()).filter(r => r.isPersonal).length;
  const hasWarnings = Array.from(auditResults.values()).some(r => r.warning);

  if (skipped) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <SkipForward className="text-gray-400" size={32} />
        </div>
        <p className="text-gray-600">已跳过 AI 审计</p>
        <p className="text-sm text-gray-500 mt-2">您可以继续下一步</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 审计（可选）</h3>
        <p className="text-sm text-gray-500">
          检测个人支出（如酒精、烟草等），确保报销合规性。每张发票消耗 2 个 credits。
        </p>
      </div>

      {/* Credit Check */}
      {credits < selectedExpenses.length * 2 && (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle size={20} />
            <div>
              <p className="text-sm font-medium">Credits 不足</p>
              <p className="text-xs mt-1">
                需要 {selectedExpenses.length * 2} credits，当前有 {credits} credits
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Audit Status */}
      {isAuditing ? (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          className="text-center py-12"
        >
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Loader2 className="text-blue-600 animate-spin" size={32} />
          </motion.div>
          <p className="text-gray-900 font-medium">正在审计发票...</p>
          <p className="text-sm text-gray-500 mt-2">
            已审计 {auditedExpenses.length} / {selectedExpenses.length} 张
          </p>
        </motion.div>
      ) : auditedExpenses.length > 0 ? (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Audit Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">审计完成</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {selectedExpenses.length - personalExpenses} / {selectedExpenses.length} 张可报销
                </p>
              </div>
              {personalExpenses > 0 && (
                <div className="text-right">
                  <p className="text-sm text-red-600 font-medium">
                    {personalExpenses} 张个人支出
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedExpenses.map((expense, index) => {
              const result = auditResults.get(expense.id);
              const isPersonal = result?.isPersonal || false;
              const hasWarning = !!result?.warning;

              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border
                    ${isPersonal ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {isPersonal ? (
                      <XCircle className="text-red-500" size={20} />
                    ) : (
                      <CheckCircle2 className="text-green-500" size={20} />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.merchant}</p>
                      {hasWarning && (
                        <p className="text-xs text-yellow-700 mt-1">{result?.warning}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {expense.currency} {expense.amount.toFixed(2)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-600 mb-6">尚未进行 AI 审计</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRunAudit}
              disabled={credits < selectedExpenses.length * 2}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all
                ${
                  credits >= selectedExpenses.length * 2
                    ? 'bg-brand-green hover:bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              运行审计
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              跳过
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WizardStepAudit;

