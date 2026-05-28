import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { StockItemWithCategory } from '../../types/database';
import { X } from 'lucide-react';

interface AdjustStockModalProps {
  item: StockItemWithCategory;
  adjustType: 'add' | 'remove' | 'set';
  userId: string;
  branchId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AdjustStockModal({
  item,
  adjustType,
  userId,
  branchId,
  onClose,
  onSave,
}: AdjustStockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity');
      setLoading(false);
      return;
    }

    let newQuantity: number;
    let transactionType: 'purchase' | 'usage' | 'adjustment';

    if (adjustType === 'add') {
      newQuantity = item.current_quantity + qty;
      transactionType = 'purchase';
    } else if (adjustType === 'remove') {
      if (qty > item.current_quantity) {
        setError('Cannot remove more than current quantity');
        setLoading(false);
        return;
      }
      newQuantity = item.current_quantity - qty;
      transactionType = 'usage';
    } else {
      newQuantity = qty;
      transactionType = 'adjustment';
    }

    const quantityChange = newQuantity - item.current_quantity;

    const { error: updateError } = await supabase
      .from('stock_items')
      .update({ current_quantity: newQuantity })
      .eq('id', item.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { error: transactionError } = await supabase
      .from('stock_transactions')
      .insert({
        stock_item_id: item.id,
        branch_id: branchId,
        user_id: userId,
        transaction_type: transactionType,
        quantity_change: quantityChange,
        previous_quantity: item.current_quantity,
        new_quantity: newQuantity,
        notes,
      });

    if (transactionError) {
      console.error('Failed to log transaction:', transactionError);
    }

    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {adjustType === 'add' ? 'Add Stock' : adjustType === 'remove' ? 'Remove Stock' : 'Set Stock'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current Quantity:</span>
              <span className="font-medium text-gray-900">
                {item.current_quantity.toFixed(item.current_quantity % 1 === 0 ? 0 : 2)} {item.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {adjustType === 'set' ? 'New Quantity' : 'Quantity to ' + adjustType}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity"
                required
              />
              <span className="text-gray-600 font-medium">{item.unit}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional notes about this adjustment"
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
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
                adjustType === 'remove'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
