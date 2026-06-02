# Admin Maintenance Guide

## Add A Dashboard Section

1. Create the component under `src/components/dashboard`.
2. Add the export to `src/components/dashboard/index.ts`.
3. Add the active key, nav button, tab trigger, and render branch in
   `src/pages/Dashboard.tsx`.
4. Add any domain types under `src/types`.
5. Add backend calls to `adminApi` in `src/lib/api.ts`.
6. Reuse `PaginationControls`, UI primitives, and existing table/form patterns.

## Add Or Change An API Call

1. Confirm the backend route and response shape.
2. Add or update TypeScript types in `src/types`.
3. Add a method to `adminApi`.
4. Let `apiRequest` handle auth, refresh, errors, and response unwrapping.
5. For file uploads, use an upload helper and `FormData`; do not set multipart
   `Content-Type` manually.

## Auth Rules

- Login uses `/auth/login-password`.
- Keep access and refresh tokens inside `authStorage`.
- Use `requireAuth: false` only for login or intentionally public endpoints.
- Do not read `.env` secrets into UI beyond the public Vite variables.

## Socket Rules

Use `subscribeToEvent` from `src/lib/socket.ts` and clean up listeners in
`useEffect`. Do not create ad-hoc socket instances in feature components.

When backend socket event names change, update both `src/lib/socket.ts` and any
feature listeners.

## UI Rules

- Use `src/components/ui` primitives before introducing new primitives.
- Keep section-specific logic inside dashboard components.
- Keep shared formatting in `src/lib/formatters.ts`.
- Keep request status and error state explicit in each feature.

## Verification

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

When changing an admin flow, manually verify:

- login and logout;
- access token refresh after a 401;
- target list/table loading;
- create/update/delete happy path;
- backend validation error display;
- pagination/filter state;
- socket listener cleanup if realtime is involved.
