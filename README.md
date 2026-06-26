# TowerPSA

A starter web-based PSA system with secure defaults and a clean full-stack scaffold.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create local environment file:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # macOS/Linux
   cp .env.example .env
   ```
3. Set a strong `JWT_SECRET` value in `.env`.
4. Run development server:
   ```bash
   npm run dev
   ```

## Fresh clone behavior (SQLite)

- The SQLite database file is local-only and ignored by git.
- On first run, the app creates `src/server/data/tower-psa.db` and all tables automatically.
- A default admin user is seeded when no users exist:
  - Email: `admin@example.com`
  - Password: `Password123!`
- A default SLA policy is also seeded automatically.

If you want to clear your local database and start over:

```bash
npm run db:reset
```

## Project structure

- `src/server` - Express API server and security middleware
- `src/client` - Static client resources and UI templates
- `public` - Public assets served by Express
- `tests` - Automated test cases
