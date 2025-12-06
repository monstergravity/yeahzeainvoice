import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useReimbursementWizard } from '../contexts/ReimbursementWizardContext';
import { slideUpVariants, fadeVariants } from '../utils/animations';
import WizardStepSelect from './wizard/WizardStepSelect';
import WizardStepClassify from './wizard/WizardStepClassify';
import WizardStepAudit from './wizard/WizardStepAudit';
import WizardStepReview from './wizard/WizardStepReview';
import WizardStepComplete from './wizard/WizardStepComplete';

interface ReimbursementWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (expenseIds: string[]) => void;
}

const ReimbursementWizard: React.FC<ReimbursementWizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    wizardState,
    nextStep,
    previousStep,
    canProceed,
    isFirstStep,
    isLastStep,
    resetWizard,
  } = useReimbursementWizard();

  const steps = [
    { id: 'select' as const, label: '选择发票', description: '选择要报销的发票' },
    { id: 'classify' as const, label: '分类分组', description: '自动分类并分组到行程' },
    { id: 'audit' as const, label: 'AI 审计', description: '检测个人支出（可选）' },
    { id: 'review' as const, label: '预览确认', description: '检查报销单详情' },
    { id: 'complete' as const, label: '完成', description: '提交成功' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === wizardState.currentStep);
  const currentStep = steps[currentStepIndex];

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleNext = () => {
    console.log('handleNext called', { 
      currentStep: wizardState.currentStep, 
      isLastStep,
      selectedCount: wizardState.selectedExpenses.length 
    });
    
    if (isLastStep) {
      // Submit if on last step
      if (onSubmit) {
        onSubmit(wizardState.selectedExpenses.map(e => e.id));
      }
    } else {
      console.log('Calling nextStep');
      nextStep();
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    try {
      switch (wizardState.currentStep) {
        case 'select':
          return <WizardStepSelect />;
        case 'classify':
          return <WizardStepClassify />;
        case 'audit':
          return <WizardStepAudit />;
        case 'review':
          return <WizardStepReview />;
        case 'complete':
          return <WizardStepComplete onClose={handleClose} />;
        default:
          return (
            <div className="text-center py-12">
              <p className="text-gray-500">未知步骤</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering step content:', error);
      return (
        <div className="text-center py-12">
          <p className="text-red-500">加载步骤时出错</p>
          <p className="text-sm text-gray-500 mt-2">{String(error)}</p>
        </div>
      );
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeVariants}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={slideUpVariants}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">一键报销</h2>
            <p className="text-sm text-gray-500 mt-1">{currentStep?.description}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === wizardState.currentStep;
              const isCompleted = index < currentStepIndex;
              const isAccessible = index <= currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center">
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                        ${
                          isActive
                            ? 'bg-brand-green border-brand-green text-white'
                            : isCompleted
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : isAccessible
                            ? 'bg-white border-gray-300 text-gray-600'
                            : 'bg-gray-100 border-gray-200 text-gray-400'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check size={20} />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-3 hidden md:block">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={wizardState.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {wizardState.currentStep !== 'complete' && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              onClick={isFirstStep ? handleClose : previousStep}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              {isFirstStep ? '取消' : '上一步'}
            </button>

            <div className="flex items-center gap-3">
              {wizardState.isProcessing && (
                <span className="text-sm text-gray-500">处理中...</span>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed || wizardState.isProcessing}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                  ${
                    canProceed && !wizardState.isProcessing
                      ? 'bg-brand-green hover:bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isLastStep ? '提交报销单' : '下一步'}
                {!isLastStep && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReimbursementWizard;

