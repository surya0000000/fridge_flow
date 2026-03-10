# FridgeFlow 🧊

A full-stack fridge management and meal planning application. Track your inventory, discover recipes matched to what you have, build meal plans, and generate shopping lists automatically.

**Live Demo:** https://fridgeflow-2fkhwcq7j-surya0000000s-projects.vercel.app

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + React Router v6
- **Backend:** Node.js + Express + TypeScript + better-sqlite3
- **Auth:** JWT + RBAC (roles: user, admin)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Copy the backend environment file:

```bash
cp backend/.env.example backend/.env
```

2. Install all dependencies:

```bash
# From project root (requires concurrently)
npm install
npm run install:all
```

Or install separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Running the App

**Run both servers concurrently (recommended):**

```bash
npm run dev
```

**Run separately:**

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- **Dashboard** - Inventory overview, expiring items alerts, recipe suggestions, quick-add items
- **Recipes** - Personalized suggestions based on your current fridge contents with match % scores
- **Discover** - Browse all recipes with search and dietary filter chips
- **Shopping List** - Manual item entry, grouped by category, generate from meal plan
- **Profile** - Dietary preferences, allergy tracking, 7-day meal plan calendar view

## API

The backend runs on `http://localhost:3001`. The frontend Vite dev server proxies `/api/*` to the backend.

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT token |
| GET | /api/auth/me | Get current user |

### Main Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | /api/inventory | Fridge inventory CRUD |
| GET | /api/inventory/expiring | Items expiring in 3 days |
| GET | /api/recipes | List recipes (search, dietary, cuisine filters) |
| GET | /api/recipes/suggest | Recipes matched to inventory |
| POST/DELETE | /api/recipes/:id/save | Save/unsave recipes |
| GET/POST/DELETE | /api/mealplan | Meal plan CRUD |
| POST | /api/mealplan/sync-shopping | Generate shopping list from meal plan |
| GET/POST/PUT/DELETE | /api/shopping | Shopping list CRUD |
| GET/PUT | /api/profile | User profile and preferences |

## Environment Variables

See `backend/.env.example`:

```
JWT_SECRET=fridgeflow-dev-secret
PORT=3001
NODE_ENV=development
```

## Database

SQLite database stored at `backend/fridgeflow.db`. Created automatically on first run with 18 pre-seeded recipes including breakfasts, lunches, dinners, and various dietary tags.