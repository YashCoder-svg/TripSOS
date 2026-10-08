# TripSOS — Full-Stack Travel & Safety Platform

> **PLAN → TRAVEL → HANDLE PROBLEMS → STAY SAFE**

TripSOS is a production-grade travel companion platform designed to assist travelers before journey departure, throughout exploration, and during critical emergencies. It unites destination discovery, interactive vector mapping, verified real-world meteorological forecasts, drag-and-drop daily itinerary scheduling, group travel collaboration with multicurrency expense splitting, an offline emergency pack PWA, and a grounded AI travel assistant backed strictly by controlled server tools.

---

## 1. Product Vision & Feature Overview

TripSOS is architected around the complete traveler lifecycle:

### Before Travel
- **Destination Autocomplete & Geocoding:** Search cities, regions, and landmarks with instant coordinate resolution via OpenStreetMap Nominatim and Geoapify.
- **Trip Lifecycle Management:** Create, customize, edit, cancel, and archive trips with dates, traveler counts, currencies (`INR`, `USD`, `EUR`, `GBP`), travel styles, and interest tags.
- **Weather Intelligence:** Live and forecast meteorological conditions via Open-Meteo with precipitation probabilities, wind speeds, humidity, and date-range availability checks.
- **Smart Itinerary Planning:** Day-by-day activity timelines, time slots, categories, notes, completion toggles, and deterministic place suggestions.
- **Group Collaboration:** Secure, tokenized invitation links, role assignments (`owner`, `member`), and member directory management.
- **Multicurrency Expense Ledger:** Track group expenses, equal or custom splits, deterministic debt settlement optimization, and live exchange rate conversion backed by the European Central Bank.

### During Travel
- **Interactive Vector Maps:** WebGL-accelerated vector mapping via MapLibre GL JS and OpenFreeMap Liberty styles with zero frontend API key exposure.
- **Real Place Discovery:** Discover verified nearby dining, lodging, transit, ATMs, fuel, pharmacies, hospitals, and repair services via OpenStreetMap Overpass API without data hallucination.
- **Grounded AI Travel Assistant:** Conversational companion that queries real trip records, live weather, place directories, expense settlements, and verified emergency facilities through strictly controlled backend tools.

### When Something Goes Wrong (Emergency Mode)
- **Immediate Public Access:** `/emergency` is directly accessible without requiring login, featuring high-contrast, distraction-free emergency actions.
- **Verified Emergency Numbers:** Authoritative, country-specific dispatch numbers (General SOS, Police, Medical/Ambulance, Fire) documented from international telecommunications authorities (ITU).
- **Nearby Emergency Services:** Rapid radius search for verified hospitals, clinics, police stations, and pharmacies using consented device geolocation.
- **Cryptographically Secure Location Sharing:** One-tap emergency location snapshots generating unguessable, time-limited (`30m`, `1h`, `4h`) shareable links that can be revoked at any moment.
- **Offline Emergency Pack & PWA:** Standalone Progressive Web App with service worker caching, cached emergency contacts, cached trip itineraries, offline first-aid protocols, and one-tap emergency dialers when network connectivity drops.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19 single-page application built with Vite and TypeScript
- **Styling:** Vanilla CSS design system + Tailwind CSS utilities with custom dark mode glassmorphism
- **Routing:** React Router 7 with code-split lazy routes and Suspense fallbacks
- **Server State & Caching:** TanStack Query (React Query)
- **Forms & Validation:** React Hook Form with Zod schemas
- **Mapping:** MapLibre GL JS (open-source WebGL vector map rendering)
- **Motion:** Framer Motion (respecting `prefers-reduced-motion`)
- **Icons:** Lucide React
- **PWA:** Web App Manifest + Service Worker with cache-first assets and network-first navigation

