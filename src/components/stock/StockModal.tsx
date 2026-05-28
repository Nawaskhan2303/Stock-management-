import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Category, StockItemWithCategory } from '../../types/database';
import { X } from 'lucide-react';

interface StockModalProps {
  item: StockItemWithCategory | null;
  categories: Category[];
  branchId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function StockModal({
  item,
  categories,
  branchId,
  onClose,
  onSave,
}: StockModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [unit, setUnit] = useState(item?.unit || 'pieces');
  const [currentQuantity, setCurrentQuantity] = useState(item?.current_quantity?.toString() || '0');
  const [minimumQuantity, setMinimumQuantity] = useState(item?.minimum_quantity?.toString() || '0');
  const [unitCost, setUnitCost] = useState(item?.unit_cost?.toString() || '0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!item;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = {
      name,
      description,
      category_id: categoryId || null,
      unit,
      current_quantity: parseFloat(currentQuantity) || 0,
      minimum_quantity: parseFloat(minimumQuantity) || 0,
      unit_cost: parseFloat(unitCost) || 0,
      branch_id: branchId,
    };

    let result;
    if (isEditing) {
      result = await supabase
        .from('stock_items')
        .update(data)
        .eq('id', item.id);
    } else {
      result = await supabase
        .from('stock_items')
        .insert(data);
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Stock Item' : 'Add Stock Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pieces">Pieces</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="liters">Liters</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="boxes">Boxes</option>
                <option value="bottles">Bottles</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Low stock threshold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
