# Fozo Admin Web

Fozo Admin Web is the internal dashboard for managing the Fozo marketplace. It
is a Vite + React + TypeScript single-page app used by admins to manage users,
restaurants, delivery partners, surprise bags, grocery catalog, orders, coupons,
finance summaries, settings, notifications, and uploads.

## Repository Details

- Runtime: browser SPA built by Vite.
- Framework: React 19 with TypeScript.
- Styling: Tailwind CSS 4 with Radix UI primitives and local UI components.
- Routing: React Router.
- Realtime: Socket.IO client.
- Deployment config in repo: `vercel.json`.
- Main entrypoints: `src/main.tsx`, `src/App.tsx`, `src/pages/Dashboard.tsx`.
- Detailed docs: [`docs/README.md`](docs/README.md).

## Branches And Deployments

Use these branches for deployment coordination:

| Branch | Purpose |
| --- | --- |
| `production` | Production deployment branch. |
| `staging` | Staging deployment branch. |
| `main` | Default development/integration branch. |

The repo includes `vercel.json` with SPA rewrites to `index.html` and asset
cache headers. Confirm the actual Vercel project settings before changing
deployment branch mappings.

## Prerequisites

- Node.js compatible with the installed Vite/TypeScript toolchain.
- npm.
- A running Fozo backend API.
- Google Maps API key for restaurant geocoding features.

## Environment Setup

1. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in all values in `.env`. Never commit `.env`.

3. For local backend development, `VITE_API_BASE_URL` should normally point to
   the active backend API prefix:

   ```text
   http://localhost:3000/v4/fozo/api
   ```

## Environment Variables

| Key | Required | Used by | Description |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | `src/lib/api.ts`, `src/lib/socket.ts`, auth logout | Backend API base URL. Should include the active API prefix, normally `/v4/fozo/api`. Socket.IO derives the socket origin from this value. |
| `VITE_API_BASE_LOCAL_URL` | No | Documentation/local reference | Local backend URL reference. The app code currently reads `VITE_API_BASE_URL`, so set that key for actual runtime behavior. |
| `VITE_API_KEY` | Yes | API requests | Shared client API key sent as `x-api-key`. Must match backend `API_KEY_FOZO_CLIENT`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes for restaurant address geocoding | `Restaurants.tsx` | Google Maps/Geocoding API key used by the restaurant management form. |

## Install And Run Locally

```bash
npm install
npm run dev
```

The dev server will print the local URL.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
```

## App Structure

- `src/App.tsx`: auth provider, routes, protected dashboard route, toast setup.
- `src/pages/Login.tsx`: admin password login.
- `src/pages/Dashboard.tsx`: dashboard shell and active section state.
- `src/components/dashboard`: admin feature modules.
- `src/components/ui`: shared UI primitives.
- `src/lib/api.ts`: typed backend API wrapper and token refresh.
- `src/lib/socket.ts`: Socket.IO singleton and event helpers.
- `src/contexts/AuthContext.tsx`: localStorage-backed admin session.
- `src/types`: shared API/domain types.

For a deeper map, read [`docs/file-map.md`](docs/file-map.md) and
[`docs/feature-map.md`](docs/feature-map.md).

## Backend Dependency

The admin app expects the backend to expose active v4 routes under:

```text
/v4/fozo/api
```

Important backend routes used by this app include auth, admin, orders, bags,
coupons, upload, settings, finance, grocery, delivery partners, customers, and
notifications.

## Maintenance Notes

- Add new dashboard sections in `src/components/dashboard` and wire them in
  `src/pages/Dashboard.tsx`.
- Add API methods to `adminApi` in `src/lib/api.ts`; let the wrapper handle
  auth, refresh, errors, and response unwrapping.
- Use existing UI primitives before adding new component patterns.
- Clean up Socket.IO listeners in React effect cleanup functions.

See [`docs/maintenance.md`](docs/maintenance.md) for the full workflow.
