export default function LabelFilter({ labels, activeLabels, onToggle }) {
  return (
    <div style={{ margin: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {labels.map(label => (
        <button
          key={label.id}
          onClick={() => onToggle(label.id)}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            border: '1px solid #888',
            cursor: 'pointer',
            background: activeLabels.includes(label.id) ? '#333' : 'transparent',
            color: activeLabels.includes(label.id) ? '#fff' : 'inherit',
          }}
        >
          {label.name}
        </button>
      ))}
    </div>
  );
}
