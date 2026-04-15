import { useState } from 'react';

export default function RecipeForm({ recipe, labels, onSave, onClose }) {
  const [title, setTitle] = useState(recipe?.title || '');
  const [ingredients, setIngredients] = useState(recipe?.ingredients || '');
  const [instructions, setInstructions] = useState(recipe?.instructions || '');
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '');
  const [prepTime, setPrepTime] = useState(recipe?.prep_time || '');
  const [servings, setServings] = useState(recipe?.servings || '');
  const [selectedLabelIds, setSelectedLabelIds] = useState(
    recipe?.labels?.map(l => l.id) || []
  );
  const [newLabelName, setNewLabelName] = useState('');
  const [error, setError] = useState('');

  function toggleLabel(id) {
    setSelectedLabelIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleAddLabel() {
    if (!newLabelName.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newLabelName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create label');
        return;
      }
      setSelectedLabelIds(prev => [...prev, data.id]);
      setNewLabelName('');
      onSave();
    } catch {
      setError('Network error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const body = {
      title,
      ingredients,
      instructions,
      image_url: imageUrl || null,
      prep_time: prepTime ? parseInt(prepTime) : null,
      servings: servings ? parseInt(servings) : null,
      label_ids: selectedLabelIds,
    };
    try {
      const url = recipe ? `/api/recipes/${recipe.id}` : '/api/recipes';
      const method = recipe ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save recipe');
        return;
      }
      onSave();
    } catch {
      setError('Network error');
    }
  }

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };
  const modalStyle = {
    background: '#fff', color: '#000', borderRadius: '8px',
    padding: '2rem', width: '90%', maxWidth: '500px',
    maxHeight: '90vh', overflowY: 'auto',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>{recipe ? 'Edit Recipe' : 'Add Recipe'}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              style={{ width: '100%' }}
              placeholder="Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <textarea
              style={{ width: '100%' }}
              placeholder="Ingredients *"
              rows={3}
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <textarea
              style={{ width: '100%' }}
              placeholder="Instructions *"
              rows={4}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              style={{ width: '100%' }}
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="number"
              placeholder="Prep time (min)"
              value={prepTime}
              onChange={e => setPrepTime(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              placeholder="Servings"
              value={servings}
              onChange={e => setServings(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Labels:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
              {labels.map(label => (
                <label key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedLabelIds.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                  />
                  {label.name}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                placeholder="New label name..."
                value={newLabelName}
                onChange={e => setNewLabelName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleAddLabel}>+ Add</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">{recipe ? 'Save Changes' : 'Add Recipe'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
