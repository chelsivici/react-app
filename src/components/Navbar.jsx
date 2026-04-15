export default function Navbar({ user, onLogout }) {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>🍴 Recipe App</span>
      <span>
        Hello, <strong>{user.username}</strong>
        <button onClick={onLogout} style={{ marginLeft: '1rem' }}>Logout</button>
      </span>
    </nav>
  );
}
