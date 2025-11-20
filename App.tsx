import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Search, MoreHorizontal, Send, Smile, Paperclip, Loader2, Trash2, FolderInput, FileSpreadsheet } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ExpenseRow from './components/ExpenseRow';
import UploadModal from './components/UploadModal';
import ExpenseDetailPanel from './components/ExpenseDetailPanel';
import BuyCreditsModal from './components/BuyCreditsModal';
import CreateTripModal from './components/CreateTripModal';
import AIAuditView from './components/AIAuditView';
import { LandingPage } from './components/LandingPage';
import { Expense, Report, Trip } from './types';
import { generateExpenseReportPDF } from './services/pdfService';
import { generateExpenseReportExcel } from './services/excelService';

// Start with empty state as requested
const INITIAL_EXPENSES: Expense[] = [];

const App: React.FC = () => {
  // View State: 'landing' (Marketing Page) or 'dashboard' (Main App)
  const [isLandingPage, setIsLandingPage] = useState(true);

  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  
  // App View State (inside Dashboard)
  const [currentView, setCurrentView] = useState<'expenses' | 'audit'>('expenses');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Initialize credits from localStorage, default to 10 if not found
  const [credits, setCredits] = useState<number>(() => {
    const savedCredits = localStorage.getItem('yeahzea_credits');
    return savedCredits !== null ? parseInt(savedCredits, 10) : 10;
  });

  // Persist credits to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('yeahzea_credits', credits.toString());
  }, [credits]);

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

  const handleExpenseUpdate = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const handleDeleteSelected = () => {
    const selectedCount = expenses.filter(e => e.selected).length;
    if (selectedCount === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCount} invoice${selectedCount > 1 ? 's' : ''}?`)) {
        setExpenses(prev => prev.filter(e => !e.selected));
        if (editingExpenseId && expenses.find(e => e.id === editingExpenseId)?.selected) {
            setEditingExpenseId(null);
        }
    }
  };

  const handleDeleteSingle = (id: string) => {
      if (confirm('Are you sure you want to delete this invoice?')) {
          setExpenses(prev => prev.filter(e => e.id !== id));
          if (editingExpenseId === id) {
            setEditingExpenseId(null);
          }
      }
  };

  // --- Trip Logic ---
  
  const handleCreateTrip = (name: string) => {
    const newTrip: Trip = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString()
    };
    setTrips(prev => [...prev, newTrip]);
    setSelectedTripId(newTrip.id);
    setCurrentView('expenses'); // Switch back to expense view on create
  };

  const handleAssignToTrip = (tripId: string) => {
     setExpenses(prev => prev.map(e => e.selected ? { ...e, tripId, selected: false } : e));
     if (confirm(`Moved items to trip. View trip now?`)) {
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

  const addExpense = (newExpense: Expense) => {
    if (selectedTripId) {
        newExpense.tripId = selectedTripId;
    }
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleConsumeCredit = (amount: number) => {
    setCredits(prev => Math.max(0, prev - amount));
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

  const editingExpense = useMemo(() => 
    expenses.find(e => e.id === editingExpenseId) || null, 
    [expenses, editingExpenseId]
  );

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
                        {currentView === 'audit' ? 'AI Analyst Dashboard' : currentTripName}
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                        {currentView === 'audit' ? 'Beta' : 'Draft'}
                    </span>
                    <span>From <span className="text-blue-500 hover:underline cursor-pointer">Guest Workspace</span></span>
                </div>
             </div>
          </div>

          {currentView === 'expenses' && (
              <div className="flex items-center gap-3">
                {selectedCount > 0 && (
                    <>
                        {trips.length > 0 && (
                            <div className="relative group">
                                <button className="px-4 py-2 text-gray-700 border border-gray-200 bg-white rounded-full font-medium hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                                    <FolderInput size={16} />
                                    Move to Trip
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-30">
                                    <div className="py-1">
                                        {trips.map(trip => (
                                            <button
                                                key={trip.id}
                                                onClick={() => handleAssignToTrip(trip.id)}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                {trip.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
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
                onConsumeCredit={handleConsumeCredit}
            />
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
                         <div className="flex items-center gap-8">
                             <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">Total Reimbursable</span>
                             <span className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
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
      </main>
    </div>
  );
};

export default App;