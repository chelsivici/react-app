export default function RecipeDetail({ recipe, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '12px',
          maxWidth: '600px', width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          padding: '1.5rem', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', fontSize: '1.5rem',
            cursor: 'pointer', lineHeight: 1,
          }}
        >
          ×
        </button>

        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
          />
        )}

        <h2 style={{ margin: '0 0 0.5rem' }}>{recipe.title}</h2>

        <div style={{ display: 'flex', gap: '1rem', color: '#666', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          {recipe.prep_time && <span>⏱ {recipe.prep_time} min</span>}
          {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
        </div>

        {(recipe.labels ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
            {recipe.labels.map(label => (
              <span
                key={label.id}
                style={{ background: '#e0e0e0', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <h3 style={{ margin: '0 0 0.4rem' }}>Ingredients</h3>
        <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 1rem', lineHeight: 1.6 }}>{recipe.ingredients}</p>

        <h3 style={{ margin: '0 0 0.4rem' }}>Instructions</h3>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{recipe.instructions}</p>
      </div>
    </div>
  );
}