### Backend
- **Runtime:** Node.js 20+ / 22+ with ES Modules (TypeScript)
- **HTTP Engine:** Express 5 with JSON payload limits and security middleware
- **Database:** MongoDB 7+ with Mongoose ODM
- **Authentication:** Argon2id password hashing + JWT access tokens + rotating refresh sessions
- **Validation:** Zod schemas on all route boundaries
- **Security:** Helmet, express-rate-limit, CORS, origin validation, timing-safe equality
- **Logging:** Pino structured logging with path parameter redaction

### Testing & Tooling
- **Test Runners:** Vitest (client in JSDOM environment, server in Node environment)
- **In-Memory DB:** `mongodb-memory-server` for isolated backend integration testing
- **DOM Testing:** Testing Library (`@testing-library/react`, `@testing-library/user-event`)
- **HTTP Assertions:** Supertest
- **Linting & Formatting:** ESLint 9 + Prettier

---

## 3. Architecture & Principles

```text
                        UI Components (React + Tailwind CSS)
                                       ↓
                     Frontend Services & TanStack Query Hooks
                                       ↓
                    Backend REST API Routes (Express + Zod)
                                       ↓
                      Authorization & Middleware Pipeline
                                       ↓
                 Business Logic Services (Trips, Expenses, etc.)
                                       ↓
         Provider Adapters (Location, Weather, Exchange, Unsplash)
                                       ↓
    External Services (OSM, Overpass, Open-Meteo, ECB, OpenFreeMap)
```

### Engineering Principles
1. **Security First:** No credentials, tokens, or private secrets in frontend bundles. Refresh tokens reside exclusively in HttpOnly, SameSite, Secure cookies.
2. **Privacy First:** Never track users in the background. Geolocation is requested only with explicit user consent and clear purpose dialogs. Stored location data is strictly minimized.
3. **Real Verified Data:** Zero data hallucination. If place hours, ratings, emergency dispatch lines, or long-range weather forecasts are unavailable from verified providers, TripSOS renders an honest fallback rather than fabricating data.
4. **Resilient Offline Fallbacks:** When offline, cached trip plans, contacts, first aid manuals, and dialers remain operational through service worker caching and IndexedDB/localStorage packs.

---

## 4. Repository Structure

```text
TripSOS/
├── client/                          # React + Vite frontend application
│   ├── public/
│   │   ├── icons/                   # PWA icons (192x192, 512x512, maskable)
│   │   ├── manifest.webmanifest     # Progressive Web App manifest
│   │   └── sw.js                    # Production Service Worker
│   ├── src/
│   │   ├── animations/              # Framer motion variants
│   │   ├── components/
│   │   │   ├── ai/                  # Travel Assistant drawer, tool badges, action cards
│   │   │   ├── auth/                # Login, Register, Session modals
│   │   │   ├── common/              # Buttons, inputs, modals, cards, badges
│   │   │   ├── emergency/           # Emergency cards, contact pickers, share sheets
│   │   │   ├── expenses/            # Expense form, settlement ledger, currency switchers
│   │   │   ├── group/               # Member lists, invite token dialogs, role badges
│   │   │   ├── itinerary/           # Timeline view, day filters, drag-and-drop slots
│   │   │   ├── landing/             # Cinematic hero, trust badges, feature sections
│   │   │   ├── maps/                # MapLibre GL wrapper, markers, popup drawers
│   │   │   ├── places/              # Destination autocomplete, place cards, filters
│   │   │   ├── trips/               # Trip cards, creation form, budget meters
│   │   │   └── weather/             # Current conditions, 7-day forecast cards
│   │   ├── hooks/                   # useNetworkStatus, usePwaInstall, useGeolocation
│   │   ├── layouts/                 # AppLayout, Navigation, OfflineBanner
│   │   ├── pages/                   # Route page components
│   │   ├── routes/                  # React Router definition & route guards
│   │   ├── services/                # API clients, offline pack services
│   │   ├── store/                   # Auth & UI state management
│   │   ├── styles.css               # Global styling, tokens, animations
│   │   └── types/                   # Frontend TypeScript interfaces
│   └── vite.config.ts               # Vite configuration with chunk isolation
├── server/                          # Express + TypeScript backend API
│   ├── src/
│   │   ├── config/                  # Environment validation (Zod) & Pino logger
│   │   ├── middleware/              # Auth, error handling, rate limiting, origin check
│   │   ├── models/                  # Mongoose data models
│   │   ├── routes/                  # API endpoints grouped by domain
│   │   ├── services/
│   │   │   ├── ai/                  # Grounded AI assistant & controlled tool executor
│   │   │   ├── emergency/           # Authoritative dispatch numbers directory
│   │   │   ├── exchange/            # ECB Frankfurter exchange rate adapter
│   │   │   ├── expense/             # Deterministic debt settlement algorithm
│   │   │   ├── location/            # OSM Nominatim, Overpass & Geoapify adapters
│   │   │   └── weather/             # Open-Meteo meteorological adapter
│   │   ├── validators/              # Zod input validation schemas
│   │   └── app.ts                   # Express application setup
│   └── test/                        # Vitest server integration tests (Supertest + MongoMemoryServer)
├── .env.example                     # Environment template
└── package.json                     # Monorepo workspace configuration
```

