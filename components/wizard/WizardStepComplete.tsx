import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, FileText, ArrowRight } from 'lucide-react';
import { useReimbursementWizard } from '../../contexts/ReimbursementWizardContext';
import { bounceVariants, fadeVariants, slideUpVariants } from '../../utils/animations';

interface WizardStepCompleteProps {
  onClose: () => void;
  onDownloadReport?: () => void;
}

const WizardStepComplete: React.FC<WizardStepCompleteProps> = ({
  onClose,
  onDownloadReport,
}) => {
  const { selectedExpenses, wizardState } = useReimbursementWizard();

  const totalAmount = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const currency = selectedExpenses[0]?.currency || 'CNY';

  useEffect(() => {
    // Auto-download report after 1 second if available
    if (onDownloadReport) {
      const timer = setTimeout(() => {
        onDownloadReport();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onDownloadReport]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeVariants}
      className="text-center py-12"
    >
      {/* Success Icon */}
      <motion.div
        variants={bounceVariants}
        initial="hidden"
        animate="visible"
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="text-green-600" size={48} />
      </motion.div>

      {/* Success Message */}
      <motion.h3
        variants={slideUpVariants}
        initial="hidden"
        animate="visible"
        className="text-2xl font-bold text-gray-900 mb-2"
      >
        报销单已提交成功！
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-600 mb-6"
      >
        您的报销单已成功提交，等待审批中
      </motion.p>

      {/* Summary */}
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6 max-w-md mx-auto"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">发票数量</span>
            <span className="text-lg font-bold text-gray-900">{selectedExpenses.length} 张</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">总金额</span>
            <span className="text-lg font-bold text-gray-900">
              {currency} {totalAmount.toFixed(2)}
            </span>
          </div>
          {wizardState.reimbursementRequest && (
            <div className="flex items-center justify-between pt-3 border-t border-green-200">
              <span className="text-sm text-gray-600">报销单号</span>
              <span className="text-sm font-mono text-gray-900">
                {wizardState.reimbursementRequest.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        {onDownloadReport && (
          <button
            onClick={onDownloadReport}
            className="px-6 py-3 bg-white border-2 border-brand-green text-brand-green rounded-lg font-medium hover:bg-green-50 transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} />
            下载报销单
          </button>
        )}
        <button
          onClick={onClose}
          className="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-green-600 transition-all flex items-center justify-center gap-2"
        >
          返回主页
          <ArrowRight size={18} />
        </button>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto"
      >
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 mt-0.5" size={18} />
          <div className="text-left">
            <p className="text-sm font-medium text-blue-900 mb-1">下一步</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• 等待审批人审核您的报销单</li>
              <li>• 审批通过后会自动生成会计凭证</li>
              <li>• 您可以在"报销单"页面查看状态</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WizardStepComplete;

