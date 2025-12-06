import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useReimbursementWizard } from '../../contexts/ReimbursementWizardContext';
import { fadeVariants, scaleVariants } from '../../utils/animations';

const WizardStepClassify: React.FC = () => {
  const { selectedExpenses, trips } = useReimbursementWizard();
  const [classifications, setClassifications] = useState<Map<string, { category?: string; tripId?: string }>>(new Map());
  const [classificationsVersion, setClassificationsVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Safety check
  const hasExpenses = selectedExpenses && selectedExpenses.length > 0;

  // Auto-classify expenses
  useEffect(() => {
    setIsLoading(true);
    
    try {
      if (!selectedExpenses || selectedExpenses.length === 0) {
        setClassifications(new Map());
        setIsLoading(false);
        return;
      }

      const newClassifications = new Map<string, { category?: string; tripId?: string }>();
      
      selectedExpenses.forEach(expense => {
        try {
          if (!expense || !expense.id) return;

          // Auto-assign category if missing
          let category = expense.category || 'Other';
          if (!expense.category) {
            // Simple category detection based on merchant name
            const merchant = (expense.merchant || '').toLowerCase();
            if (merchant.includes('hotel') || merchant.includes('酒店') || merchant.includes('住宿')) {
              category = 'Accommodation';
            } else if (merchant.includes('restaurant') || merchant.includes('餐厅') || merchant.includes('food')) {
              category = 'Meals';
            } else if (merchant.includes('taxi') || merchant.includes('uber') || merchant.includes('交通')) {
              category = 'Transportation';
            } else {
              category = 'Other';
            }
          }

          // Auto-match to trip based on date
          let tripId: string | undefined;
          if (trips && Array.isArray(trips) && trips.length > 0 && expense.date) {
            try {
              const expenseDate = new Date(expense.date);
              if (!isNaN(expenseDate.getTime())) {
                const matchedTrip = trips.find(trip => {
                  if (!trip || !trip.createdAt) return false;
                  try {
                    const tripDate = new Date(trip.createdAt);
                    if (isNaN(tripDate.getTime())) return false;
                    const diffDays = Math.abs((expenseDate.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                  } catch {
                    return false;
                  }
                });
                tripId = matchedTrip?.id;
              }
            } catch (error) {
              console.warn('Error matching trip for expense:', expense.id, error);
            }
          }

          newClassifications.set(expense.id, { category, tripId });
        } catch (error) {
          console.error('Error classifying expense:', expense.id, error);
          // Set default classification
          newClassifications.set(expense.id, { category: 'Other' });
        }
      });

      setClassifications(newClassifications);
      setClassificationsVersion(prev => prev + 1);
    } catch (error) {
      console.error('Error in classification effect:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedExpenses, trips]);

  // Group expenses by category and trip
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof selectedExpenses> = {};
    
    if (!selectedExpenses || selectedExpenses.length === 0) {
      return groups;
    }
    
    try {
      selectedExpenses.forEach(expense => {
        if (!expense || !expense.id) return;
        
        const classification = classifications.get(expense.id);
        const category = classification?.category || expense.category || 'Uncategorized';
        const tripId = classification?.tripId || expense.tripId;
        
        let key = category;
        if (tripId && trips && Array.isArray(trips) && trips.length > 0) {
          const matchedTrip = trips.find(t => t && t.id === tripId);
          if (matchedTrip && matchedTrip.name) {
            key = `${category} - ${matchedTrip.name}`;
          }
        }
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(expense);
      });
    } catch (error) {
      console.error('Error grouping expenses:', error);
    }

    return groups;
  }, [selectedExpenses, classificationsVersion, trips]);

  const handleCategoryChange = (expenseId: string, category: string) => {
    try {
      const current = classifications.get(expenseId) || {};
      const newMap = new Map(classifications);
      newMap.set(expenseId, { ...current, category });
      setClassifications(newMap);
      setClassificationsVersion(prev => prev + 1);
    } catch (error) {
      console.error('Error changing category:', error);
    }
  };

  const handleTripChange = (expenseId: string, tripId: string | undefined) => {
    try {
      const current = classifications.get(expenseId) || {};
      const newMap = new Map(classifications);
      newMap.set(expenseId, { ...current, tripId });
      setClassifications(newMap);
      setClassificationsVersion(prev => prev + 1);
    } catch (error) {
      console.error('Error changing trip:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">自动分类和分组</h3>
          <p className="text-sm text-gray-500">正在处理...</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!hasExpenses) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">自动分类和分组</h3>
          <p className="text-sm text-gray-500">没有选中的发票</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-400">请返回上一步选择发票</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">自动分类和分组</h3>
        <p className="text-sm text-gray-500">
          系统已自动为发票分类并匹配到相应行程。您可以手动调整。
        </p>
      </div>

      {/* Summary */}
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <div className="flex items-center gap-2 text-blue-800">
          <CheckCircle2 size={20} />
          <span className="text-sm font-medium">
            已自动分类 {selectedExpenses?.length || 0} 张发票，匹配到 {Object.keys(groupedExpenses).length} 个分组
          </span>
        </div>
      </motion.div>

      {/* Grouped Expenses */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.keys(groupedExpenses).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>没有可分类的发票</p>
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([groupKey, expenses], groupIndex) => {
            try {
              const [category, tripName] = groupKey.includes(' - ') 
                ? groupKey.split(' - ') 
                : [groupKey, undefined];
              
              const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
              const currency = expenses[0]?.currency || 'CNY';

              return (
                <motion.div
                  key={groupKey}
                  variants={scaleVariants}
                  initial="hidden"
                  animate="visible"
                  custom={groupIndex * 0.1}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{category}</span>
                      </div>
                      {tripName && (
                        <div className="flex items-center gap-2">
                          <Map size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{tripName}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {currency} {totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{expenses.length} 张发票</p>
                    </div>
                  </div>

                  {/* Expenses List */}
                  <div className="space-y-2">
                    {expenses.map((expense) => {
                      if (!expense || !expense.id) return null;
                      
                      const classification = classifications.get(expense.id);
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{expense.merchant || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">
                              {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            {/* Category Select */}
                            <select
                              value={classification?.category || expense.category || 'Other'}
                              onChange={(e) => handleCategoryChange(expense.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="Travel">Travel</option>
                              <option value="Meals">Meals</option>
                              <option value="Transportation">Transportation</option>
                              <option value="Accommodation">Accommodation</option>
                              <option value="Other">Other</option>
                            </select>

                            {/* Trip Select */}
                            {trips && Array.isArray(trips) && trips.length > 0 && (
                              <select
                                value={classification?.tripId || expense.tripId || ''}
                                onChange={(e) => handleTripChange(expense.id, e.target.value || undefined)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                              >
                                <option value="">No Trip</option>
                                {trips.map(trip => (
                                  <option key={trip.id} value={trip.id}>
                                    {trip.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            <span className="text-sm font-medium text-gray-900 w-20 text-right">
                              {expense.currency || 'CNY'} {(expense.amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </motion.div>
              );
            } catch (error) {
              console.error('Error rendering group:', groupKey, error);
              return null;
            }
          }).filter(Boolean)
        )}
      </div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
      >
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-gray-400 mt-0.5" />
          <p className="text-xs text-gray-600">
            分类和分组信息将用于生成报销单。您可以在下一步预览完整报告。
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default WizardStepClassify;