---

## 5. Local Setup & Quickstart

### Prerequisites
- **Node.js:** 20.19+ or 22.12+ (LTS recommended)
- **npm:** 10+
- **MongoDB:** MongoDB 7.0+ (Local Community Server or MongoDB Atlas connection string)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vaiss/TripSOS.git
   cd TripSOS
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Generate two distinct 32+ character secrets for JWT tokens (e.g. using `openssl rand -hex 32`).

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start local development servers:**
   ```bash
   npm run dev
   ```
   - Frontend runs at: `http://localhost:5173`
   - Backend API runs at: `http://localhost:4000`
   - Healthcheck verifies at: `http://localhost:4000/api/health`

---

## 6. Environment Variables Reference

All secret keys reside strictly on the server. Never prefix sensitive variables with `VITE_`.

### Server Environment (`.env` in repo root)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` \| `test` \| `production` | `development` | Runtime environment mode |
| `PORT` | Number | `4000` | HTTP API port |
| `MONGODB_URI` | String | Required | MongoDB connection string (local or Atlas) |
| `JWT_ACCESS_SECRET` | String (≥32 chars) | Required | Secret for signing 15-minute access tokens |
| `JWT_REFRESH_SECRET` | String (≥32 chars) | Required | Secret for signing 7-day refresh tokens (must differ from access secret) |
| `CLIENT_URL` | URL | `http://localhost:5173` | Allowed frontend origin for CORS and CSRF verification |
| `COOKIE_SAME_SITE` | `lax` \| `strict` \| `none` | `lax` | Refresh token cookie SameSite policy (`none` requires HTTPS) |
| `LOCATION_PROVIDER` | `osm` \| `geoapify` | `osm` | Primary geocoding and places provider adapter |
| `LOCATION_PROVIDER_API_KEY` | String | Optional | API key if using Geoapify provider |
| `MAP_STYLE_URL` | URL | OpenFreeMap Liberty | Vector tile stylesheet URL |
| `UNSPLASH_ACCESS_KEY` | String | Optional | Server key for Unsplash photos (curated fallbacks used if omitted) |

### Client Environment (`client/.env.production` or platform settings)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | URL | `http://localhost:4000/api` | Base URL for TripSOS API endpoints |
| `VITE_MAP_STYLE_URL` | URL | OpenFreeMap Liberty | Public vector tile style URL |

---

## 7. External Providers & Integrations

TripSOS integrates exclusively with verified, authoritative services using decoupled provider adapters:

