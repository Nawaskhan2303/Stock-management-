import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useBranch } from '../../hooks/useBranch';
import { useAuth } from '../../hooks/useAuth';
import { StockItemWithCategory, StockTransactionWithDetails } from '../../types/database';
import {
  PackageOpen,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
} from 'lucide-react';

export default function Dashboard() {
  const { currentBranch } = useBranch();
  const { profile } = useAuth();
  const [stockItems, setStockItems] = useState<StockItemWithCategory[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<StockTransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBranch) {
      fetchDashboardData();
    }
  }, [currentBranch]);

  async function fetchDashboardData() {
    if (!currentBranch) return;

    setLoading(true);

    const { data: stockData } = await supabase
      .from('stock_items')
      .select('*, categories(*)')
      .eq('branch_id', currentBranch.branch_id)
      .order('name');

    if (stockData) {
      setStockItems(stockData as StockItemWithCategory[]);
    }

    const { data: transactionData } = await supabase
      .from('stock_transactions')
      .select(`
        *,
        stock_items ( name, unit ),
        profiles ( full_name ),
        branches ( name )
      `)
      .eq('branch_id', currentBranch.branch_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionData) {
      setRecentTransactions(transactionData as StockTransactionWithDetails[]);
    }

    setLoading(false);
  }

  const lowStockItems = stockItems.filter(
    (item) => item.current_quantity <= item.minimum_quantity && item.minimum_quantity > 0
  );

  const totalValue = stockItems.reduce(
    (sum, item) => sum + item.current_quantity * item.unit_cost,
    0
  );

  const totalItems = stockItems.length;

  const transactionStats = {
    purchases: recentTransactions.filter((t) => t.transaction_type === 'purchase').length,
    usage: recentTransactions.filter((t) => t.transaction_type === 'usage').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.full_name || 'User'}!
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{currentBranch?.name}</p>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PackageOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${totalValue.toFixed(0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{lowStockItems.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Activity</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {recentTransactions.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
              <p className="text-sm text-gray-600 mt-1">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need attention
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg text-sm border border-amber-200"
                  >
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-amber-600">
                      ({item.current_quantity.toFixed(0)} {item.unit})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent transactions</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.quantity_change > 0
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {transaction.quantity_change > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {transaction.stock_items?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.profiles?.full_name} •{' '}
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        transaction.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.quantity_change > 0 ? '+' : ''}
                      {transaction.quantity_change.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {transaction.transaction_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Purchases (Last 10)</span>
              </div>
              <span className="font-semibold text-gray-900">{transactionStats.purchases}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-gray-700">Usage (Last 10)</span>
              </div>
              <span className="font-semibold text-gray-900">{transactionStats.usage}</span>
            </div>

            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Categories in Use</span>
                <span className="font-semibold text-gray-900">
                  {new Set(stockItems.filter((i) => i.category_id).map((i) => i.category_id)).size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Items</span>
                <span className="font-semibold text-gray-900">
                  {stockItems.filter((i) => i.current_quantity > 0).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
