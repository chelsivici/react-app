# Recipe App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack recipe app with auth, CRUD for recipes, and label filtering — satisfying all school requirements.

**Architecture:** React (Vite) frontend proxies `/api/*` to an Express backend on port 3000. Auth is handled via server-side sessions (express-session). Frontend uses React Router for navigation between Login, Register, and Home screens.

**Tech Stack:** React 19 + React Router · Node.js + Express · PostgreSQL · express-session · bcrypt · pg · dotenv · cors

---

## File Map

### New files to create

**Backend:**
- `server/package.json` — server npm project (ES modules, no test runner)
- `server/.env` — `SESSION_SECRET` and `DATABASE_URL`
- `server/db.js` — pg Pool connected to Postgres via DATABASE_URL
- `server/index.js` — Express app: cors, json, session, mounts routes
- `server/routes/auth.js` — POST /register, POST /login, GET /me, POST /logout
- `server/routes/data.js` — requireAuth middleware + all recipe & label endpoints

**Frontend:**
- `src/components/LoginPage.jsx` — email/password form, calls POST /api/auth/login
- `src/components/RegisterPage.jsx` — username/email/password form, calls POST /api/auth/register
- `src/components/HomePage.jsx` — orchestrates all home UI state (recipes, labels, modal)
- `src/components/Navbar.jsx` — displays username and logout button
- `src/components/LabelFilter.jsx` — clickable label pills for filtering
- `src/components/RecipeList.jsx` — maps recipes to RecipeCard
- `src/components/RecipeCard.jsx` — shows recipe info with edit/delete buttons
- `src/components/RecipeForm.jsx` — add/edit modal, also handles custom label creation

### Files to modify

- `vite.config.js` — add `server.proxy` to forward `/api/*` to `http://localhost:3000`
- `src/App.jsx` — rewrite: Router setup, `/api/auth/me` check on mount, protected routes
- `src/main.jsx` — no change needed (already bootstraps App)

### Files to delete

- `src/TaskList.jsx` — replaced by recipe components
- `src/Item.jsx` — replaced by recipe components
- `src/rest.js` — unused, remove

---

## Task 1: PostgreSQL database + schema

**Files:**
- Run SQL manually in psql

- [ ] **Step 1: Create the database**

```bash
createdb recipes_db
psql recipes_db
```

Expected: `psql (your-version)` prompt opens.

- [ ] **Step 2: Create all tables and seed default labels**

Paste this into the psql prompt:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image_url VARCHAR(500),
  prep_time INTEGER,
  servings INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE labels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE recipe_labels (
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, label_id)
);

INSERT INTO labels (name, is_default) VALUES
  ('Breakfast', true),
  ('Lunch', true),
  ('Dinner', true),
  ('Dessert', true),
  ('Vegan', true),
  ('Quick', true),
  ('Italian', true),
  ('Healthy', true),
  ('Snack', true);
```

Expected output ends with: `INSERT 0 9`

- [ ] **Step 3: Verify tables exist**

```sql
\dt
```

Expected: lists `labels`, `recipe_labels`, `recipes`, `users`.

```sql
\q
```

---

## Task 2: Backend project setup

**Files:**
- Create: `server/package.json`
- Create: `server/.env`
- Create: `server/db.js`
- Create: `server/index.js`

- [ ] **Step 1: Initialize server npm project**

```bash
mkdir -p server/routes
cd server
npm init -y
npm pkg set type=module
npm install express pg bcrypt express-session cors dotenv
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Create `server/.env`**

```
SESSION_SECRET=change_this_to_a_random_string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/recipes_db
```

> Replace `YOUR_PASSWORD` with your actual Postgres password. If Postgres has no password, use `postgresql://postgres@localhost:5432/recipes_db`.

- [ ] **Step 3: Create `server/db.js`**

```js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
```

- [ ] **Step 4: Create `server/index.js`**