| Provider | Service Category | Implementation Details | Auth / API Key |
| :--- | :--- | :--- | :--- |
| **Open-Meteo** | Weather & Forecasts | Live temperatures, feels-like, wind, humidity, weather codes, and precipitation probabilities. | No key required (Open Data) |
| **OpenStreetMap & Nominatim** | Destination Geocoding | Autocomplete searches and reverse geocoding with user-agent attribution. | No key required (ODbL) |
| **OpenStreetMap Overpass API** | Real Place Discovery | Tagged queries for dining, lodging, transit, hospitals, police, pharmacies, fuel, ATMs. | No key required (ODbL) |
| **Geoapify** | Geocoding & Places (Alternative) | Drop-in adapter configured via `LOCATION_PROVIDER=geoapify`. | API key on server |
| **European Central Bank (Frankfurter)** | Exchange Rates | Live daily foreign exchange rates between `INR`, `USD`, `EUR`, and `GBP`. | No key required (Public ECB data) |
| **OpenFreeMap** | Vector Map Tiles | High-speed vector tiles using the Liberty style specification. | No key required |
| **ITU & National Agencies** | Emergency Dispatch | Authoritative emergency dispatch directory for universal emergency numbers. | Authoritative database |

---

## 8. Database Architecture

Persisted via MongoDB and Mongoose:

1. **`User`**: Account identity (`email`, `name`, `passwordHash` via Argon2id, `language`, `profilePhoto`, `travelPreferences`).
2. **`RefreshSession`**: Active auth sessions with cryptographic `tokenHash`, `familyId`, `currentJti`, `previousJti`, rotation tracking, and expiration.
3. **`EmergencyContact`**: Owner-scoped emergency contacts (`name`, `phone`, `relationship`, `priority`, `email`).
4. **`Trip`**: Primary travel records (`owner`, `name`, `destinationName`, `destinationCoordinates`, `startDate`, `endDate`, `travelerCount`, `budget`, `currency`, `travelStyle`, `interests`, `status`).
5. **`TripMember`**: Group collaborators (`trip`, `user`, `role: owner | member`, `status: active | pending`, `inviteToken`, `expiresAt`).
6. **`ItineraryItem`**: Scheduled activities (`trip`, `title`, `description`, `date`, `startTime`, `endTime`, `location`, `coordinates`, `category`, `notes`, `status`, `order`).
7. **`Expense`**: Travel expenses (`trip`, `paidBy`, `amount`, `currency`, `exchangeRate`, `convertedAmount`, `category`, `date`, `participants`, `splitMethod`).
8. **`EmergencySession`**: Active/resolved emergency sessions (`user` optional, `type`, `locationSnapshot`, `notes`, `startedAt`, `endedAt`, `status`).
9. **`LocationShare`**: Ephemeral emergency location share links (`token`, `user` optional, `sessionId`, `location`, `durationMinutes`, `expiresAt`, `revokedAt`).

---

## 9. API Reference

All private endpoints require `Authorization: Bearer <accessToken>`.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create new traveler account (Argon2id, sets HttpOnly cookie)
- `POST /api/auth/login` — Authenticate and start session
- `POST /api/auth/refresh` — Rotate refresh token and issue new access token
- `POST /api/auth/logout` — Revoke active session family and clear cookie
- `GET /api/auth/me` — Retrieve authenticated user profile

### User Profile & Contacts (`/api/users`)
- `PATCH /api/users/me` — Update traveler preferences and details
- `GET /api/users/me/emergency-contacts` — List personal emergency contacts
- `POST /api/users/me/emergency-contacts` — Add emergency contact
- `PATCH /api/users/me/emergency-contacts/:id` — Update contact
- `DELETE /api/users/me/emergency-contacts/:id` — Remove contact

### Trips (`/api/trips`)
- `GET /api/trips` — List user's active, upcoming, and past trips
- `POST /api/trips` — Create new trip record
- `GET /api/trips/:tripId` — Get trip workspace details (enforces owner/member access)
- `PATCH /api/trips/:tripId` — Update trip details
- `PATCH /api/trips/:tripId/status` — Transition trip status
- `DELETE /api/trips/:tripId` — Delete trip (owner only)

