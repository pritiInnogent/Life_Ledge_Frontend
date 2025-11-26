# LifeLedger — Starter (Vite + React + Tailwind)

This is a ready-to-run frontend skeleton of **LifeLedger** built with Vite, React, React Router and Tailwind CSS.
It follows a componentized structure and simple context-based auth (mock).

## Features
- Auth context (mocked login/signup)
- React Router v6 with protected routes
- Dashboard layout with sidebar & header
- Componentized pages and layout (SOLID-friendly separation)
- Tailwind for styling (minimal config)

## Run locally
1. Node 18+ recommended.
2. Install dependencies:
```bash
npm install
```
3. Start dev server:
```bash
npm run dev
```
4. Open http://localhost:5173

## Notes
- Auth is mocked (sessionStorage). Replace with real API in `src/contexts/AuthContext.jsx`.
- UI uses lucide-react icons. Ensure dependencies installed.
- This is a frontend-only starter. Add backend APIs and features as needed.
