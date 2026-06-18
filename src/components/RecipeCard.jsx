const TAG_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // rose
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

function tagColor(id) {
  return TAG_COLORS[id % TAG_COLORS.length];
}

export default function RecipeCard({ recipe, onEdit, onDelete, onView }) {
  return (
    <div
      onClick={onView}
      style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', cursor: 'pointer' }}
    >
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '4px' }}
        />
      )}
      <h3 style={{ margin: '0.5rem 0' }}>{recipe.title}</h3>
      {recipe.prep_time && <p style={{ margin: '0.25rem 0', color: '#666' }}>⏱ {recipe.prep_time} min</p>}
      {recipe.servings && <p style={{ margin: '0.25rem 0', color: '#666' }}>🍽 {recipe.servings} servings</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.5rem 0' }}>
        {(recipe.labels ?? []).map(label => (
          <span
            key={label.id}
            style={{
              background: tagColor(label.id),
              color: '#fff',
              borderRadius: '999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {label.name}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={e => { e.stopPropagation(); onEdit(recipe); }}>Edit</button>
        <button onClick={e => { e.stopPropagation(); onDelete(recipe.id); }} style={{ color: 'red' }}>Delete</button>
      </div>
    </div>
  );
}
