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
            style={{ background: '#e0e0e0', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.8rem' }}
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
