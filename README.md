# TripSOS

TripSOS is a travel companion foundation for planning journeys, discovering useful local services, and staying prepared when plans change. This repository currently contains **Phase 0 only**: application scaffolding, a small design foundation, routing placeholders, an API health endpoint, and initial tests. Authentication, trip management, discovery, maps, and emergency workflows are not implemented yet.

## Architecture

```text
client/   React single-page application (Vite)
server/   Express JSON API (Node.js)
```

The frontend calls the backend through `client/src/services/apiClient.ts`; UI components should not call providers or the API directly. Backend routes, middleware, configuration, and services have separate homes under `server/src/`. MongoDB connection configuration is prepared, but database models and connection-at-start behavior are not part of this foundation.

## Technology

- React, Vite, TypeScript, Tailwind CSS
- React Router, TanStack Query, Framer Motion, React Hook Form, Zod, Lucide
- Express, Mongoose, Zod, Argon2, JWT, Helmet, CORS, express-rate-limit, Pino
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

Requirements: Node.js 20.19+ or 22.12+, npm, and MongoDB is not required to run the current health endpoint.

1. Copy `.env.example` to `.env` in the repository root. Replace the example JWT secrets with separate random values of at least 32 characters.
2. Install dependencies with `npm install`.
3. Start both applications with `npm run dev`.
4. Open `http://localhost:5173`; check the API at `http://localhost:4000/api/health`.

The frontend API base URL defaults to `http://localhost:4000/api`; set `VITE_API_URL` in the client environment to use another API origin.

## Environment variables

| Variable             | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `NODE_ENV`           | Runtime mode (`development`, `test`, or `production`)          |
| `PORT`               | API listening port                                             |
| `MONGODB_URI`        | MongoDB connection string for later database-backed phases     |
| `JWT_ACCESS_SECRET`  | Reserved for access-token signing in the authentication phase  |
| `JWT_REFRESH_SECRET` | Reserved for refresh-token signing in the authentication phase |
| `CLIENT_URL`         | Allowed browser origin for credentialed CORS                   |

Never commit `.env` or real credentials. The example file contains development placeholders only.

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

1. Foundation and project setup (current)
2. Design system and landing experience
3. Authentication and profile
4. Trips and dashboard
5. Maps and real place discovery
6. Weather
7. Itinerary
8. Emergency workflows and trusted contacts
9. Group travel and expenses
10. Offline/PWA support
11. AI-assisted travel guidance
12. Performance, security, accessibility, testing, and deployment hardening

Phase placeholders communicate planned areas and should not be read as working product features.
