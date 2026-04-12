# Recipe App — Design Spec
**Date:** 2026-04-12

## Overview

A full-stack recipe sharing app. Users must be logged in to access anything. All logged-in users share a single pool of recipes. Each recipe can have labels (predefined + custom). Users can add, edit, and delete recipes.

**Stack:** React (Vite) + React Router · Node.js + Express · PostgreSQL · express-session + bcrypt

---

## Architecture

Monorepo with two independent sub-projects:

```
react-app/
├── src/                 ← React frontend (existing Vite setup)
└── server/              ← Express backend
```

Vite proxies all `/api/*` requests to `http://localhost:3000` in development. Frontend and backend run on separate ports.

---

## File Structure

### Frontend (`src/`)

```
src/
├── App.jsx              ← React Router setup, auth check
├── main.jsx
├── components/
│   ├── Navbar.jsx
│   ├── RecipeList.jsx
│   ├── RecipeCard.jsx
│   ├── RecipeForm.jsx   ← shared for add + edit
│   └── LabelFilter.jsx
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    └── HomePage.jsx
```

### Backend (`server/`)

```
server/
├── index.js             ← Express entry point, session config
├── db.js                ← pg pool connection
└── routes/
    ├── auth.js          ← register / login / logout / me
    └── recipes.js       ← recipes CRUD + labels endpoints
```

---

## Database Schema

### `users`
| column | type |
|---|---|
| id | SERIAL PRIMARY KEY |
| username | VARCHAR UNIQUE NOT NULL |
| email | VARCHAR UNIQUE NOT NULL |
| password_hash | VARCHAR NOT NULL |
| created_at | TIMESTAMP DEFAULT NOW() |

### `recipes`
| column | type |
|---|---|
| id | SERIAL PRIMARY KEY |
| user_id | INTEGER REFERENCES users(id) |
| title | VARCHAR NOT NULL |
| ingredients | TEXT NOT NULL |
| instructions | TEXT NOT NULL |
| image_url | VARCHAR |
| prep_time | INTEGER (minutes) |
| servings | INTEGER |
| created_at | TIMESTAMP DEFAULT NOW() |

### `labels`
| column | type |
|---|---|
| id | SERIAL PRIMARY KEY |
| name | VARCHAR UNIQUE NOT NULL |
| is_default | BOOLEAN DEFAULT FALSE |

Default labels seeded on startup: Breakfast, Lunch, Dinner, Dessert, Vegan, Quick, Italian, Healthy, Snack.

### `recipe_labels` (junction)
| column | type |
|---|---|
| recipe_id | INTEGER REFERENCES recipes(id) ON DELETE CASCADE |
| label_id | INTEGER REFERENCES labels(id) ON DELETE CASCADE |

---

## API Endpoints

### Auth — `/api/auth`
| method | path | auth required | description |
|---|---|---|---|
| POST | `/api/auth/register` | no | create user, bcrypt password |
| POST | `/api/auth/login` | no | verify password, create session |
| POST | `/api/auth/logout` | yes | destroy session |
| GET | `/api/auth/me` | yes | return current user (no password) |

### Recipes — `/api/recipes`
| method | path | description |
|---|---|---|
| GET | `/api/recipes` | all recipes with labels |
| GET | `/api/recipes/:id` | single recipe with labels |
| POST | `/api/recipes` | create recipe + attach labels |
| PUT | `/api/recipes/:id` | update recipe + labels |
| DELETE | `/api/recipes/:id` | delete recipe |

### Labels — `/api/labels`
| method | path | description |
|---|---|---|
| GET | `/api/labels` | all labels (default + custom) |
| POST | `/api/labels` | create custom label |

All recipe and label routes protected by session middleware (returns 401 if not logged in).

---

## Frontend Flow

### Routes
```
/login      → LoginPage    (redirects to / if already logged in)
/register   → RegisterPage (redirects to / if already logged in)
/           → HomePage     (redirects to /login if not logged in)
```

### HomePage layout
- **Navbar** — app name, current username, logout button
- **LabelFilter** — clickable label pills; filters the recipe list client-side
- **RecipeList** — responsive grid of RecipeCard components
- **RecipeCard** — title, image, prep time, servings, label chips, edit + delete buttons
- **RecipeForm** — modal for adding and editing recipes (same component, reused)

### Auth state
- `App.jsx` calls `/api/auth/me` on mount to check if user is logged in
- `user` state (null or user object) drives protected route rendering
- React Router redirects unauthenticated users to `/login`

### Fetch conventions
- All API calls use `async/await`
- Always check `response.ok`; show error message to user on failure
- Components fetch their own data in `useEffect`

---

## Requirements Compliance Checklist

- [x] Node.js + Express backend
- [x] PostgreSQL database
- [x] 2+ tables with logical relations (users → recipes many-to-many with labels)
- [x] Register + Login + Session + bcrypt
- [x] GET /me and POST /logout
- [x] Full CRUD for recipes
- [x] async/await, Express Router, parameterized queries, try/catch, status codes
- [x] Session middleware on protected routes
- [x] React with useState + useEffect
- [x] fetch with response.ok + error handling
- [x] Login, Register, and Main app screens
- [x] Main screen split into multiple components
- [x] All components in `src/components/`
- [x] list rendering with map, events, props
- [x] React Router for navigation
