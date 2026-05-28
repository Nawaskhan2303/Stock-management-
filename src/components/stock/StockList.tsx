import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useBranch } from '../../hooks/useBranch';
import { useAuth } from '../../hooks/useAuth';
import { Category, StockItemWithCategory } from '../../types/database';
import { Plus, Minus, CreditCard as Edit2, Search, PackageOpen, AlertTriangle } from 'lucide-react';
import StockModal from './StockModal';
import AdjustStockModal from './AdjustStockModal';

export default function StockList() {
  const { currentBranch } = useBranch();
  const { user, profile } = useAuth();
  const isStaff = profile?.role === 'staff';
  const [stockItems, setStockItems] = useState<StockItemWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItemWithCategory | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<StockItemWithCategory | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'set'>('add');

  useEffect(() => {
    if (currentBranch) {
      fetchStockItems();
      fetchCategories();
    }
  }, [currentBranch]);

  async function fetchStockItems() {
    if (!currentBranch) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('stock_items')
      .select('*, categories(*)')
      .eq('branch_id', currentBranch.id)
      .order('name');

    if (!error && data) {
      setStockItems(data as StockItemWithCategory[]);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  }

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = stockItems.filter(
    (item) => item.current_quantity <= item.minimum_quantity && item.minimum_quantity > 0
  );

  return (
    <div className="space-y-6">
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">Low Stock Alert</h3>
            <p className="text-sm text-amber-700 mt-1">
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below minimum threshold
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockItems.slice(0, 3).map((item) => (
                <span key={item.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  {item.name}
                </span>
              ))}
              {lowStockItems.length > 3 && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  +{lowStockItems.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {!isStaff && (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Item</span>
          </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No stock items found</p>
            {!isStaff && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowModal(true);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first item
            </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Item</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Unit</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Unit Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      item.current_quantity <= item.minimum_quantity && item.minimum_quantity > 0
                        ? 'bg-amber-50'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {item.categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-medium ${
                          item.current_quantity <= item.minimum_quantity && item.minimum_quantity > 0
                            ? 'text-amber-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.current_quantity.toFixed(item.current_quantity % 1 === 0 ? 0 : 2)}
                      </span>
                      {item.minimum_quantity > 0 && (
                        <span className="text-xs text-gray-500 ml-1">
                          / {item.minimum_quantity} min
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600">{item.unit}</td>
                    <td className="py-4 px-4 text-right text-gray-900">
                      ${item.unit_cost.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustType('add');
                            setShowAdjustModal(true);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Add stock"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustType('remove');
                            setShowAdjustModal(true);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Remove stock"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        {!isStaff && (
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <StockModal
          item={editingItem}
          categories={categories}
          branchId={currentBranch?.id || ''}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            fetchStockItems();
            setShowModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {showAdjustModal && adjustingItem && (
        <AdjustStockModal
          item={adjustingItem}
          adjustType={adjustType}
          userId={user?.id || ''}
          branchId={currentBranch?.id || ''}
          onClose={() => {
            setShowAdjustModal(false);
            setAdjustingItem(null);
          }}
          onSave={() => {
            fetchStockItems();
            setShowAdjustModal(false);
            setAdjustingItem(null);
          }}
        />
      )}
    </div>
  );
}
