import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input, Select } from '../components/UI/Input';
import { Badge } from '../components/UI/Badge';
import { ShoppingItem } from '../types';

const UNIT_OPTIONS = [
  { value: '', label: 'No unit' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'pcs', label: 'pcs' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'cup', label: 'cup' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'No category' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'produce', label: 'Produce' },
  { value: 'protein', label: 'Protein' },
  { value: 'grains', label: 'Grains' },
  { value: 'condiments', label: 'Condiments' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'other', label: 'Other' },
];

export function Shopping() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await apiClient.get('/shopping');
      setItems(res.data);
    } catch {
      showToast('Failed to load shopping list', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setAddLoading(true);
    try {
      const res = await apiClient.post('/shopping', {
        name: form.name,
        quantity: form.quantity ? parseFloat(form.quantity) : undefined,
        unit: form.unit || undefined,
        category: form.category || undefined,
      });
      setItems(prev => [res.data, ...prev]);
      setForm({ name: '', quantity: '', unit: '', category: '' });
      showToast('Item added to shopping list');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to add item', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleCheck = async (item: ShoppingItem) => {
    try {
      const res = await apiClient.put(`/shopping/${item.id}`, {
        is_checked: item.is_checked ? 0 : 1,
      });
      setItems(prev => prev.map(i => (i.id === item.id ? res.data : i)));
    } catch {
      showToast('Failed to update item', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/shopping/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  const handleClearChecked = async () => {
    try {
      await apiClient.delete('/shopping/checked');
      setItems(prev => prev.filter(i => !i.is_checked));
      showToast('Cleared checked items');
    } catch {
      showToast('Failed to clear items', 'error');
    }
  };

  const handleSyncFromMealPlan = async () => {
    setSyncLoading(true);
    try {
      const res = await apiClient.post('/mealplan/sync-shopping');
      showToast(res.data.message || 'Shopping list updated from meal plan');
      await loadItems();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to sync from meal plan', 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  const uncheckedCount = items.filter(i => !i.is_checked).length;
  const checkedCount = items.filter(i => i.is_checked).length;

  const grouped = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category || 'Other';
    const key = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
          <p className="text-gray-500 text-sm mt-1">
            {uncheckedCount > 0 ? (
              <span>{uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} remaining</span>
            ) : (
              <span>All done! 🎉</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checkedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearChecked}>
              Clear checked ({checkedCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            isLoading={syncLoading}
            onClick={handleSyncFromMealPlan}
          >
            🗓 From Meal Plan
          </Button>
        </div>
      </div>

      {/* Add Item Form */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add item manually</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <Input
            placeholder="Item name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="Qty"
              min="0"
              step="any"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            />
            <Select
              options={UNIT_OPTIONS}
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            />
            <Select
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            />
          </div>
          <Button type="submit" size="sm" isLoading={addLoading}>
            Add to List
          </Button>
        </form>
      </Card>

      {/* Shopping List */}
      {items.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-base font-medium text-gray-600">Your shopping list is empty</p>
            <p className="text-sm mt-1">Add items manually or generate from your meal plan</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryItems]) => (
              <Card key={category} padding="none">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-xl">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{category}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {categoryItems.map(item => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => handleToggleCheck(item)}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          item.is_checked
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {item.is_checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        {(item.quantity || item.unit) && (
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit}
                            {item.recipe_name && (
                              <span className="ml-1 text-primary-500">· for {item.recipe_name}</span>
                            )}
                          </p>
                        )}
                      </div>
                      {item.source === 'meal_plan' && (
                        <Badge variant="teal">meal plan</Badge>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
