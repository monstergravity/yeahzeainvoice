import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, Search, MoreHorizontal, Send, Smile, Paperclip, Loader2, Trash2, FolderInput, FileSpreadsheet, LogOut, CreditCard } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ExpenseRow from './components/ExpenseRow';
import UploadModal from './components/UploadModal';
import ExpenseDetailPanel from './components/ExpenseDetailPanel';
import BuyCreditsModal from './components/BuyCreditsModal';
import CreateTripModal from './components/CreateTripModal';
import AIAuditView from './components/AIAuditView';
import AuthModal from './components/AuthModal';
import ReconciliationModal from './components/ReconciliationModal';
import ReconciliationView from './components/ReconciliationView';
import { LandingPage } from './components/LandingPage';
import { Expense, Report, Trip, CreditCardTransaction, BankReconciliation } from './types';
import { generateExpenseReportPDF } from './services/pdfService';
import { generateExpenseReportExcel } from './services/excelService';
import { authService, expenseService, tripService, creditService } from './services/supabaseService';
import {
  fetchExchangeRates,
  CurrencyCode,
  ExchangeRateResponse,
} from './services/exchangeRateService';
import { checkExpenseDuplicate } from './services/duplicateService';
import {
  getTransactions,
  matchTransactions,
  generateReconciliation
} from './services/reconciliationService';

// Start with empty state as requested
const INITIAL_EXPENSES: Expense[] = [];