```js
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import dataRouter from './routes/data.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

app.use('/api/auth', authRouter);
app.use('/api', dataRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 5: Verify server starts (routes don't exist yet, that's OK)**

```bash
cd server
node index.js
```

Expected: `Server running on port 3000`. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
cd ..
git add server/
git commit -m "feat: add express server skeleton with db connection"
```

---

## Task 3: Auth routes

**Files:**
- Create: `server/routes/auth.js`

- [ ] **Step 1: Create `server/routes/auth.js`**

```js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );
    req.session.userId = result.rows[0].id;
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already taken' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.session.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

export default router;
```

- [ ] **Step 2: Start server and manually test register**

```bash
cd server && node index.js
```

In a new terminal:
```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"secret"}' | cat
```

Expected: `{"id":1,"username":"testuser","email":"test@test.com"}`

- [ ] **Step 3: Test login**

```bash
curl -s -c /tmp/cookies.txt -b /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"secret"}' | cat
```

Expected: `{"id":1,"username":"testuser","email":"test@test.com"}`

- [ ] **Step 4: Test /me**

```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/auth/me | cat
```

Expected: `{"id":1,"username":"testuser","email":"test@test.com"}`

- [ ] **Step 5: Stop server and commit**

```bash
git add server/routes/auth.js
git commit -m "feat: add auth routes (register, login, me, logout)"
```

---

## Task 4: Data routes (recipes + labels)

**Files:**
- Create: `server/routes/data.js`

- [ ] **Step 1: Create `server/routes/data.js`**

