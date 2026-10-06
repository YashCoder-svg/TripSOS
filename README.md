# TripSOS

TripSOS is a travel companion for planning journeys, discovering useful local services, and staying prepared when plans change. The repository contains the **Phase 0 foundation, Phase 1 landing experience, Phase 2 authentication/account foundation, and Phase 3 trip management**. Live discovery, maps, weather, itinerary planning, expenses, group collaboration, and emergency response workflows are not implemented yet.

## Architecture

```text
client/   React single-page application (Vite)
server/   Express JSON API (Node.js)
```

The frontend calls application APIs through `client/src/services/apiClient.ts`; UI components should not call providers or the API directly. Backend routes, middleware, configuration, and services have separate homes under `server/src/`. The API connects to MongoDB before accepting requests. Access tokens live in frontend memory; rotating refresh tokens are stored as hashes in per-session MongoDB documents and sent to the browser only as secure, HTTP-only cookies. Emergency contacts and trips are stored separately and returned only to their authenticated owner. Optional Unsplash photo requests are proxied by the server so the provider access key does not enter the browser bundle; curated Unsplash CDN images keep the page photographic when no key is configured.

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

## Trip Management (Phase 3)

### Trip Domain

TripSOS provides a core travel workspace where authenticated users organize their journeys. Each trip stores core itinerary boundaries (dates, travelers, budget, style, and interests) and anchors future phase workspaces (maps, day-by-day itineraries, expense splitters, and group collaboration).

### Trip Data Model

Trips are persisted in MongoDB via Mongoose (`Trip` model) with the following fields:

| Field                     | Type                  | Required   | Description                                                                                                                        |
| ------------------------- | --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `_id`                     | ObjectId              | System     | Unique trip identifier                                                                                                             |
| `owner`                   | ObjectId (ref User)   | Yes        | Authenticated user ID (indexed, never exposed to client)                                                                           |
| `name`                    | String                | Yes        | Name of trip (1–80 characters)                                                                                                     |
| `destinationName`         | String                | Yes        | Name/label of destination (1–120 characters)                                                                                       |
| `destinationCountry`      | String                | Optional   | Country of destination                                                                                                             |
| `destinationCoordinates`  | Object                | Optional   | Provider-neutral `{ latitude, longitude }`                                                                                         |
| `destination`             | Object                | Optional   | Subdocument designed for Phase 4 provider expansion (`providerId`, `formattedAddress`, `city`, `region`, `country`, `coordinates`) |
| `startDate`               | String (`YYYY-MM-DD`) | Yes        | Inclusive start calendar date                                                                                                      |
| `endDate`                 | String (`YYYY-MM-DD`) | Yes        | Inclusive end calendar date (`endDate >= startDate`)                                                                               |
| `travelerCount`           | Number                | Yes        | Positive integer between 1 and 30                                                                                                  |
| `budget`                  | Number                | Yes        | Non-negative budget limit (up to 100,000,000)                                                                                      |
| `currency`                | Enum                  | Yes        | ISO currency code (`INR`, `USD`, `EUR`, `GBP`)                                                                                     |
| `travelStyle`             | Enum                  | Yes        | `budget`, `balanced`, `comfort`, `adventure`, `family`, `backpacking`                                                              |
| `interests`               | Array of Enums        | Optional   | `nature`, `food`, `adventure`, `history`, `shopping`, `photography`, `nightlife`, `family`, `culture` (up to 9)                    |
| `status`                  | Enum                  | Controlled | `planning`, `upcoming`, `active`, `completed`, `cancelled`                                                                         |
| `createdAt` / `updatedAt` | Date                  | System     | Auto-managed timestamps                                                                                                            |

**Indexes:**

- `{ owner: 1, startDate: 1 }`: Optimizes chronological user trip feeds.
- `{ owner: 1, status: 1 }`: Optimizes owner-scoped status queries and filtering.

### Trip API Endpoints

All trip endpoints require authentication (`Bearer <access-token>`) and respond with `Cache-Control: no-store`.

