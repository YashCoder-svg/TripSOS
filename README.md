# TripSOS

TripSOS is a travel companion for planning journeys, discovering useful local services, and staying prepared when plans change. The repository contains the **Phase 0 foundation, Phase 1 landing experience, and Phase 2 authentication/account foundation**. Trip management, live discovery, maps, and emergency response workflows are not implemented yet.

## Architecture

```text
client/   React single-page application (Vite)
server/   Express JSON API (Node.js)
```

The frontend calls application APIs through `client/src/services/apiClient.ts`; UI components should not call providers or the API directly. Backend routes, middleware, configuration, and services have separate homes under `server/src/`. The API connects to MongoDB before accepting requests. Access tokens live in frontend memory; rotating refresh tokens are stored as hashes in per-session MongoDB documents and sent to the browser only as secure, HTTP-only cookies. Emergency contacts are stored separately and returned only to their authenticated owner. Optional Unsplash photo requests are proxied by the server so the provider access key does not enter the browser bundle; curated Unsplash CDN images keep the page photographic when no key is configured.

## Technology

- React, Vite, TypeScript, Tailwind CSS
- React Router, TanStack Query, Framer Motion, React Hook Form, Zod, Lucide
- Express, Mongoose, Zod, Argon2, JWT, Helmet, CORS, express-rate-limit, Pino
- Unsplash photo adapter with provider image hotlinking and photographer attribution
- Vitest, Testing Library, Supertest

## Folder structure

```text
client/src/
  animations/ assets/ components/ hooks/ layouts/ lib/ pages/
  routes/ services/ store/ test/ types/ utils/
server/src/
  config/ controllers/ middleware/ models/ routes/ services/
  types/ utils/ validators/
server/test/
```

## Local setup

Requirements: Node.js 20.19+ or 22.12+, npm, and MongoDB 7+ for local application development.

1. Copy `.env.example` to `.env` in the repository root. Replace the example JWT secrets with separate random values of at least 32 characters.
2. Install dependencies with `npm install`.
3. Start MongoDB.
4. Start the frontend and API with `npm run dev`.
5. Open `http://localhost:5173`; check the API at `http://localhost:4000/api/health`.

The frontend API base URL defaults to `http://localhost:4000/api`; set `VITE_API_URL` in the client environment to use another API origin.

The landing page can use curated Unsplash CDN fallbacks without a key. To enable live photo selection, set `UNSPLASH_ACCESS_KEY` in the server environment. The server proxies the allow-listed `GET /api/images/random?slot=hero|road|friends|closing` requests, keeps the key server-side, and returns the provider image URL with photographer attribution. Provider failures use the curated fallback photo.

## Environment variables

| Variable              | Purpose                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `NODE_ENV`            | Runtime mode (`development`, `test`, or `production`)                                           |
| `PORT`                | API listening port                                                                              |
| `MONGODB_URI`         | MongoDB connection string                                                                       |
| `JWT_ACCESS_SECRET`   | Private access-token signing secret (at least 32 characters)                                    |
| `JWT_REFRESH_SECRET`  | Different private refresh-token signing secret (at least 32 characters)                         |
| `CLIENT_URL`          | Allowed browser origin for credentialed CORS and request-origin checks                          |
| `COOKIE_SAME_SITE`    | Refresh-cookie policy (`lax` by default; use `none` only with production HTTPS deployments)     |
| `UNSPLASH_ACCESS_KEY` | Optional server-only key for live Unsplash photography; curated photo fallbacks work without it |

Never commit `.env` or real credentials. The example file contains development placeholders only. Keep both JWT secrets and the Unsplash access key on the server; do not add them to a `VITE_` variable or client code. Refresh cookies are HTTP-only, `SameSite=Lax` by default, and marked `Secure` in production. Configure `COOKIE_SAME_SITE=none` only when the client and API are cross-site and HTTPS is enabled; write operations also validate the browser `Origin`.

## Authentication and account data

- Passwords are hashed with Argon2id; registration, login, and refresh attempts are rate limited.
- Access JWTs expire after 15 minutes and are held only in JavaScript memory. The API client refreshes once on an authenticated 401 and retries the original request once.
- Refresh JWTs expire after seven days, rotate on use, and are never returned in JSON. MongoDB stores only a SHA-256 hash, session family, current/previous token identifiers, and revocation/expiry metadata. Reuse of the immediately previous token revokes that session.
- `GET/PATCH /api/users/me` expose only profile fields. Email changes and password changes are not enabled in this phase.
- Emergency contacts are separate owner-scoped documents. They are fetched only on the profile screen, returned with `Cache-Control: no-store`, and excluded from generic user/auth responses and request logs.
- The dashboard is personalized but contains no fabricated trips. `/emergency` stays public and presents general guidance without location access or dispatch functionality.
- Backend integration tests use `mongodb-memory-server` and download a MongoDB test binary on first run; the local application still uses the configured MongoDB server.

## Development commands

```sh
npm run dev       # Run client and API
npm run build     # Production builds for both workspaces
npm run lint      # ESLint checks
npm run format    # Format repository files with Prettier
npm run typecheck # Strict TypeScript checks
npm test          # Frontend and backend tests
```

## Planned phases

1. Foundation and project setup (complete)
2. Design system and landing experience (complete)
3. Authentication and profile (complete)
4. Trips and live dashboard data
5. Maps and real place discovery
6. Weather
7. Itinerary
8. Emergency workflows and trusted contacts
9. Group travel and expenses
10. Offline/PWA support
11. AI-assisted travel guidance
12. Performance, security, accessibility, testing, and deployment hardening

Trip, emergency, group, and offline panels on the landing page are explicitly labeled visual demonstrations. They do not perform live searches, access location, send messages, or persist trip data.