```js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

router.use(requireAuth);

// GET /api/labels
router.get('/labels', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM labels ORDER BY is_default DESC, name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/labels
router.post('/labels', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const result = await pool.query(
      'INSERT INTO labels (name, is_default) VALUES ($1, false) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Label already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes
router.get('/recipes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        COALESCE(
          json_agg(json_build_object('id', l.id, 'name', l.name))
          FILTER (WHERE l.id IS NOT NULL), '[]'
        ) AS labels
      FROM recipes r
      LEFT JOIN recipe_labels rl ON r.id = rl.recipe_id
      LEFT JOIN labels l ON rl.label_id = l.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes/:id
router.get('/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT r.*,
        COALESCE(
          json_agg(json_build_object('id', l.id, 'name', l.name))
          FILTER (WHERE l.id IS NOT NULL), '[]'
        ) AS labels
      FROM recipes r
      LEFT JOIN recipe_labels rl ON r.id = rl.recipe_id
      LEFT JOIN labels l ON rl.label_id = l.id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recipes
router.post('/recipes', async (req, res) => {
  const { title, ingredients, instructions, image_url, prep_time, servings, label_ids } = req.body;
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const recipeResult = await client.query(
      `INSERT INTO recipes (user_id, title, ingredients, instructions, image_url, prep_time, servings)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.session.userId, title, ingredients, instructions,
       image_url || null, prep_time || null, servings || null]
    );
    const recipe = recipeResult.rows[0];
    if (label_ids && label_ids.length > 0) {
      for (const labelId of label_ids) {
        await client.query(
          'INSERT INTO recipe_labels (recipe_id, label_id) VALUES ($1, $2)',
          [recipe.id, labelId]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ ...recipe, labels: [] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/recipes/:id
router.put('/recipes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, image_url, prep_time, servings, label_ids } = req.body;
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const recipeResult = await client.query(
      `UPDATE recipes
       SET title=$1, ingredients=$2, instructions=$3, image_url=$4, prep_time=$5, servings=$6
       WHERE id=$7 RETURNING *`,
      [title, ingredients, instructions, image_url || null,
       prep_time || null, servings || null, id]
    );
    if (recipeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Recipe not found' });
    }
    await client.query('DELETE FROM recipe_labels WHERE recipe_id = $1', [id]);
    if (label_ids && label_ids.length > 0) {
      for (const labelId of label_ids) {
        await client.query(
          'INSERT INTO recipe_labels (recipe_id, label_id) VALUES ($1, $2)',
          [id, labelId]
        );
      }
    }
    await client.query('COMMIT');
    res.json(recipeResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/recipes/:id
router.delete('/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM recipes WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
```

- [ ] **Step 2: Start server and test labels endpoint**

```bash
cd server && node index.js
```

In a new terminal, log in first:
```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"secret"}' | cat
```

Then fetch labels:
```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/labels | cat
```

Expected: JSON array of 9 default labels (Breakfast, Lunch, Dinner, etc.)

- [ ] **Step 3: Test create + fetch recipe**

```bash
curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Pasta","ingredients":"pasta, water","instructions":"boil and eat","label_ids":[1]}' | cat
```

Expected: `{"id":1,"user_id":1,"title":"Test Pasta",...,"labels":[]}`

```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/recipes | cat
```

Expected: array with one recipe, `"labels":[{"id":1,"name":"Breakfast"}]`

- [ ] **Step 4: Stop server and commit**

```bash
git add server/routes/data.js
git commit -m "feat: add recipes and labels CRUD endpoints"
```

---

## Task 5: Frontend setup

**Files:**
- Modify: `vite.config.js`
- Delete: `src/TaskList.jsx`, `src/Item.jsx`, `src/rest.js`
- Create: `src/components/` directory

- [ ] **Step 1: Install react-router-dom**

```bash
npm install react-router-dom
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Update `vite.config.js` to add proxy**

Replace the entire file with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Create components directory and delete old files**

```bash
mkdir -p src/components
rm src/TaskList.jsx src/Item.jsx src/rest.js
```

- [ ] **Step 4: Commit**

```bash
git add vite.config.js package.json package-lock.json
git rm src/TaskList.jsx src/Item.jsx src/rest.js
git commit -m "feat: install react-router-dom, add vite proxy, remove old task files"
```

---

## Task 6: App.jsx + auth pages

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/LoginPage.jsx`
- Create: `src/components/RegisterPage.jsx`

- [ ] **Step 1: Rewrite `src/App.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          setUser(await res.json());
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

  if (user === undefined) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <RegisterPage setUser={setUser} />}
        />
        <Route
          path="/"
          element={user ? <HomePage user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Create `src/components/LoginPage.jsx`**

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      setUser(data);
    } catch {
      setError('Network error. Is the server running?');
    }
  }

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>No account? <Link to="/register">Register here</Link></p>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/RegisterPage.jsx`**

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage({ setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      setUser(data);
    } catch {
      setError('Network error. Is the server running?');
    }
  }

  return (
    <div>
      <h1>Register</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
```

- [ ] **Step 4: Start both servers and test auth in the browser**

Terminal 1:
```bash
cd server && node index.js
```

Terminal 2:
```bash
npm run dev
```

Open `http://localhost:5173`. You should see the Login page. Navigate to `/register`, create an account — should redirect to `/` (Home, which will be blank for now since HomePage doesn't exist yet).

> If you see "Cannot find module './components/HomePage'", that's expected — create a temporary placeholder in the next step.

- [ ] **Step 5: Create temporary `src/components/HomePage.jsx` placeholder**

```jsx
export default function HomePage({ user, setUser }) {
  return <div><h1>Home — logged in as {user.username}</h1></div>;
}
```

Retest: register or login should now land on a page that says "Home — logged in as [username]".

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/LoginPage.jsx src/components/RegisterPage.jsx src/components/HomePage.jsx
git commit -m "feat: add routing, login and register pages"
```

---

## Task 7: Navbar, LabelFilter, RecipeCard, RecipeList

**Files:**
- Create: `src/components/Navbar.jsx`
- Create: `src/components/LabelFilter.jsx`
- Create: `src/components/RecipeCard.jsx`
- Create: `src/components/RecipeList.jsx`

- [ ] **Step 1: Create `src/components/Navbar.jsx`**

```jsx
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
```

- [ ] **Step 2: Create `src/components/LabelFilter.jsx`**

```jsx
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
```

- [ ] **Step 3: Create `src/components/RecipeCard.jsx`**

```jsx
export default function RecipeCard({ recipe, onEdit, onDelete }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
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
        {recipe.labels.map(label => (
          <span
            key={label.id}
            style={{ background: '#e0e0e0', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.8rem' }}
          >
            {label.name}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={() => onEdit(recipe)}>Edit</button>
        <button onClick={() => onDelete(recipe.id)} style={{ color: 'red' }}>Delete</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/RecipeList.jsx`**

```jsx
import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes, onEdit, onDelete }) {
  if (recipes.length === 0) {
    return <p style={{ color: '#888' }}>No recipes yet. Add one!</p>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar.jsx src/components/LabelFilter.jsx src/components/RecipeCard.jsx src/components/RecipeList.jsx
git commit -m "feat: add Navbar, LabelFilter, RecipeCard, RecipeList components"
```

---

## Task 8: RecipeForm + HomePage

**Files:**
- Create: `src/components/RecipeForm.jsx`
- Modify: `src/components/HomePage.jsx` (replace the placeholder)

- [ ] **Step 1: Create `src/components/RecipeForm.jsx`**

```jsx
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
      onSave(); // refresh labels in HomePage
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
```

- [ ] **Step 2: Replace `src/components/HomePage.jsx` with the full implementation**

```jsx
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
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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
```

- [ ] **Step 3: Start both servers and do a full end-to-end test**

Terminal 1:
```bash
cd server && node index.js
```

Terminal 2:
```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- [ ] Visiting `/` while logged out redirects to `/login`
- [ ] Register creates a new user and redirects to `/`
- [ ] Home page shows Navbar with username and logout button
- [ ] Label filter pills are visible (Breakfast, Lunch, etc.)
- [ ] "No recipes yet" message appears
- [ ] Clicking "+ Add Recipe" opens the modal form
- [ ] Filling in title + ingredients + instructions and submitting creates a recipe
- [ ] Recipe appears in the list with its labels
- [ ] Clicking "Edit" opens the modal pre-filled with existing data
- [ ] Editing and saving updates the recipe
- [ ] Clicking "Delete" removes the recipe from the list
- [ ] Clicking a label pill in LabelFilter filters the list
- [ ] Clicking "Logout" redirects to `/login`
- [ ] After logout, visiting `/` redirects to `/login`

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeForm.jsx src/components/HomePage.jsx
git commit -m "feat: add RecipeForm and HomePage — app is fully functional"
```

---

## Done

All school requirements are now satisfied:

| Requirement | Where |
|---|---|
| Node.js + Express | `server/index.js` |
| PostgreSQL + 2 tables | `users`, `recipes`, `labels`, `recipe_labels` |
| Register + bcrypt | `server/routes/auth.js` |
| Login + session | `server/routes/auth.js` |
| GET /me, POST /logout | `server/routes/auth.js` |
| Full CRUD for recipes | `server/routes/data.js` |
| async/await, parameterized queries, try/catch | All route files |
| Express Router | `routes/auth.js`, `routes/data.js` |
| Session middleware on protected routes | `requireAuth` in `data.js` |
| HTTP status codes 200/201/400/404 | All route files |
| React + useState + useEffect | All components |
| fetch + credentials:include + response.ok + error display | All components |
| Login, Register, Home screens | `LoginPage`, `RegisterPage`, `HomePage` |
| Main screen split into multiple components | `Navbar`, `LabelFilter`, `RecipeList`, `RecipeCard`, `RecipeForm` |
| All components in `src/components/` | ✓ |
| list rendering with map | `RecipeList`, `LabelFilter` |
| onClick / onChange / onSubmit | All forms and buttons |
| props for data/callbacks | All parent→child passing |
| React Router | `App.jsx` |
