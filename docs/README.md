# Fozo Admin Documentation

This repo is the Fozo internal admin dashboard. It is a Vite React SPA used to
manage restaurants, surprise bags, grocery stores, grocery catalog, orders,
customers, delivery partners, coupons, finance summaries, notifications, and
settings.

## Stack

- React 19 with TypeScript.
- Vite with `@vitejs/plugin-react-swc`.
- React Router for app routes.
- Tailwind CSS 4.
- Radix UI primitives and local shadcn-style UI components.
- Lucide React icons.
- Socket.IO client for realtime order/settings events.
- React Toastify for notifications.

## Start Here

- [architecture.md](architecture.md): app structure and dashboard composition.
- [api-and-realtime.md](api-and-realtime.md): backend client, auth, uploads,
  token refresh, and Socket.IO behavior.
- [feature-map.md](feature-map.md): admin modules and ownership.
- [file-map.md](file-map.md): source tree map.
- [maintenance.md](maintenance.md): how to add or change admin features.

## Local Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

## Environment

Use `.env.example` for variable names. Do not commit real `.env` values.

Required:

- `VITE_API_BASE_URL`: backend base URL, normally ending in `/v4/fozo/api`.
- `VITE_API_BASE_LOCAL_URL`: local backend example URL.
- `VITE_API_KEY`: shared client API key sent as `x-api-key`.
- `VITE_GOOGLE_MAPS_API_KEY`: used by restaurant address geocoding.

## Deployment

`vercel.json` rewrites all routes to `index.html` for SPA routing and adds
long-term cache headers for built assets.

## Verification Status

At the time these docs were created, `npm run typecheck` passed.
