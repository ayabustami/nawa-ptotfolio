# NAWA Technology: Portfolio

React (Vite) -> Node.js/Express REST API -> Neon PostgreSQL.

## Setup
1. `cp .env.example .env` and set `DATABASE_URL` (Neon connection string). `.env` is git-ignored.
2. `npm install`
3. `npm run db:setup`  (applies `server/schema.sql`, then `server/seed.sql` with LUMIERE only)
4. `npm run dev`  (API on :3001, site on :5173 with `/api` proxied)

## API
- `GET /api/projects` (`?featured=true` optional), `GET /api/projects/:slug`
- `POST /api/contact` { name, email, company?, message } -> `contact_inquiries`

## Adding a real project later
Insert rows only (no React changes): `projects`, then `project_technologies`, `project_features`, `project_media`.
Use `sort_order` for ordering and `is_published` to show or hide. Media `url` can point to files in `client/public/`.

## Placeholders to fill (search for PLACEHOLDER)
- `client/src/data/site.js`: `contactDetails.email` / `linkedin` (nothing shows until set)
- `client/index.html`: `og:url`, `og:image`; `client/public/favicon.svg` (temporary mark)
- LUMIERE has no `project_media` rows, so a neutral frame shows until real screenshots are added.

## Production
Build client with `npm run build` (set `VITE_API_URL` if the API is on another origin), run `npm start -w server`
with `DATABASE_URL` and `CORS_ORIGINS` set in the host's environment.
