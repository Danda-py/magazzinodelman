# Il magazzino del man

A full-stack Italian e-commerce, admin ERP panel, and landing page for "Il magazzino del man" — a curated second-hand/resale shop founded by Lucchini Luca.

## Stack

- **Frontend** (`artifacts/magazzino`): React + Vite + Tailwind v4 + shadcn/ui + Wouter routing + TanStack Query + Clerk auth
- **API server** (`artifacts/api-server`): Express 5 + Clerk Express middleware + Drizzle ORM + PostgreSQL
- **Shared libs**: `lib/db` (Drizzle schema + client), `lib/api-zod` (Zod validators), `lib/api-client-react` (generated API client), `lib/api-spec` (OpenAPI spec)
- **Auth**: Replit-managed Clerk (Google + email/password); admin role assigned by `ADMIN_EMAIL` env var at JIT provisioning

## How to run

Both workflows are managed automatically:
- **`artifacts/magazzino: web`** — Vite dev server for the frontend
- **`artifacts/api-server: API Server`** — Express API (builds then starts)

Install dependencies (from repo root):
```bash
pnpm install
```

Push DB schema:
```bash
pnpm --filter @workspace/db run push
```

## Environment variables

| Key | Where set | Purpose |
|-----|-----------|---------|
| `DATABASE_URL` | Auto (Replit) | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Auto (Clerk) | Clerk server key |
| `CLERK_PUBLISHABLE_KEY` | Auto (Clerk) | Clerk publishable key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Auto (Clerk) | Clerk key for Vite frontend |
| `ADMIN_EMAIL` | Shared env | Email that gets auto-promoted to admin role on first sign-in |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional | Email sending (not required to run) |

## Key features

- Landing page ("vetrina") with hero, Chi Siamo, social links, and hardcoded footer
- Public e-commerce store with filtering (price, condition, brand, color), cart overlay, and simulated Stripe checkout
- Public item proposal form — users can propose items for the shop to resell
- Client–admin chat that unlocks once a proposal is accepted
- Admin panel with: financial dashboard (revenues/expenses/profits), product inventory + proposal management with commission calculator, and CMS content editor
- Admin role: sign in with the `ADMIN_EMAIL` address to get full admin access

## User preferences

- Keep Italian UI copy as-is (the app is Italian-language)
- Footer signature "Sito di Andaloro Davide" is hardcoded and must never be editable via CMS
