import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useBranch } from '../../hooks/useBranch';
import { StockTransactionWithDetails } from '../../types/database';
import { History, TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react';

export default function TransactionList() {
  const { currentBranch } = useBranch();
  const [transactions, setTransactions] = useState<StockTransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    if (currentBranch) {
      fetchTransactions();
    }
  }, [currentBranch, filterType, dateRange]);

  async function fetchTransactions() {
    if (!currentBranch) return;

    setLoading(true);

    let query = supabase
      .from('stock_transactions')
      .select(`
        *,
        stock_items ( name, unit ),
        profiles ( full_name ),
        branches ( name )
      `)
      .eq('branch_id', currentBranch.id)
      .order('created_at', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('transaction_type', filterType);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      if (dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query.limit(100);

    if (!error && data) {
      setTransactions(data as StockTransactionWithDetails[]);
    }

    setLoading(false);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="purchase">Purchases</option>
            <option value="usage">Usage</option>
            <option value="adjustment">Adjustments</option>
            <option value="transfer">Transfers</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'week' | 'month')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.quantity_change > 0
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {transaction.quantity_change > 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.stock_items?.name || 'Unknown Item'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-lg font-semibold ${
                          transaction.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.quantity_change > 0 ? '+' : ''}
                        {transaction.quantity_change.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.stock_items?.unit}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        transaction.transaction_type === 'purchase'
                          ? 'bg-green-100 text-green-700'
                          : transaction.transaction_type === 'usage'
                          ? 'bg-red-100 text-red-700'
                          : transaction.transaction_type === 'adjustment'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {transaction.transaction_type}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      by {transaction.profiles?.full_name || 'Unknown'}
                    </span>
                  </div>

                  {transaction.notes && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      {transaction.notes}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      Previous: {transaction.previous_quantity.toFixed(2)} →
                      New: {transaction.new_quantity.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
