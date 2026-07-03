---
name: Auth system design
description: Clerk auth setup, JIT DB provisioning, session model, and admin access
---

## Auth system

- **Provider**: Replit-managed Clerk (Google + email/password)
- **Session**: Cookie-based (web). No `setAuthTokenGetter` — that's mobile only.
- **JIT provisioning**: `lib/user-provisioning.ts` — on each auth'd request, looks up user by Clerk ID; first sign-in fetches Clerk profile, links by verified email, creates DB record.
- **Admin role**: assigned at registration if email matches `ADMIN_EMAIL` env var. Can also be changed at runtime via `PATCH /api/users/:id/role` (admin only).

## "Development mode" badge in Clerk sign-in

Expected behavior — NOT a bug. Replit-managed Clerk uses `pk_test` / `sk_test` keys in dev and auto-swaps to live keys at publish time. Do NOT try to fix this; do NOT hand-edit the secrets.

## Admin panel navigation

- **"Torna al Sito"**: uses `<a href="/">` (plain anchor, not Clerk signOut). Navigates without logging out.
- **"Disconnetti"**: calls `signOut({ redirectUrl: "/" })` — actual logout.
- The admin panel is a nested wouter router at `/admin`. Chat links from the admin panel MUST use `<a href="/chat/N">` (plain anchor) not `<Link>`, or they resolve to `/admin/chat/N`.

## Proposals schema

Columns added: `instagram_handle` (text, nullable), `condition` (text, nullable — new_with_tags | like_new | used).
API accepts these as extra fields on `POST /proposals` (passed through with `as any` cast since generated Zod schema wasn't regenerated).

**Why:** Adding to generated files avoids a full orval codegen run; trade-off is type safety on these two fields.
