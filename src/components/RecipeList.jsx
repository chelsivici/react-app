import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes, onEdit, onDelete, onView }) {
  if (recipes.length === 0) {
    return <p style={{ color: '#888' }}>No recipes yet. Add one!</p>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} onEdit={onEdit} onDelete={onDelete} onView={() => onView(recipe)} />
      ))}
    </div>
  );
}
