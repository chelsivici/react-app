---
name: Recipe App Requirements
description: School project fullstack recipe app - strict requirements from docx that must be followed
type: project
---

This is a school fullstack project: a recipe app where users register/login, then add/edit/delete recipes with labels.

**Requirements source:** `מסמך דרישות תשפו.docx` in the repo root.

Key constraints:
- Backend: Node.js + Express + SQL DB (user's choice of PostgreSQL/MySQL/SQLite)
- DB must have at least 2 tables: `users` + another (recipes), with a logical relation
- Auth: register with bcrypt, login with server-side sessions, GET /me, POST /logout
- Full CRUD for recipes via REST API
- Frontend: React with useState/useEffect, fetch for API calls
- 3 screens: Login, Register, Main App (conditional rendering or React Router)
- All components in `src/components/`, one per file
- Main screen must use multiple components

**Why:** School submission requirements — must be followed strictly.
**How to apply:** Always verify any new feature against these requirements. Do not add things not required; do not skip required things.
