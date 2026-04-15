import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import LabelFilter from './LabelFilter';
import RecipeList from './RecipeList';
import RecipeForm from './RecipeForm';

export default function HomePage({ user, setUser }) {
  const [recipes, setRecipes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [activeLabels, setActiveLabels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecipes();
    fetchLabels();
  }, []);

  async function fetchRecipes() {
    try {
      const res = await fetch('/api/recipes', { credentials: 'include' });
      if (!res.ok) { setError('Failed to load recipes'); return; }
      setRecipes(await res.json());
    } catch {
      setError('Network error');
    }
  }

  async function fetchLabels() {
    try {
      const res = await fetch('/api/labels', { credentials: 'include' });
      if (!res.ok) return;
      setLabels(await res.json());
    } catch {}
  }

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!res.ok) { setError('Logout failed'); return; }
    } catch {
      setError('Network error during logout');
      return;
    }
    setUser(null);
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { setError('Failed to delete recipe'); return; }
      setRecipes(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('Network error');
    }
  }

  function handleEdit(recipe) {
    setEditingRecipe(recipe);
    setShowForm(true);
  }

  function handleFormSave() {
    setShowForm(false);
    setEditingRecipe(null);
    fetchRecipes();
    fetchLabels();
  }

  function toggleLabel(id) {
    setActiveLabels(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const filteredRecipes = activeLabels.length === 0
    ? recipes
    : recipes.filter(r =>
        activeLabels.every(id => r.labels.some(l => l.id === id))
      );

  return (
    <div>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={{ padding: '1rem' }}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          onClick={() => { setEditingRecipe(null); setShowForm(true); }}
          style={{ marginBottom: '1rem' }}
        >
          + Add Recipe
        </button>
        {showForm && (
          <RecipeForm
            recipe={editingRecipe}
            labels={labels}
            onSave={handleFormSave}
            onClose={() => { setShowForm(false); setEditingRecipe(null); }}
          />
        )}
        <LabelFilter labels={labels} activeLabels={activeLabels} onToggle={toggleLabel} />
        <RecipeList recipes={filteredRecipes} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}
