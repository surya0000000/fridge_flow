import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { Recipe, RecipeIngredient } from '../types';

const DIETARY_FILTERS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'high-protein',
  'low-carb',
];

interface RecipeDetail extends Recipe {
  ingredients?: RecipeIngredient[];
}

export function Discover() {
  const { showToast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cuisines, setCuisines] = useState<string[]>([]);

  useEffect(() => {
    loadRecipes();
    loadSaved();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    try {
      const res = await apiClient.get('/recipes');
      setRecipes(res.data);
      const uniqueCuisines = [...new Set<string>(res.data.map((r: Recipe) => r.cuisine).filter(Boolean))] as string[];
      setCuisines(uniqueCuisines.sort());
    } catch {
      showToast('Failed to load recipes', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadSaved() {
    try {
      const res = await apiClient.get('/recipes/saved');
      setSavedIds(new Set(res.data.map((r: Recipe) => r.id)));
    } catch {
      // silently fail
    }
  }

  const filtered = recipes.filter(recipe => {
    const matchesSearch = !search || recipe.name.toLowerCase().includes(search.toLowerCase());
    const matchesDietary = selectedDietary.length === 0 || selectedDietary.every(d =>
      recipe.dietary_tags.map(t => t.toLowerCase()).includes(d)
    );
    const matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;
    return matchesSearch && matchesDietary && matchesCuisine;
  });

  const toggleDietary = (tag: string) => {
    setSelectedDietary(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const openRecipeDetail = async (id: number) => {
    setDetailLoading(true);
    setSelectedRecipe({ id } as RecipeDetail);
    try {
      const res = await apiClient.get(`/recipes/${id}`);
      setSelectedRecipe({ ...res.data, is_saved: savedIds.has(id) });
    } catch {
      showToast('Failed to load recipe details', 'error');
      setSelectedRecipe(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleSave = async (recipeId: number, isSaved: boolean) => {
    try {
      if (isSaved) {
        await apiClient.delete(`/recipes/${recipeId}/save`);
        setSavedIds(prev => { const s = new Set(prev); s.delete(recipeId); return s; });
        showToast('Recipe unsaved');
      } else {
        await apiClient.post(`/recipes/${recipeId}/save`);
        setSavedIds(prev => new Set([...prev, recipeId]));
        showToast('Recipe saved!');
      }
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(prev => prev ? { ...prev, is_saved: !isSaved } : null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update saved status', 'error');
    }
  };

  const getDifficultyColor = (d: string | null) => {
    if (d === 'easy') return 'green';
    if (d === 'medium') return 'yellow';
    if (d === 'hard') return 'red';
    return 'gray';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover Recipes</h1>
        <p className="text-gray-500 text-sm mt-1">Explore all {recipes.length} recipes in our collection</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        {cuisines.length > 0 && (
          <select
            value={selectedCuisine}
            onChange={e => setSelectedCuisine(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All cuisines</option>
            {cuisines.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Dietary filter chips */}
      <div className="flex flex-wrap gap-2">
        {DIETARY_FILTERS.map(tag => (
          <button
            key={tag}
            onClick={() => toggleDietary(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedDietary.includes(tag)
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
        {(selectedDietary.length > 0 || selectedCuisine || search) && (
          <button
            onClick={() => { setSelectedDietary([]); setSelectedCuisine(''); setSearch(''); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {filtered.length} recipe{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Recipe Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-base font-medium text-gray-600">No recipes found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(recipe => {
            const isSaved = savedIds.has(recipe.id);
            return (
              <Card key={recipe.id} className="flex flex-col cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{recipe.name}</h3>
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleSave(recipe.id, isSaved); }}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                      isSaved ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-500'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{recipe.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant={getDifficultyColor(recipe.difficulty) as any}>
                    {recipe.difficulty}
                  </Badge>
                  {recipe.cuisine && <Badge variant="blue">{recipe.cuisine}</Badge>}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>⏱ {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                  <span>👥 {recipe.servings} servings</span>
                </div>

                {recipe.dietary_tags.slice(0, 3).map(tag => (
                  <span key={tag} className="inline-block mr-1 mb-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => openRecipeDetail(recipe.id)}
                >
                  View Details
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recipe Detail Modal */}
      <Modal
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe?.name || 'Loading...'}
        size="lg"
      >
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : selectedRecipe ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getDifficultyColor(selectedRecipe.difficulty) as any} size="md">
                {selectedRecipe.difficulty}
              </Badge>
              {selectedRecipe.cuisine && <Badge variant="blue" size="md">{selectedRecipe.cuisine}</Badge>}
              {selectedRecipe.dietary_tags?.map(tag => (
                <Badge key={tag} variant="gray" size="md">{tag}</Badge>
              ))}
            </div>

            <p className="text-gray-600 text-sm">{selectedRecipe.description}</p>

            <div className="flex gap-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
              <div className="text-center">
                <p className="font-semibold text-gray-900">{selectedRecipe.prep_time}</p>
                <p className="text-xs">Prep min</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{selectedRecipe.cook_time}</p>
                <p className="text-xs">Cook min</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{selectedRecipe.servings}</p>
                <p className="text-xs">Servings</p>
              </div>
            </div>

            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                <ul className="space-y-1.5">
                  {selectedRecipe.ingredients.map(ing => (
                    <li key={ing.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      {ing.quantity} {ing.unit} {ing.ingredient_name}
                      {ing.is_optional ? <span className="text-gray-400 text-xs">(optional)</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <Button
              variant={selectedRecipe.is_saved ? 'secondary' : 'primary'}
              className="w-full"
              onClick={() => handleToggleSave(selectedRecipe.id, !!selectedRecipe.is_saved)}
            >
              {selectedRecipe.is_saved ? '🔖 Unsave Recipe' : '🔖 Save Recipe'}
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
