import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Expense, Trip, WizardStep, WizardState } from '../types';

interface ReimbursementWizardContextType {
  // State
  wizardState: WizardState;
  
  // Actions
  startWizard: (expenses: Expense[], trips: Trip[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: WizardStep) => void;
  selectExpenses: (expenseIds: string[]) => void;
  toggleExpense: (expenseId: string) => void;
  selectAllExpenses: () => void;
  deselectAllExpenses: () => void;
  setReimbursementRequest: (request: any) => void;
  resetWizard: () => void;
  
  // Computed
  selectedExpenses: Expense[];
  availableExpenses: Expense[];
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  trips: Trip[];
}

const ReimbursementWizardContext = createContext<ReimbursementWizardContextType | undefined>(undefined);

interface ReimbursementWizardProviderProps {
  children: ReactNode;
  expenses: Expense[];
  trips: Trip[];
}

export interface ReimbursementWizardContextValue extends ReimbursementWizardContextType {
  trips: Trip[];
}

export const ReimbursementWizardProvider: React.FC<ReimbursementWizardProviderProps> = ({
  children,
  expenses,
  trips: providedTrips,
}) => {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 'select',
    selectedExpenses: [],
    isProcessing: false,
  });

  // Filter out personal expenses and invalid expenses
  const availableExpenses = expenses.filter(
    expense => !expense.isPersonalExpense && expense.status !== 'error'
  );

  const selectedExpenses = wizardState.selectedExpenses;

  // Step order
  const stepOrder: WizardStep[] = ['select', 'classify', 'audit', 'review', 'complete'];

  const startWizard = useCallback((expenses: Expense[], trips: Trip[]) => {
    // Auto-select all available expenses
    const autoSelected = expenses.filter(
      expense => !expense.isPersonalExpense && expense.status !== 'error'
    );
    
    setWizardState({
      currentStep: 'select',
      selectedExpenses: autoSelected,
      isProcessing: false,
    });
  }, []);

  const nextStep = useCallback(() => {
    setWizardState(prev => {
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      const nextIndex = currentIndex + 1;
      
      console.log('nextStep called', { 
        currentStep: prev.currentStep, 
        currentIndex, 
        nextIndex,
        nextStep: stepOrder[nextIndex],
        stepOrderLength: stepOrder.length
      });
      
      if (nextIndex < stepOrder.length) {
        const nextStepId = stepOrder[nextIndex];
        console.log('Moving to next step:', nextStepId);
        return {
          ...prev,
          currentStep: nextStepId,
        };
      }
      console.warn('Already at last step');
      return prev;
    });
  }, []);

  const previousStep = useCallback(() => {
    setWizardState(prev => {
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      if (currentIndex > 0) {
        return {
          ...prev,
          currentStep: stepOrder[currentIndex - 1],
        };
      }
      return prev;
    });
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setWizardState(prev => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const selectExpenses = useCallback((expenseIds: string[]) => {
    setWizardState(prev => ({
      ...prev,
      selectedExpenses: availableExpenses.filter(expense => 
        expenseIds.includes(expense.id)
      ),
    }));
  }, [availableExpenses]);

  const toggleExpense = useCallback((expenseId: string) => {
    setWizardState(prev => {
      const isSelected = prev.selectedExpenses.some(e => e.id === expenseId);
      if (isSelected) {
        return {
          ...prev,
          selectedExpenses: prev.selectedExpenses.filter(e => e.id !== expenseId),
        };
      } else {
        const expense = availableExpenses.find(e => e.id === expenseId);
        if (expense) {
          return {
            ...prev,
            selectedExpenses: [...prev.selectedExpenses, expense],
          };
        }
      }
      return prev;
    });
  }, [availableExpenses]);

  const selectAllExpenses = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      selectedExpenses: [...availableExpenses],
    }));
  }, [availableExpenses]);

  const deselectAllExpenses = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      selectedExpenses: [],
    }));
  }, []);

  const setReimbursementRequest = useCallback((request: any) => {
    setWizardState(prev => ({
      ...prev,
      reimbursementRequest: request,
    }));
  }, []);

  const resetWizard = useCallback(() => {
    setWizardState({
      currentStep: 'select',
      selectedExpenses: [],
      isProcessing: false,
    });
  }, []);

  const currentStepIndex = stepOrder.indexOf(wizardState.currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepOrder.length - 1;
  
  // Simplified: Only require expenses on first step, other steps can always proceed
  const canProceed = isFirstStep ? selectedExpenses.length > 0 : true;

  const value: ReimbursementWizardContextType & { trips: Trip[] } = {
    wizardState,
    startWizard,
    nextStep,
    previousStep,
    goToStep,
    selectExpenses,
    toggleExpense,
    selectAllExpenses,
    deselectAllExpenses,
    setReimbursementRequest,
    resetWizard,
    selectedExpenses,
    availableExpenses,
    canProceed,
    isFirstStep,
    isLastStep,
    trips: providedTrips,
  };

  return (
    <ReimbursementWizardContext.Provider value={value}>
      {children}
    </ReimbursementWizardContext.Provider>
  );
};

export const useReimbursementWizard = () => {
  const context = useContext(ReimbursementWizardContext);
  if (context === undefined) {
    throw new Error('useReimbursementWizard must be used within a ReimbursementWizardProvider');
  }
  return context;
};