### Itinerary (`/api/trips/:tripId/itinerary`)
- `GET /` — List scheduled itinerary items for trip
- `POST /` — Add itinerary activity
- `PATCH /:itemId` — Edit activity details or status
- `DELETE /:itemId` — Remove activity
- `PATCH /reorder` — Reorder items within day schedule

### Group Collaboration (`/api/trips/:tripId/members`)
- `GET /` — List trip members and pending invites
- `POST /invite` — Create secure, expiring invitation token
- `POST /join` — Join trip using valid invitation token
- `DELETE /:memberId` — Remove member (or leave trip)

### Expenses & Settlements (`/api/trips/:tripId/expenses`)
- `GET /` — Retrieve expenses, category breakdown, balances, and settlement graph
- `POST /` — Add expense with equal or custom split
- `PATCH /:expenseId` — Edit expense details
- `DELETE /:expenseId` — Remove expense

### Places & Discovery (`/api/places`)
- `GET /geocode?q={query}` — Search destinations
- `GET /reverse?lat={lat}&lon={lon}` — Reverse geocode coordinates
- `GET /nearby?lat={lat}&lon={lon}&category={cat}&radius={r}` — Discover verified nearby services
- `GET /:providerId` — Place details drawer

### Weather (`/api/weather`)
- `GET /?lat={lat}&lon={lon}&startDate={d}&endDate={d}` — Live conditions and forecast

### Emergency System (`/api/emergency`)
- `POST /sessions` — Start emergency session (guests & authenticated users)
- `PATCH /sessions/:sessionId/status` — Resolve or end emergency session
- `GET /numbers?country={country}` — Authoritative emergency dispatch numbers
- `GET /nearby?lat={lat}&lon={lon}&type={medical|police|fire}` — Nearby verified emergency facilities
- `POST /share` — Generate secure, expiring emergency location snapshot
- `POST /share/:token/revoke` — Revoke active emergency link
- `GET /share/:token` — View emergency location snapshot (safe public view)

### Grounded AI Assistant (`/api/ai`)
- `POST /chat` — Conversational travel assistant executing verified server tools
- `POST /action/execute` — Approve and execute suggested assistant actions (e.g., adding itinerary item)

---

## 10. Security & Privacy Hardening

### Authentication & Sessions
- **Argon2id Hashing:** Password hashing configured with memory cost 19,456 KiB, 2 iterations, 1 parallelism thread.
- **Short-Lived Access Tokens:** 15-minute JWTs held strictly in React memory (never in `localStorage`).
- **Cryptographic Refresh Token Rotation:** Single-use refresh tokens with SHA-256 hash storage. Automatic family revocation detects and invalidates breached sessions.
- **Cookie Security:** Cookies restricted to `Path=/api/auth`, `HttpOnly`, `SameSite=Lax` (or `None` with HTTPS), and `Secure` in production.
- **Origin Validation:** All state-changing auth endpoints enforce strict `Origin` header validation to eliminate CSRF threats.

### Multi-Tier Rate Limiting
- Global API limiter: 300 requests / 15 minutes.
- Auth registration: 5 requests / 15 minutes.
- Auth login: 10 requests / 15 minutes.
- Auth refresh: 30 requests / 15 minutes.
- Emergency endpoints: 120 requests / 1 minute (high threshold ensuring emergency access is never throttled).

### Location Privacy Principles
- **No Background Tracking:** No background geolocation watches or tracking beacons exist in the codebase.
- **Explicit Consent:** Device coordinates are only accessed after an interactive dialog explaining the explicit purpose.
- **Data Minimization:** Device coordinates are never permanently attached to user profiles.
- **Unguessable Tokens:** Location share URLs use 192-bit cryptographic randomness (`crypto.randomBytes(24).toString('base64url')`).
- **Auto-Expiration & Instant Revocation:** Share links automatically expire (30m, 1h, 4h) and can be immediately revoked.
- **Log Redaction:** Path parameters in sensitive endpoints (such as emergency contacts) are automatically redacted in structured logs.