- **`POST /api/trips`**: Creates a new trip. Validated with Zod (`createTripSchema`). Client-supplied `owner` and `status` fields are rejected. Returns `201 Created`.
- **`GET /api/trips`**: Lists all trips belonging to the authenticated user, sorted chronologically by `startDate`.
- **`GET /api/trips/:tripId`**: Retrieves a single trip by ID.
- **`PATCH /api/trips/:tripId`**: Updates editable trip fields (name, dates, budget, etc.). Validates that `endDate >= startDate`. Client-supplied status is rejected here to preserve controlled transitions.
- **`PATCH /api/trips/:tripId/status`**: Updates trip status to `planning`, `upcoming`, `active`, `completed`, or `cancelled`. Enforces ownership and enum validation.
- **`DELETE /api/trips/:tripId`**: Deliberately removes a trip owned by the authenticated user.

### Authorization Strategy

- **Session Identity**: The server extracts `userId` strictly from the verified JWT access token (`req.auth.userId`). No client-supplied owner ID is trusted.
- **Data Boundary Protection**: Every query is scoped to `{ _id: tripId, owner: req.auth.userId }`. If another user attempts to view, edit, change status of, or delete a trip they do not own, the server returns `404 Not Found`. This prevents resource enumeration and avoids leaking whether another traveler's private resource exists.
- **Sanitized Serialization**: The internal `owner` ID is stripped prior to serialization in API responses.

### Date Conventions & Timezone Safety

- Dates are stored as strict ISO calendar strings in `YYYY-MM-DD` format.
- Parsing and formatting use UTC calendar methods (`Date.UTC` and `Intl.DateTimeFormat(..., { timeZone: 'UTC' })`). This prevents dates from shifting across local timezone boundaries (e.g., UTC midnight converting to the previous calendar day).
- **Duration Semantics**: Travel duration uses inclusive calendar day counting:
  $$\text{Duration} = \text{round}\left(\frac{\text{Date}_{\text{end}} - \text{Date}_{\text{start}}}{86,400,000}\right) + 1$$
  For example, 12 Oct → 16 Oct is counted and displayed as 5 travel days (12, 13, 14, 15, and 16 October).

### Currency Handling

- Budgets support ISO 4217 currency codes: `INR`, `USD`, `EUR`, and `GBP`.
- Amounts are formatted in the UI using locale-aware `Intl.NumberFormat` with the stored currency code.
- No automatic currency conversions are applied; the amount and currency are preserved exactly as entered by the traveler.

### Status Derivation & Control

- Trips with status `cancelled` or `planning` retain their status until updated by the user.
- Other trips automatically derive status relative to the current local calendar day:
  - Before `startDate`: `upcoming`
  - Between `startDate` and `endDate`: `active`
  - After `endDate`: `completed`

### UI Screens & Navigation

- `/dashboard`: Displays the nearest upcoming or active trip card with prominent CTA, or the fresh adventure empty state when no trips exist.
- `/trips`: Categorized trip list showing Upcoming, Active, Planning, Past, and Cancelled trips, or a first-trip empty state.
- `/trips/new`: Premium trip creation form built with React Hook Form, Zod validation, and inline feedback.
- `/trips/:tripId`: Central trip workspace featuring a photographic hero banner, summary metrics, travel readiness indicators, status cancel/restore actions, and tabs (Overview, Map, Itinerary, Expenses, Group) with intentional "Coming next" previews.
- `/trips/:tripId/edit`: Reusable trip form for updating existing plans.
- Delete modal: Accessible dialog with keyboard trapping, backdrop dismissal, and explicit confirmation to prevent accidental data loss.

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
4. Trip management and dashboard integration (complete)
5. Maps and real place discovery
6. Weather
7. Itinerary
8. Emergency workflows and trusted contacts
9. Group travel and expenses
10. Offline/PWA support
11. AI-assisted travel guidance
12. Performance, security, accessibility, testing, and deployment hardening

Trip, emergency, group, and offline panels on the landing page are explicitly labeled visual demonstrations. They do not perform live searches, access location, send messages, or persist trip data.
