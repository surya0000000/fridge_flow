import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/UI/Toast';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Input, Select } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { UserProfile, MealPlan, Recipe } from '../types';

const DIETARY_GOALS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'high-protein',
  'low-carb',
  'keto',
  'paleo',
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(referenceDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const day = referenceDate.getDay();
  const sunday = new Date(referenceDate);
  sunday.setDate(referenceDate.getDate() - day);
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function Profile() {
  const { user, login, token } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const [editName, setEditName] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);
  const [profileSaving, setProfileSaving] = useState(false);

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [prefSaving, setPrefSaving] = useState(false);

  const [addMealOpen, setAddMealOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    recipe_id: '',
    planned_date: toDateString(new Date()),
    meal_type: 'dinner',
    servings: '1',
  });
  const [mealAdding, setMealAdding] = useState(false);

  const weekDates = getWeekDates(
    new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000)
  );

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadMealPlan();
  }, [weekOffset]);

  async function loadAll() {
    setLoading(true);
    try {
      const [profileRes, recipesRes] = await Promise.all([
        apiClient.get('/profile'),
        apiClient.get('/recipes'),
      ]);
      setProfile(profileRes.data);
      setEditName(profileRes.data.name);
      setHouseholdSize(profileRes.data.preferences?.household_size || 1);
      setSelectedGoals(profileRes.data.preferences?.dietary_goals || []);
      setAllergies(profileRes.data.preferences?.allergies || []);
      setRecipes(recipesRes.data);
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadMealPlan() {
    try {
      const start = toDateString(weekDates[0]);
      const end = toDateString(weekDates[6]);
      const res = await apiClient.get('/mealplan', {
        params: { start_date: start, end_date: end },
      });
      setMealPlan(res.data);
    } catch {
      // silently fail
    }
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await apiClient.put('/profile', {
        name: editName,
        household_size: householdSize,
      });
      setProfile(res.data);
      if (token && user) {
        login(token, { ...user, name: editName });
      }
      showToast('Profile updated');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const addAllergy = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allergyInput.trim()) {
      e.preventDefault();
      if (!allergies.includes(allergyInput.trim())) {
        setAllergies(prev => [...prev, allergyInput.trim()]);
      }
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(prev => prev.filter(a => a !== allergy));
  };

  const handleSavePreferences = async () => {
    setPrefSaving(true);
    try {
      await apiClient.put('/profile/preferences', {
        dietary_goals: selectedGoals,
        allergies,
      });
      showToast('Preferences saved');
    } catch {
      showToast('Failed to save preferences', 'error');
    } finally {
      setPrefSaving(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.recipe_id) {
      showToast('Please select a recipe', 'error');
      return;
    }
    setMealAdding(true);
    try {
      await apiClient.post('/mealplan', {
        recipe_id: parseInt(mealForm.recipe_id),
        planned_date: mealForm.planned_date,
        meal_type: mealForm.meal_type,
        servings: parseInt(mealForm.servings),
      });
      showToast('Meal added to plan');
      setAddMealOpen(false);
      await loadMealPlan();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to add meal', 'error');
    } finally {
      setMealAdding(false);
    }
  };

  const handleDeleteMeal = async (id: number) => {
    try {
      await apiClient.delete(`/mealplan/${id}`);
      setMealPlan(prev => prev.filter(m => m.id !== id));
      showToast('Meal removed from plan');
    } catch {
      showToast('Failed to remove meal', 'error');
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* User Info */}
      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-bold text-xl">
              {profile?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            {profile?.role === 'admin' && (
              <Badge variant="purple" size="md">Admin</Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Display name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Household size</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHouseholdSize(n => Math.max(1, n - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <span className="text-lg font-semibold text-gray-900 w-6 text-center">{householdSize}</span>
              <button
                onClick={() => setHouseholdSize(n => n + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
              <span className="text-sm text-gray-500">{householdSize === 1 ? 'person' : 'people'}</span>
            </div>
          </div>
          <Button isLoading={profileSaving} onClick={handleSaveProfile}>
            Save profile
          </Button>
        </div>
      </Card>

      {/* Dietary Preferences */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Dietary Preferences</h2>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Dietary goals</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIETARY_GOALS.map(goal => (
              <label key={goal} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGoals.includes(goal)}
                  onChange={() => toggleGoal(goal)}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 capitalize">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {allergies.map(allergy => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full"
              >
                {allergy}
                <button onClick={() => removeAllergy(allergy)} className="ml-1 hover:text-red-900">×</button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Type an allergy and press Enter (e.g., nuts)"
            value={allergyInput}
            onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={addAllergy}
            hint="Press Enter to add"
          />
        </div>

        <Button isLoading={prefSaving} onClick={handleSavePreferences}>
          Save preferences
        </Button>
      </Card>

      {/* Meal Plan Calendar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Meal Plan</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              ‹
            </button>
            <span className="text-sm text-gray-600 font-medium">
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, i) => {
            const dateStr = toDateString(date);
            const dayMeals = mealPlan.filter(m => m.planned_date === dateStr);
            const isToday = dateStr === toDateString(new Date());

            return (
              <div key={i} className="flex flex-col min-h-[80px]">
                <div className={`text-center py-1 rounded-lg mb-1 ${isToday ? 'bg-primary-500' : ''}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-white' : 'text-gray-500'}`}>
                    {DAYS[date.getDay()]}
                  </p>
                  <p className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </p>
                </div>
                <div className="flex-1 space-y-1">
                  {dayMeals.map(meal => (
                    <div
                      key={meal.id}
                      className="group relative bg-primary-50 border border-primary-100 rounded p-1"
                    >
                      <p className="text-xs text-primary-800 font-medium leading-tight truncate">
                        {meal.recipe_name}
                      </p>
                      <p className="text-xs text-primary-600 capitalize">{meal.meal_type}</p>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center text-primary-500 hover:text-red-500 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={() => setAddMealOpen(true)}
        >
          + Add meal to plan
        </Button>
      </Card>

      {/* Add Meal Modal */}
      <Modal isOpen={addMealOpen} onClose={() => setAddMealOpen(false)} title="Add Meal to Plan">
        <form onSubmit={handleAddMeal} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Recipe</label>
            <select
              value={mealForm.recipe_id}
              onChange={e => setMealForm(f => ({ ...f, recipe_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a recipe...</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Date"
            type="date"
            value={mealForm.planned_date}
            onChange={e => setMealForm(f => ({ ...f, planned_date: e.target.value }))}
            required
          />
          <Select
            label="Meal type"
            options={MEAL_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            value={mealForm.meal_type}
            onChange={e => setMealForm(f => ({ ...f, meal_type: e.target.value }))}
          />
          <Input
            label="Servings"
            type="number"
            min="1"
            value={mealForm.servings}
            onChange={e => setMealForm(f => ({ ...f, servings: e.target.value }))}
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddMealOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={mealAdding}>
              Add to Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