---

## 11. Testing & Verification

The test suite covers unit logic, provider adapters, authorization boundaries, settlement algorithms, emergency flows, and UI workflows:

```bash
# Run backend test suite (in-memory MongoDB)
npm test --workspace @tripsos/server

# Run frontend test suite (JSDOM)
npm test --workspace @tripsos/client

# Run strict TypeScript typecheck
npm run typecheck --workspace @tripsos/server
npm run typecheck --workspace @tripsos/client

# Run ESLint across both workspaces
npm run lint --workspace @tripsos/server
npm run lint --workspace @tripsos/client

# Verify production builds
npm run build --workspace @tripsos/server
npm run build --workspace @tripsos/client

# Run dependency security audit
npm audit
```

### Verified Test Counts
- **Server Test Suite:** 10 test suites, **77 tests passing** (100% pass rate).
- **Client Test Suite:** 18 test suites, **71 tests passing** (100% pass rate).
- **Total Passing Automated Tests:** **148 tests**.
- **Audit:** 0 known vulnerabilities.

---

## 12. Production Deployment Guide

### Database (MongoDB Atlas)
1. Deploy a MongoDB Atlas M0 (Free) or dedicated cluster running MongoDB 7.0+.
2. In **Network Access**, allow access from your backend host IP addresses.
3. In **Database Access**, create an application user with readWrite privileges.
4. Obtain the connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/tripsos?retryWrites=true&w=majority`.

### Backend API (Render / Railway / Fly.io)
1. Set the root directory to `server` or configure repository build command:
   ```bash
   npm install && npm run build --workspace @tripsos/server
   ```
2. Set the start command:
   ```bash
   npm run start --workspace @tripsos/server
   ```
3. Configure environment variables:
   - `NODE_ENV=production`
   - `PORT=4000`
   - `MONGODB_URI=<your-atlas-uri>`
   - `JWT_ACCESS_SECRET=<secret-min-32-chars>`
   - `JWT_REFRESH_SECRET=<different-secret-min-32-chars>`
   - `CLIENT_URL=https://your-tripsos-frontend.vercel.app`
   - `COOKIE_SAME_SITE=none` (required when frontend and API are hosted on different domains over HTTPS)
   - `LOCATION_PROVIDER=osm`
   - `MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty`

### Frontend Application (Vercel)
1. Connect repository to Vercel. Set framework preset to **Vite**.
2. Root directory: `client`.
3. Build command: `npm run build`. Output directory: `dist`.
4. Configure environment variables:
   - `VITE_API_URL=https://your-tripsos-api.onrender.com/api`
   - `VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty`
5. Configure SPA fallback rewriting in `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 13. Known Limitations

In the interest of complete engineering transparency:
1. **OpenStreetMap Overpass Rate Limits:** In remote wilderness locations with low server density, Overpass queries can take up to 2–3 seconds to execute. In-memory 5-minute caching mitigates redundant queries.
2. **Deterministic Expense Settlement vs. Real Banking Rails:** The expense ledger computes exact peer-to-peer debt settlements and conversion amounts deterministically; direct in-app bank transfers or automated UPI payments are not connected.
3. **Browser Storage Quotas for Offline Packs:** Offline Emergency Packs utilize browser `localStorage` and `CacheStorage`. Browsers in aggressive private-browsing modes may enforce stricter storage limits or clear caches upon tab closure.
4. **Authoritative Numbers Scope:** Emergency dispatch numbers cover the global directory via ITU recommendations and national agencies; remote territories without official cellular dispatch fall back to universal SOS standard `112`.

---

## 14. License

Distributed under the MIT License. See `LICENSE` for more information.
