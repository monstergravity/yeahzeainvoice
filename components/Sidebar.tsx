import React, { useMemo } from 'react';
import { LayoutDashboard, FileText, Briefcase, User, CreditCard, MessageSquare, PieChart, PlusCircle, Map, Mail, Sparkles, BrainCircuit, Activity } from 'lucide-react';
import { Trip, Expense } from '../types';
import { CurrencyCode } from '../services/exchangeRateService';

interface SidebarProps {
  credits?: number;
  onBuyCredits?: () => void;
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string | null) => void;
  onCreateTrip: () => void;
  currentView: 'expenses' | 'audit' | 'reconciliation';
  onChangeView: (view: 'expenses' | 'audit' | 'reconciliation') => void;
  expenses: Expense[];
  selectedCurrency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>;
  onCurrencyChange: (currency: CurrencyCode) => void;
  rateStatus: 'idle' | 'loading' | 'error';
  rateError?: string | null;
  convertExpenseAmount: (expense: Expense) => number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  credits = 0, 
  onBuyCredits, 
  trips, 
  selectedTripId, 
  onSelectTrip,
  onCreateTrip,
  currentView,
  onChangeView,
  expenses,
  selectedCurrency,
  exchangeRates,
  onCurrencyChange,
  rateStatus,
  rateError,
  convertExpenseAmount
}) => {
  const currencyOptions: CurrencyCode[] = ['CNY', 'USD', 'JPY', 'KRW'];
  const currencyLabels: Record<CurrencyCode, string> = {
    CNY: 'CNY (¥)',
    USD: 'USD ($)',
    JPY: 'JPY (¥)',
    KRW: 'KRW (₩)',
  };
  
  // Calculate Spending Pulse Data
  const spendingPulse = useMemo(() => {
    const categories: Record<string, number> = {};
    let total = 0;
    expenses.forEach(e => {
        if (e.isPersonalExpense) return;
        const convertedAmount = convertExpenseAmount(e);
        const cat = e.category || 'Other';
        categories[cat] = (categories[cat] || 0) + convertedAmount;
        total += convertedAmount;
    });

    const sortedCats = Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3); // Top 3
    
    return { total, topCategories: sortedCats };
  }, [expenses, convertExpenseAmount]);

  return (
    <aside className="w-64 h-screen bg-white border-r border-brand-border flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-white font-bold text-xl">
          Y
        </div>
        <span className="font-bold text-xl tracking-tight">Yeahzea</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="All Expenses" 
            active={currentView === 'expenses' && selectedTripId === null}
            onClick={() => {
                onChangeView('expenses');
                onSelectTrip(null);
            }}
        />
        
        {/* Trips Section */}
        <div className="pt-6 pb-2 px-3 flex justify-between items-center">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Trips</div>
          <button 
            onClick={onCreateTrip}
            className="text-brand-green hover:text-green-700 transition-colors"
            title="New Trip"
          >
            <PlusCircle size={14} />
          </button>
        </div>
        
        {trips.length === 0 ? (
           <div className="px-3 py-2 text-xs text-gray-400 italic">No trips created yet</div>
        ) : (
           trips.map(trip => (
             <SidebarItem 
               key={trip.id}
               icon={<Map size={18} />}
               label={trip.name}
               active={currentView === 'expenses' && selectedTripId === trip.id}
               onClick={() => {
                   onChangeView('expenses');
                   onSelectTrip(trip.id);
               }}
             />
           ))
        )}

        <div className="pt-6 pb-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
          Accounting
        </div>
        <SidebarItem icon={<CreditCard size={20} />} label="Unapproved cash" />
        <SidebarItem 
            icon={<BrainCircuit size={20} />} 
            label="AI Analyst" 
            active={currentView === 'audit'}
            onClick={() => onChangeView('audit')}
        />
        <SidebarItem 
            icon={<CreditCard size={20} />} 
            label="Bank Reconciliation" 
            active={currentView === 'reconciliation'}
            onClick={() => onChangeView('reconciliation')}
        />

        {/* Spending Pulse Widget */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-brand-green" />
                <span className="text-xs font-bold uppercase tracking-wide">Spending Pulse</span>
              </div>
              <select
                value={selectedCurrency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="text-xs font-semibold border border-gray-200 rounded px-2 py-0.5 bg-white text-gray-600"
              >
                {currencyOptions.map(currency => (
                  <option key={currency} value={currency}>
                    {currencyLabels[currency]}
                  </option>
                ))}
              </select>
            </div>

            {spendingPulse.total > 0 && (
            <div className="mt-6 mx-2 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Activity size={64} />
                </div>
                <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Activity size={16} className="text-brand-green" />
                    <span className="text-xs font-bold uppercase tracking-wide">Spending Pulse</span>
                    <span className="text-[10px] text-gray-300 ml-2">
                      {rateStatus === 'loading'
                        ? 'Refreshing exchange rates...'
                        : rateStatus === 'error'
                          ? 'Exchange rates unavailable, using fallback'
                          : `1 CNY = ${(exchangeRates[selectedCurrency] || 1).toFixed(4)} ${selectedCurrency}`}
                    </span>
                </div>
                <div className="text-2xl font-bold mb-4 relative z-10">
                    {currencyLabels[selectedCurrency]} {spendingPulse.total.toFixed(2)}
                </div>
                <div className="space-y-2 relative z-10">
                  {spendingPulse.topCategories.map(([cat, amount], i) => (
                        <div key={cat} className="flex items-center text-xs">
                            <div className="w-2 h-2 rounded-full bg-brand-green mr-2" style={{ opacity: 1 - i * 0.3 }}></div>
                            <span className="flex-1 truncate text-gray-300">{cat}</span>
                            <span className="font-mono text-gray-400">{((amount / spendingPulse.total) * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Credit Widget */}
        <div className="mt-6 mx-2 mb-2 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</span>
            <CreditCard size={14} className="text-gray-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">{credits}</span>
            <span className="text-xs text-gray-500">remaining</span>
          </div>
          <button 
            onClick={onBuyCredits}
            className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-medium text-white bg-brand-dark hover:bg-gray-800 py-1.5 rounded-md transition-colors"
          >
            <PlusCircle size={12} />
            Buy Credits
          </button>
        </div>
      </nav>

      {/* Contact / Support Footer */}
      <div className="p-4 border-t border-brand-border bg-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
             <Mail size={12} />
             <span className="font-semibold uppercase">Support</span>
        </div>
        <a href="mailto:bryan@whatown.com" className="text-xs text-brand-text hover:text-brand-green transition-colors truncate block font-medium">
          bryan@whatown.com
        </a>
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick && onClick();
      }}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors truncate ${
        active
          ? 'text-brand-green bg-green-50'
          : 'text-gray-500 hover:bg-brand-hover hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
};

export default Sidebar;