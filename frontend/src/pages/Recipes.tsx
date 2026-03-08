import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { SuggestedRecipe, Recipe, RecipeIngredient } from '../types';

type Tab = 'suggested' | 'saved';

interface RecipeDetail extends Recipe {
  ingredients?: RecipeIngredient[];
  matchScore?: number;
  missingIngredients?: string[];
}

export function Recipes() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('suggested');
  const [suggested, setSuggested] = useState<SuggestedRecipe[]>([]);
  const [saved, setSaved] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [suggestRes, savedRes] = await Promise.all([
        apiClient.get('/recipes/suggest'),
        apiClient.get('/recipes/saved'),
      ]);
      setSuggested(suggestRes.data);
      setSaved(savedRes.data);
    } catch {
      showToast('Failed to load recipes', 'error');
    } finally {
      setLoading(false);
    }
  }

  const openRecipeDetail = async (id: number, extra?: Partial<RecipeDetail>) => {
    setDetailLoading(true);
    setSelectedRecipe({ id } as RecipeDetail);
    try {
      const res = await apiClient.get(`/recipes/${id}`);
      setSelectedRecipe({ ...res.data, ...extra });
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
        showToast('Recipe unsaved');
      } else {
        await apiClient.post(`/recipes/${recipeId}/save`);
        showToast('Recipe saved!');
      }
      await loadData();
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(prev => prev ? { ...prev, is_saved: !isSaved } : null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update saved status', 'error');
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    if (difficulty === 'easy') return 'green';
    if (difficulty === 'medium') return 'yellow';
    if (difficulty === 'hard') return 'red';
    return 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <p className="text-gray-500 text-sm mt-1">Recipes matched to what's in your fridge</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('suggested')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'suggested'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Suggested for You
          {suggested.length > 0 && (
            <span className="ml-2 bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
              {suggested.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'saved'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Saved
          {saved.length > 0 && (
            <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {saved.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {tab === 'suggested' && (
        <>
          {suggested.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🥗</div>
                <p className="text-base font-medium text-gray-600">No recipe matches yet</p>
                <p className="text-sm mt-1">Add more items to your inventory to get personalized suggestions</p>
              </div>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {suggested.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  matchScore={recipe.matchScore}
                  missingIngredients={recipe.missingIngredients}
                  onViewDetails={() => openRecipeDetail(recipe.id, {
                    matchScore: recipe.matchScore,
                    missingIngredients: recipe.missingIngredients,
                  })}
                  onToggleSave={() => handleToggleSave(recipe.id, !!recipe.is_saved)}
                  getDifficultyColor={getDifficultyColor}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'saved' && (
        <>
          {saved.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🔖</div>
                <p className="text-base font-medium text-gray-600">No saved recipes yet</p>
                <p className="text-sm mt-1">Browse the Discover page and save recipes you want to try</p>
              </div>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {saved.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={{ ...recipe, is_saved: true }}
                  onViewDetails={() => openRecipeDetail(recipe.id)}
                  onToggleSave={() => handleToggleSave(recipe.id, true)}
                  getDifficultyColor={getDifficultyColor}
                />
              ))}
            </div>
          )}
        </>
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
          <RecipeDetailContent
            recipe={selectedRecipe}
            onToggleSave={() => handleToggleSave(selectedRecipe.id, !!selectedRecipe.is_saved)}
            getDifficultyColor={getDifficultyColor}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function RecipeCard({
  recipe,
  matchScore,
  missingIngredients,
  onViewDetails,
  onToggleSave,
  getDifficultyColor,
}: {
  recipe: Recipe & { is_saved?: boolean };
  matchScore?: number;
  missingIngredients?: string[];
  onViewDetails: () => void;
  onToggleSave: () => void;
  getDifficultyColor: (d: string | null) => string;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 leading-snug">{recipe.name}</h3>
        <button
          onClick={onToggleSave}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            recipe.is_saved ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-500'
          }`}
        >
          <svg className="w-4 h-4" fill={recipe.is_saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{recipe.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {matchScore !== undefined && (
          <Badge variant={matchScore >= 70 ? 'green' : matchScore >= 50 ? 'yellow' : 'gray'}>
            {matchScore}% match
          </Badge>
        )}
        <Badge variant={getDifficultyColor(recipe.difficulty) as any}>
          {recipe.difficulty}
        </Badge>
        {recipe.cuisine && <Badge variant="blue">{recipe.cuisine}</Badge>}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>⏱ {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
        <span>👥 {recipe.servings} servings</span>
      </div>

      {recipe.dietary_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.dietary_tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {missingIngredients && missingIngredients.length > 0 && (
        <div className="bg-orange-50 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs font-medium text-orange-700 mb-1">Missing:</p>
          <p className="text-xs text-orange-600">{missingIngredients.slice(0, 3).join(', ')}{missingIngredients.length > 3 ? ` +${missingIngredients.length - 3} more` : ''}</p>
        </div>
      )}

      <Button variant="outline" size="sm" className="mt-auto" onClick={onViewDetails}>
        View Recipe
      </Button>
    </Card>
  );
}

function RecipeDetailContent({
  recipe,
  onToggleSave,
  getDifficultyColor,
}: {
  recipe: RecipeDetail;
  onToggleSave: () => void;
  getDifficultyColor: (d: string | null) => string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {recipe.matchScore !== undefined && (
          <Badge variant={recipe.matchScore >= 70 ? 'green' : recipe.matchScore >= 50 ? 'yellow' : 'gray'} size="md">
            {recipe.matchScore}% match
          </Badge>
        )}
        <Badge variant={getDifficultyColor(recipe.difficulty) as any} size="md">
          {recipe.difficulty}
        </Badge>
        {recipe.cuisine && <Badge variant="blue" size="md">{recipe.cuisine}</Badge>}
        {recipe.dietary_tags?.map(tag => (
          <Badge key={tag} variant="gray" size="md">{tag}</Badge>
        ))}
      </div>

      <p className="text-gray-600 text-sm">{recipe.description}</p>

      <div className="flex gap-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
        <div className="text-center">
          <p className="font-semibold text-gray-900">{recipe.prep_time}</p>
          <p className="text-xs">Prep min</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{recipe.cook_time}</p>
          <p className="text-xs">Cook min</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{recipe.servings}</p>
          <p className="text-xs">Servings</p>
        </div>
      </div>

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
          <ul className="space-y-1.5">
            {recipe.ingredients.map(ing => {
              const isMissing = recipe.missingIngredients?.includes(ing.ingredient_name);
              return (
                <li key={ing.id} className={`flex items-center gap-2 text-sm ${isMissing ? 'text-orange-600' : 'text-gray-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isMissing ? 'bg-orange-400' : 'bg-primary-400'}`} />
                  <span>
                    {ing.quantity} {ing.unit} {ing.ingredient_name}
                    {ing.is_optional ? <span className="text-gray-400 text-xs ml-1">(optional)</span> : null}
                    {isMissing && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">need to buy</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {recipe.instructions && recipe.instructions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
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
        variant={recipe.is_saved ? 'secondary' : 'primary'}
        className="w-full"
        onClick={onToggleSave}
      >
        {recipe.is_saved ? '🔖 Unsave Recipe' : '🔖 Save Recipe'}
      </Button>
    </div>
  );
}
