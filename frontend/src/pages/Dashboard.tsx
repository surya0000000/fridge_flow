import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/UI/Toast';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Input, Select } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { InventoryItem, SuggestedRecipe } from '../types';

const UNIT_OPTIONS = [
  { value: 'g', label: 'g (grams)' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l (liters)' },
  { value: 'pcs', label: 'pcs' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'cup', label: 'cup' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
];

const CATEGORY_OPTIONS = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'produce', label: 'Produce' },
  { value: 'protein', label: 'Protein' },
  { value: 'grains', label: 'Grains' },
  { value: 'condiments', label: 'Condiments' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS: Record<string, 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray' | 'teal' | 'orange'> = {
  dairy: 'blue',
  produce: 'green',
  protein: 'red',
  grains: 'yellow',
  condiments: 'orange',
  beverages: 'teal',
  frozen: 'purple',
  other: 'gray',
};

function getDaysUntilExpiry(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [weekMealsCount, setWeekMealsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [addForm, setAddForm] = useState({
    name: '',
    quantity: '',
    unit: 'pcs',
    category: 'produce',
    expiry_date: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: '',
    unit: 'pcs',
    category: 'produce',
    expiry_date: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [inventoryRes, expiringRes, suggestRes, savedRes, mealRes] = await Promise.all([
        apiClient.get('/inventory'),
        apiClient.get('/inventory/expiring'),
        apiClient.get('/recipes/suggest'),
        apiClient.get('/recipes/saved'),
        apiClient.get('/mealplan', {
          params: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
        }),
      ]);
      setItems(inventoryRes.data);
      setExpiringItems(expiringRes.data);
      setSuggestions(suggestRes.data.slice(0, 3));
      setSavedCount(savedRes.data.length);
      setWeekMealsCount(mealRes.data.length);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.quantity) return;
    setAddLoading(true);

    try {
      const res = await apiClient.post('/inventory', {
        name: addForm.name,
        quantity: parseFloat(addForm.quantity),
        unit: addForm.unit,
        category: addForm.category,
        expiry_date: addForm.expiry_date || undefined,
      });
      setItems(prev => [res.data, ...prev]);
      setAddForm({ name: '', quantity: '', unit: 'pcs', category: 'produce', expiry_date: '' });
      showToast('Item added to inventory');

      const expiringRes = await apiClient.get('/inventory/expiring');
      setExpiringItems(expiringRes.data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to add item', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      category: item.category,
      expiry_date: item.expiry_date || '',
    });
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    setEditLoading(true);
    try {
      const res = await apiClient.put(`/inventory/${editItem.id}`, {
        name: editForm.name,
        quantity: parseFloat(editForm.quantity),
        unit: editForm.unit,
        category: editForm.category,
        expiry_date: editForm.expiry_date || null,
      });
      setItems(prev => prev.map(i => (i.id === editItem.id ? res.data : i)));
      setEditItem(null);
      showToast('Item updated');

      const expiringRes = await apiClient.get('/inventory/expiring');
      setExpiringItems(expiringRes.data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update item', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/inventory/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      setExpiringItems(prev => prev.filter(i => i.id !== id));
      showToast('Item removed');
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's in your fridge today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Items</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{items.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expiring Soon</p>
          <p className={`text-3xl font-bold mt-1 ${expiringItems.length > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
            {expiringItems.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saved Recipes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{savedCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Meals This Week</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{weekMealsCount}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Expiring Soon */}
          {expiringItems.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚠️</span> Expiring Soon
              </h2>
              <div className="space-y-2">
                {expiringItems.map(item => {
                  const days = getDaysUntilExpiry(item.expiry_date!);
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                      </div>
                      <Badge variant={days === 0 ? 'red' : days <= 1 ? 'orange' : 'yellow'}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Suggested Recipes */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Suggested for You</h2>
              <Link to="/recipes" className="text-xs text-primary-600 hover:underline font-medium">
                View all →
              </Link>
            </div>
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Add items to your inventory to get recipe suggestions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map(recipe => (
                  <div key={recipe.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{recipe.name}</p>
                      <p className="text-xs text-gray-500">{recipe.cuisine} · {recipe.difficulty}</p>
                    </div>
                    <Badge variant={recipe.matchScore >= 70 ? 'green' : recipe.matchScore >= 50 ? 'yellow' : 'gray'}>
                      {recipe.matchScore}% match
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column - Quick Add + Inventory */}
        <div className="space-y-6">
          {/* Quick Add Form */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Add Item</h2>
            <form onSubmit={handleAddItem} className="space-y-3">
              <Input
                placeholder="Item name (e.g., Chicken breast)"
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Qty"
                  min="0"
                  step="any"
                  value={addForm.quantity}
                  onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
                  required
                />
                <Select
                  options={UNIT_OPTIONS}
                  value={addForm.unit}
                  onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                />
              </div>
              <Select
                options={CATEGORY_OPTIONS}
                value={addForm.category}
                onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Expiry date (optional)"
                value={addForm.expiry_date}
                onChange={e => setAddForm(f => ({ ...f, expiry_date: e.target.value }))}
              />
              <Button type="submit" className="w-full" isLoading={addLoading}>
                Add to Fridge
              </Button>
            </form>
          </Card>

          {/* Inventory List */}
          <Card padding="none">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                Inventory ({items.length} items)
              </h2>
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <p className="text-2xl mb-2">🥗</p>
                <p className="text-sm">Your fridge is empty. Add some items!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {items.map(item => {
                  const isExpiring = item.expiry_date && getDaysUntilExpiry(item.expiry_date) <= 3;
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          {isExpiring && <span className="text-xs">⚠️</span>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {item.quantity} {item.unit}
                          {item.expiry_date && ` · exp ${item.expiry_date}`}
                        </p>
                      </div>
                      <Badge variant={CATEGORY_COLORS[item.category] || 'gray'}>
                        {item.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Inventory Item">
        <div className="space-y-4">
          <Input
            label="Name"
            value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              min="0"
              step="any"
              value={editForm.quantity}
              onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))}
            />
            <Select
              label="Unit"
              options={UNIT_OPTIONS}
              value={editForm.unit}
              onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
            />
          </div>
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={editForm.category}
            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
          />
          <Input
            label="Expiry date"
            type="date"
            value={editForm.expiry_date}
            onChange={e => setEditForm(f => ({ ...f, expiry_date: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button className="flex-1" isLoading={editLoading} onClick={handleEditSave}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
