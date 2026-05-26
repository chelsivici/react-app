# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack recipe app (school project). Users can register/login, then add, edit, and delete recipes with labels. Stack: React (Vite) frontend + Node.js/Express backend + SQL database.

## Commands

```bash
npm run dev       # Start Vite dev server (frontend)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

For the backend (once added): run from `server/` with `node index.js` or `npm start`.

## Requirements (from מסמך דרישות תשפו.docx)

These are strict school requirements — all must be satisfied:

### Backend (server/)
- **Stack:** Node.js + Express, SQL database (PostgreSQL/MySQL/SQLite)
- **DB:** Minimum 2 tables — `users` + recipes table (with logical relation between them: one-to-many or many-to-many)
- **Auth endpoints:**
  - `POST /register` — hash password with bcrypt before saving
  - `POST /login` — create server-side session
  - `GET /me` — return logged-in user data (no password)
  - `POST /logout` — destroy session
- **CRUD:** Full GET/POST/PUT/DELETE for at least one entity (recipes)
- **Rules:** async/await, Express Router, parameterized queries, try/catch, correct HTTP status codes (200/201/400/404), session middleware on protected routes
- **File structure:**
  ```
  server/
  ├── index.js        # server entry point
  ├── db.js           # DB connection
  └── routes/
      ├── auth.js     # register/login/logout/me
      └── data.js     # CRUD for recipes
  ```

### Frontend (src/)
- **Screens:** Login, Register, Main app (conditionally rendered or via React Router)
- **Main screen** must be split into multiple components
- **All components** go in `src/components/`, one per file
- **State:** useState + useEffect; fetch for all API calls
- **Fetch rules:** async/await, check `response.ok`, show error to user on failure
- **Patterns required:** list rendering with `map`, event handlers (onClick/onChange/onSubmit), props for data/callbacks between components

## Current Architecture

- `src/App.jsx` — root component, holds all state (tasks array, newTaskText)
- `src/TaskList.jsx` — maps state to `<Item>` components
- `src/Item.jsx` — single item with edit/delete controls
- `src/rest.js` — empty, intended for API calls
- No routing library installed yet; navigation via conditional rendering in App.jsx

State shape currently: `{ tasks: [{id, text, isediting}], newTaskText: string }`

When migrating to recipes: state shape becomes `{ user, screen, recipes: [{id, title, ingredients, labels, ...}] }`

## Commit Convention

Always commit as `chelsivici`. Use conventional commits where appropriate.