const App: React.FC = () => {
  // View State: 'landing' (Marketing Page) or 'dashboard' (Main App)
  const [isLandingPage, setIsLandingPage] = useState(true);

  // Authentication State
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  
  // App View State (inside Dashboard)
  const [currentView, setCurrentView] = useState<'expenses' | 'audit' | 'reconciliation'>('expenses');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  
  // Reconciliation State
  const [creditCardTransactions, setCreditCardTransactions] = useState<CreditCardTransaction[]>([]);
  const [reconciliation, setReconciliation] = useState<BankReconciliation | null>(null);
  
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Credits from Supabase
  const [credits, setCredits] = useState<number>(0);

  const currencyOptions: CurrencyCode[] = ['CNY', 'USD', 'JPY', 'KRW'];
  const defaultRates: ExchangeRateResponse = {
    CNY: 1,
    USD: 0.14,
    JPY: 17,
    KRW: 172,
  };

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('yeahzea_selected_currency') as CurrencyCode | null;
      if (saved && currencyOptions.includes(saved)) {
        return saved;
      }
    }
    return 'CNY';
  });

  const [exchangeRates, setExchangeRates] = useState<ExchangeRateResponse>(defaultRates);
  const [rateStatus, setRateStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('yeahzea_selected_currency', selectedCurrency);
    } catch (error) {
      console.warn('Unable to persist selected currency', error);
    }
  }, [selectedCurrency]);

  const fetchRates = useCallback(async () => {
    setRateStatus('loading');
    try {
      const rates = await fetchExchangeRates();
      setExchangeRates({
        CNY: 1,
        USD: rates.USD || defaultRates.USD,
        JPY: rates.JPY || defaultRates.JPY,
        KRW: rates.KRW || defaultRates.KRW,
      });
      setRateStatus('idle');
      setRateError(null);
    } catch (error: any) {
      console.error('Failed to fetch exchange rates:', error);
      setRateStatus('error');
      setRateError(error?.message || 'Unable to load exchange rates');
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const intervalId = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchRates]);

  const getToCNYRate = useCallback(
    (currency?: string) => {
      if (!currency || currency === 'CNY') return 1;
      const rate = exchangeRates[currency as CurrencyCode];
      return rate && rate > 0 ? 1 / rate : 1;
    },
    [exchangeRates]
  );

  const convertExpenseToSelected = useCallback(
    (expense: Expense) => {
      const currency = (expense.currency as CurrencyCode) || 'CNY';
      const amountInCNY = expense.amount * getToCNYRate(currency);
      const targetRate = selectedCurrency === 'CNY' ? 1 : exchangeRates[selectedCurrency] || 1;
      return amountInCNY * targetRate;
    },
    [exchangeRates, getToCNYRate, selectedCurrency]
  );

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, error } = await authService.getCurrentUser();
        if (user && !error) {
          setUserId(user.id);
          await loadUserData(user.id);
        } else {
          setIsAuthModalOpen(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthModalOpen(true);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        await loadUserData(session.user.id);
        setIsAuthModalOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setExpenses([]);
        setTrips([]);
        setCredits(0);
        setIsAuthModalOpen(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user data from Supabase
  const loadUserData = async (uid: string) => {
    try {
      // Load all data in parallel
      const [expensesResult, tripsResult, creditsResult, transactionsResult] = await Promise.all([
        expenseService.getExpenses(uid),
        tripService.getTrips(uid),
        creditService.getCredits(uid),
        getTransactions(uid)
      ]);

      // Set expenses
      if (!expensesResult.error && expensesResult.data) {
        setExpenses(expensesResult.data);
      }

      // Set trips
      if (!tripsResult.error && tripsResult.data) {
        setTrips(tripsResult.data);
      }

      // Set credits
      if (!creditsResult.error && creditsResult.data !== undefined) {
        setCredits(creditsResult.data);
      }

      // Set credit card transactions and generate reconciliation
      if (transactionsResult.data) {
        setCreditCardTransactions(transactionsResult.data);
        
        // Always generate reconciliation if we have transactions
        // Use the loaded expensesData, not the state variable
        const loadedExpenses = expensesResult.data || [];
        if (transactionsResult.data.length > 0) {
          const matches = matchTransactions(transactionsResult.data, loadedExpenses);
          const recon = generateReconciliation(transactionsResult.data, loadedExpenses, matches);
          setReconciliation(recon);
          console.log(`Loaded ${transactionsResult.data.length} transactions and generated reconciliation`);
        } else {
          // Even with no transactions, create empty reconciliation
          const recon = generateReconciliation([], loadedExpenses, []);
          setReconciliation(recon);
        }
      } else if (transactionsResult.error) {
        console.error('Failed to load transactions:', transactionsResult.error);
        // Create empty reconciliation on error
        const loadedExpenses = expensesResult.data || [];
        const recon = generateReconciliation([], loadedExpenses, []);
        setReconciliation(recon);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleReconciliationImport = async (transactions: CreditCardTransaction[]) => {
    setCreditCardTransactions(prev => [...transactions, ...prev]);
    
    // Auto-match with existing expenses
    if (expenses.length > 0) {
      const matches = matchTransactions(transactions, expenses);
      const updatedTransactions = [...creditCardTransactions, ...transactions];
      const recon = generateReconciliation(updatedTransactions, expenses, matches);
      setReconciliation(recon);
    }
    
    // Reload user data to get latest state
    if (userId) {
      await loadUserData(userId);
    }
  };

  const handleReconciliationRefresh = async () => {
    if (!userId) return;
    
    const [expensesResult, transactionsResult] = await Promise.all([
      expenseService.getExpenses(userId),
      getTransactions(userId)
    ]);

    if (expensesResult.data && transactionsResult.data) {
      setExpenses(expensesResult.data);
      setCreditCardTransactions(transactionsResult.data);
      
      const matches = matchTransactions(transactionsResult.data, expensesResult.data);
      const recon = generateReconciliation(transactionsResult.data, expensesResult.data, matches);
      setReconciliation(recon);
    }
  };

  const handleReconciliationMatchUpdate = async () => {
    await handleReconciliationRefresh();
  };

  const handleAuthSuccess = async (uid: string) => {
    setUserId(uid);
    await loadUserData(uid);
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUserId(null);
    setExpenses([]);
    setTrips([]);
    setCredits(0);
    setIsAuthModalOpen(true);
  };

  // Toggle Selection
  const toggleExpense = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, selected: !e.selected } : e));
  };

  const selectAll = () => {
    const displayedIds = filteredExpenses.map(e => e.id);
    const allSelected = displayedIds.length > 0 && displayedIds.every(id => expenses.find(e => e.id === id)?.selected);
    
    setExpenses(prev => prev.map(e => {
        if (displayedIds.includes(e.id)) {
            return { ...e, selected: !allSelected };
        }
        return e;
    }));
  };

  const handleExpenseClick = (expense: Expense) => {
    setEditingExpenseId(expense.id);
  };

  const handleExpenseUpdate = async (updatedExpense: Expense) => {
    if (!userId) return;

    // Update local state immediately
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));

    // Update in Supabase
    try {
      await expenseService.updateExpense(updatedExpense, userId);
    } catch (error) {
      console.error('Failed to update expense in Supabase:', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (!userId) return;

    const selectedCount = expenses.filter(e => e.selected).length;
    if (selectedCount === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCount} invoice${selectedCount > 1 ? 's' : ''}?`)) {
        const selectedExpenses = expenses.filter(e => e.selected);
        
        // Delete from Supabase
        try {
          await Promise.all(selectedExpenses.map(e => expenseService.deleteExpense(e.id, userId!)));
        } catch (error) {
          console.error('Failed to delete expenses from Supabase:', error);
        }

        // Update local state
        setExpenses(prev => prev.filter(e => !e.selected));
        if (editingExpenseId && expenses.find(e => e.id === editingExpenseId)?.selected) {
            setEditingExpenseId(null);
        }
    }
  };

  const handleDeleteSingle = async (id: string) => {
      if (!userId) return;

      if (confirm('Are you sure you want to delete this invoice?')) {
          // Delete from Supabase
          try {
            await expenseService.deleteExpense(id, userId);
          } catch (error) {
            console.error('Failed to delete expense from Supabase:', error);
          }

          // Update local state
          setExpenses(prev => prev.filter(e => e.id !== id));
          if (editingExpenseId === id) {
            setEditingExpenseId(null);
          }
      }
  };

  // --- Trip Logic ---
  
  const handleCreateTrip = async (name: string) => {
    if (!userId) {
      console.error('Cannot create trip: userId is null');
      alert('Please sign in first');
      return;
    }

    const newTrip: Trip = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString()
    };
    
    console.log('Creating trip:', { trip: newTrip, userId });
    
    // Update local state immediately
    setTrips(prev => [...prev, newTrip]);
    setSelectedTripId(newTrip.id);
    setCurrentView('expenses'); // Switch back to expense view on create

    // Save to Supabase
    try {
      const { data, error } = await tripService.createTrip(newTrip, userId);
      if (error) {
        console.error('Failed to save trip to Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // 如果保存失败，从本地状态中移除
        setTrips(prev => prev.filter(t => t.id !== newTrip.id));
        setSelectedTripId(null);
        alert(`Failed to create trip: ${error.message || JSON.stringify(error)}`);
        return;
      }
      console.log('Trip saved successfully:', data);
    } catch (error: any) {
      console.error('Failed to save trip to Supabase:', error);
      console.error('Exception details:', error);
      // 如果保存失败，从本地状态中移除
      setTrips(prev => prev.filter(t => t.id !== newTrip.id));
      setSelectedTripId(null);
        alert(`Failed to create trip: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleAssignToTrip = async (tripId: string) => {
    if (!userId) return;

    const selectedExpenses = expenses.filter(e => e.selected);
    if (selectedExpenses.length === 0) {
      alert('Please select at least one expense to move.');
      return;
    }

    // Update local state
    setExpenses(prev => prev.map(e => {
      if (e.selected) {
        const updated = { ...e, tripId, selected: false };
        // Update in Supabase
        expenseService.updateExpense(updated, userId).catch(err => {
          console.error('Failed to update expense trip:', err);
        });
        return updated;
      }
      return e;
    }));

    // Show success message and ask if user wants to view the trip
    if (confirm(`${selectedExpenses.length} expense(s) moved to trip. View trip now?`)) {
      setSelectedTripId(tripId);
    }
  };

  const filteredExpenses = useMemo(() => {
      if (selectedTripId === null) {
          return expenses;
      }
      return expenses.filter(e => e.tripId === selectedTripId);
  }, [expenses, selectedTripId]);

  const currentTripName = useMemo(() => {
      if (!selectedTripId) return `Expense Report ${new Date().toISOString().split('T')[0]}`;
      const trip = trips.find(t => t.id === selectedTripId);
      return trip ? trip.name : 'Unknown Trip';
  }, [trips, selectedTripId]);

  // Calculate Total (based on filtered view) - EXCLUDING PERSONAL EXPENSES
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => {
        if (expense.isPersonalExpense) return sum;
        return sum + expense.amount;
    }, 0);
  }, [filteredExpenses]);

  const totalsByCurrency = useMemo(() => {
    return filteredExpenses.reduce<Record<string, number>>((acc, expense) => {
      if (expense.isPersonalExpense) return acc;
      const currency = expense.currency || 'CNY';
      acc[currency] = (acc[currency] || 0) + expense.amount;
      return acc;
    }, {});
  }, [filteredExpenses]);
  const totalEntries = Object.entries(totalsByCurrency);

  const addExpense = async (newExpense: Expense) => {
    if (!userId) {
      console.error('Cannot add expense: userId is null');
      alert('Please sign in first');
      return;
    }

    if (selectedTripId) {
        newExpense.tripId = selectedTripId;
        console.log('Adding expense to trip:', selectedTripId);
    }
    
    console.log('Adding expense:', { 
      expense: newExpense, 
      userId, 
      selectedTripId,
      tripId: newExpense.tripId 
    });
    
    // Save to local state immediately for UI responsiveness
    setExpenses(prev => [newExpense, ...prev]);

    // Save to Supabase
    try {
      // Convert receiptUrl (blob URL) to File if needed
      let receiptFile: File | undefined;
      if (newExpense.receiptUrl && newExpense.receiptUrl.startsWith('blob:')) {
        try {
          const response = await fetch(newExpense.receiptUrl);
          const blob = await response.blob();
          receiptFile = new File([blob], `receipt-${newExpense.id}.${newExpense.fileType === 'pdf' ? 'pdf' : 'jpg'}`, { type: blob.type });
          console.log('Receipt file prepared:', receiptFile.name, receiptFile.size, 'bytes');
        } catch (err) {
          console.warn('Failed to convert blob to file:', err);
        }
      }

      const { data, error } = await expenseService.createExpense(newExpense, userId, receiptFile);
      if (error) {
        console.error('Failed to save expense to Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // 如果保存失败，从本地状态中移除
        setExpenses(prev => prev.filter(e => e.id !== newExpense.id));
        alert(`Failed to save expense: ${error.message || JSON.stringify(error)}`);
        return;
      }
      console.log('Expense saved successfully:', data);
    } catch (error: any) {
      console.error('Failed to save expense to Supabase:', error);
      console.error('Exception details:', error);
      // 如果保存失败，从本地状态中移除
      setExpenses(prev => prev.filter(e => e.id !== newExpense.id));
      alert(`Failed to save expense: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleConsumeCredit = async (amount: number, type: 'scan' | 'audit' = 'scan') => {
    if (!userId) return;

    try {
      const result = await creditService.consumeCredits(userId, amount, type);
      if (result.success) {
        setCredits(result.remainingCredits);
      } else {
        alert(result.error?.message || 'Credit消费失败');
      }
    } catch (error) {
      console.error('Failed to consume credits:', error);
      alert('Credit消费失败，请重试');
    }
  };

  // This function is kept to satisfy interface but actual credit addition is disabled in UI
  const handleBuyCredits = (amount: number, price: number) => {
      // Intentionally disabled for now as per requirement
      setIsBuyCreditsOpen(false);
  };

  const handleSubmit = async () => {
    if (filteredExpenses.length === 0) {
        alert("Please add expenses before submitting.");
        return;
    }

    // Filter out personal expenses for the report so the PDF matches the total
    const reimbursableExpenses = filteredExpenses.filter(e => !e.isPersonalExpense);

    if (reimbursableExpenses.length === 0) {
        alert("No reimbursable expenses found. Personal expenses are excluded from the report.");
        return;
    }
    
    setIsGeneratingPDF(true);
    try {
        // Async generation to allow for font fetching if necessary
        await generateExpenseReportPDF(reimbursableExpenses, currentTripName, totalAmount);
        
        // Optional feedback if some items were excluded
        if (reimbursableExpenses.length < filteredExpenses.length) {
            setTimeout(() => {
                console.log("Report generated with personal expenses excluded.");
            }, 500);
        }
    } catch (error) {
        console.error("Failed to generate PDF", error);
        alert("Failed to generate PDF report. Please check your internet connection and try again.");
    } finally {
        setIsGeneratingPDF(false);
    }
  };

  const handleExportExcel = () => {
      if (filteredExpenses.length === 0) {
          alert("No expenses to export.");
          return;
      }
      generateExpenseReportExcel(filteredExpenses, currentTripName);
  };

  const issuesCount = filteredExpenses.filter(e => e.status === 'warning').length;
  const selectedCount = expenses.filter(e => e.selected).length;

  // Check for duplicate expenses
  const duplicateExpenseIds = useMemo(() => {
    const duplicateIds = new Set<string>();
    for (let i = 0; i < expenses.length; i++) {
      for (let j = i + 1; j < expenses.length; j++) {
        const match = checkExpenseDuplicate(expenses[i], expenses[j]);
        if (match.isDuplicate) {
          duplicateIds.add(expenses[i].id);
          duplicateIds.add(expenses[j].id);
        }
      }
    }
    return duplicateIds;
  }, [expenses]);

  const editingExpense = useMemo(() => 
    expenses.find(e => e.id === editingExpenseId) || null, 
    [expenses, editingExpenseId]
  );

  // Show loading state while checking auth
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-green" size={48} />
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!userId) {
    return (
      <>
        <LandingPage onEnterApp={() => setIsAuthModalOpen(true)} />
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => {
            if (!userId) {
              // Only allow closing if user is authenticated
              setIsAuthModalOpen(false);
            }
          }}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // --- RENDER: Landing Page View ---
  if (isLandingPage) {
    return <LandingPage onEnterApp={() => setIsLandingPage(false)} />;
  }

  // --- RENDER: Dashboard View ---
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex font-sans text-brand-text">
      <Sidebar 
        expenses={expenses}
        credits={credits} 
        onBuyCredits={() => setIsBuyCreditsOpen(true)} 
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={setSelectedTripId}
        onCreateTrip={() => setIsCreateTripOpen(true)}
        currentView={currentView}
        onChangeView={setCurrentView}
        selectedCurrency={selectedCurrency}
        exchangeRates={exchangeRates}
        onCurrencyChange={setSelectedCurrency}
        rateStatus={rateStatus}
        rateError={rateError}
        convertExpenseAmount={convertExpenseToSelected}
      />

      <main className="flex-1 ml-64 flex flex-col h-screen relative">
        
        {/* Header Area - Only show specific controls if in 'expenses' view */}
        <header className="px-8 py-5 bg-white border-b border-brand-border flex justify-between items-start sticky top-0 z-20">
          <div className="flex gap-4">
             <button 
               className="mt-1 text-gray-400 hover:text-gray-800"
               onClick={() => setIsLandingPage(true)}
               title="Back to Home"
             >
               <ChevronLeft size={24} />
             </button>
             
             <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold">
                        <span className="text-xs">G</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">
                        {currentView === 'audit' ? 'AI Analyst Dashboard' : 
                         currentView === 'reconciliation' ? 'Bank Reconciliation' : 
                         currentTripName}
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                        {currentView === 'audit' ? 'Beta' : 'Draft'}
                    </span>
                    <span>From <span className="text-blue-500 hover:underline cursor-pointer">User Workspace</span></span>
                    <button
                      onClick={handleSignOut}
                      className="ml-4 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      title="Sign Out"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                </div>
             </div>
          </div>

          {currentView === 'expenses' && (
              <div className="flex items-center gap-3">
                {selectedCount > 0 && (
                    <>
                        {trips.length > 0 ? (
                            <div className="relative">
                                <button 
                                  data-trip-button
                                  className="px-4 py-2 text-gray-700 border border-gray-200 bg-white rounded-full font-medium hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const dropdown = document.getElementById('trip-dropdown');
                                    dropdown?.classList.toggle('hidden');
                                  }}
                                >
                                    <FolderInput size={16} />
                                    Move to Trip ({selectedCount})
                                </button>
                                <div 
                                  id="trip-dropdown"
                                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-30 hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="py-2">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                          Select Trip
                                        </div>
                                        {trips.map(trip => (
                                            <button
                                                key={trip.id}
                                                onClick={() => {
                                                  handleAssignToTrip(trip.id);
                                                  document.getElementById('trip-dropdown')?.classList.add('hidden');
                                                }}
                                                className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                {trip.name}
                                            </button>
                                        ))}
                                        <button
                                          onClick={() => {
                                            setIsCreateTripOpen(true);
                                            document.getElementById('trip-dropdown')?.classList.add('hidden');
                                          }}
                                          className="block w-full text-left px-4 py-2.5 text-sm text-brand-green hover:bg-green-50 transition-colors border-t border-gray-100 mt-1"
                                        >
                                          + Create New Trip
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                              onClick={() => setIsCreateTripOpen(true)}
                              className="px-4 py-2 text-brand-green border border-brand-green bg-white rounded-full font-medium hover:bg-green-50 transition-colors text-sm flex items-center gap-2"
                            >
                              <FolderInput size={16} />
                              Create Trip to Move ({selectedCount})
                            </button>
                        )}

                        <button 
                            onClick={handleDeleteSelected}
                            className="px-4 py-2 text-red-600 border border-red-200 bg-red-50 rounded-full font-medium hover:bg-red-100 transition-colors text-sm flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete ({selectedCount})
                        </button>
                    </>
                )}

                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 text-brand-green border border-brand-green rounded-full font-medium hover:bg-green-50 transition-colors text-sm"
                >
                  Add Expense
                </button>
                
                <button
                    onClick={handleExportExcel}
                    disabled={filteredExpenses.length === 0}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export to Excel"
                >
                    <FileSpreadsheet size={16} />
                    Excel
                </button>

                <button 
                    onClick={handleSubmit}
                    disabled={isGeneratingPDF || filteredExpenses.length === 0}
                    className="bg-brand-green hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium transition-all shadow-sm text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        PDF...
                    </>
                  ) : (
                    "PDF"
                  )}
                </button>
              </div>
          )}
        </header>

        {/* Conditional View Rendering */}
        {currentView === 'audit' ? (
            <AIAuditView 
                expenses={expenses} 
                onUpdateExpense={handleExpenseUpdate}
                credits={credits}
                onConsumeCredit={(amount) => handleConsumeCredit(amount, 'audit')}
            />
        ) : currentView === 'reconciliation' ? (
            reconciliation ? (
                <ReconciliationView
                    reconciliation={reconciliation}
                    userId={userId || ''}
                    onRefresh={handleReconciliationRefresh}
                    onMatchUpdate={handleReconciliationMatchUpdate}
                    onImportClick={() => setIsReconciliationModalOpen(true)}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto text-gray-400">
                            <CreditCard size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Bank Reconciliation</h3>
                        <p className="text-gray-500 mb-6">
                            Import your credit card statement to automatically match transactions with your expenses.
                        </p>
                        <button
                            onClick={() => setIsReconciliationModalOpen(true)}
                            className="px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                            Import Credit Card Statement
                        </button>
                    </div>
                </div>
            )
        ) : (
            <>
                {/* Standard Expense List View */}
                <div className="px-8 py-3 bg-gray-50 border-b border-brand-border flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 text-gray-400 flex items-center justify-center">ℹ️</div>
                    <span className="text-gray-600">Waiting for <span className="font-bold text-gray-800">you</span> to fix the issue(s)</span>
                    {issuesCount > 0 && (
                        <span className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {issuesCount} issues
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                  <div className="bg-white rounded-lg border border-brand-border shadow-sm overflow-hidden min-h-[300px]">
                    {filteredExpenses.length > 0 ? (
                      <>
                        <div className="flex items-center px-4 py-3 border-b border-brand-border bg-gray-50/50">
                            <div className="flex items-center justify-center h-5 w-5 mr-4">
                                <input 
                                    type="checkbox" 
                                    onChange={selectAll}
                                    checked={filteredExpenses.length > 0 && filteredExpenses.every(e => e.selected)}
                                    className="h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer" 
                                />
                            </div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider flex-1">Details</div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider w-32 text-right">Amount</div>
                            <div className="w-6"></div>
                        </div>

                        <div>
                            {filteredExpenses.map(expense => (
                                <ExpenseRow 
                                    key={expense.id} 
                                    expense={expense} 
                                    onToggle={toggleExpense}
                                    onClick={handleExpenseClick}
                                    onDelete={handleDeleteSingle}
                                    isDuplicate={duplicateExpenseIds.has(expense.id)}
                                />
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 bg-gray-50/50">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                              <Paperclip size={32} />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses in this view</h3>
                          <p className="max-w-xs text-center text-sm mb-6">Upload receipts to automatically extract data.</p>
                          <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-brand-green hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
                          >
                            Upload Receipts
                          </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Total Area */}
                <div className="bg-white border-t border-brand-border">
                    <div className="px-8 py-4 flex justify-between items-center bg-gray-50/30 border-b border-brand-border">
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                            >
                                Add expense <span className="text-[10px]">▼</span>
                            </button>
                         </div>
                         <div className="flex flex-col items-end gap-0.5 text-right">
                             <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">Total Reimbursable</span>
                             {totalEntries.length === 0 ? (
                                 <span className="text-xl font-bold text-gray-900">$0.00</span>
                             ) : (
                                 totalEntries.map(([currency, amount]) => (
                                     <span key={currency} className="text-xl font-bold text-gray-900">
                                         {currency} {(amount as number).toFixed(2)}
                                     </span>
                                 ))
                             )}
                         </div>
                    </div>
                    
                    <div className="px-8 py-4">
                    <div className="flex gap-4 mb-4">
                        <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                            G
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-sm text-gray-900">Guest User</span>
                                <span className="text-xs text-gray-400">Today</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">viewing {currentTripName}</p>
                        </div>
                        <span className="ml-auto text-xs font-bold text-green-500">Active</span>
                    </div>
                    </div>
                </div>
            </>
        )}

        <UploadModal 
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onAddExpense={addExpense}
            credits={credits}
            onConsumeCredit={handleConsumeCredit}
            onOpenBuyCredits={() => {
                setIsUploadModalOpen(false);
                setIsBuyCreditsOpen(true);
            }}
            existingExpenses={expenses}
        />

        <ExpenseDetailPanel 
            expense={editingExpense}
            isOpen={!!editingExpense}
            onClose={() => setEditingExpenseId(null)}
            onUpdate={handleExpenseUpdate}
            onDelete={editingExpense ? () => handleDeleteSingle(editingExpense.id) : undefined}
        />

        <BuyCreditsModal 
            isOpen={isBuyCreditsOpen}
            onClose={() => setIsBuyCreditsOpen(false)}
            onBuy={handleBuyCredits}
        />

        <CreateTripModal 
            isOpen={isCreateTripOpen}
            onClose={() => setIsCreateTripOpen(false)}
            onCreate={handleCreateTrip}
        />

        <ReconciliationModal
            isOpen={isReconciliationModalOpen}
            onClose={() => setIsReconciliationModalOpen(false)}
            userId={userId || ''}
            onImportComplete={handleReconciliationImport}
        />

        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </main>
    </div>
  );
};

export default App;