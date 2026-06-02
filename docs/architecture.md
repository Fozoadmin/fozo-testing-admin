# Admin App Architecture

## Runtime Shape

The app is a single-page dashboard. `src/main.tsx` renders `src/App.tsx`.
`App.tsx` wraps the app in `AuthProvider`, defines the React Router routes, and
adds the global `ToastContainer`.

Routes:

- `/login`: password login screen.
- `/dashboard`: protected dashboard screen.
- `/`: redirects to `/dashboard`.
- `*`: redirects to `/dashboard`.

`RequireAuth` checks the auth context after a small localStorage hydration
delay. Unauthenticated users are redirected to `/login`.

## Dashboard Composition

`src/pages/Dashboard.tsx` owns the active dashboard tab state. It renders:

- `TopBar`
- desktop `Sidebar`
- mobile `Sheet` sidebar
- one dashboard module based on `active`

Tabs are state-driven, not URL-driven. Adding deep links would require changing
this state model.

Active sections:

- overview
- orders
- restaurants
- riders / delivery partners
- bags / surprise bags
- coupons
- customers
- finance
- notifications
- settings
- grocery stores
- grocery categories
- grocery items
- grocery bundle boxes

## UI System

Shared primitives live in `src/components/ui`. They wrap Radix and Tailwind
patterns:

- button, badge, card, dialog, input, label, select, separator, sheet, switch,
  table, tabs, textarea, multi-select.

Dashboard-specific components live in `src/components/dashboard`. Keep feature
forms, tables, modals, and per-section state inside that folder unless they are
generic enough for `components/ui`.

## Types

Domain types live in `src/types`. The API wrapper imports those types and
dashboard modules should reuse them instead of duplicating response shapes.

Important type groups:

- `orders.ts`
- `restaurants.ts`
- `grocery.ts`
- `coupons.ts`
- `delivery.ts`
- `finance.ts`
- `notifications.ts`
- `settings.ts`
- `users.ts`
- `socket.ts`

## State Model

Global state is intentionally small:

- `AuthContext`: current admin user, access token, refresh token, login/logout.
- local component state: filters, forms, pagination, modals, table state.
- localStorage: auth session only.

There is no global query cache. The API wrapper has a small in-flight request
dedupe map keyed by endpoint and body.

## Styling

Most styling is Tailwind utility classes in JSX. `src/index.css` contains global
theme/base CSS. Components use the `cn` helper from `src/lib/utils.ts` for class
merging.
