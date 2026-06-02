# Admin File Map

## Root

- `package.json`: scripts, dependencies, package metadata.
- `vite.config.ts`: Vite config.
- `tsconfig*.json`: TypeScript project configs.
- `eslint.config.js`: ESLint config.
- `components.json`: shadcn-style component config.
- `vercel.json`: SPA rewrites and asset cache headers.
- `index.html`: Vite HTML shell.
- `.env.example`: documented environment variable names.
- `public/logo.png`: static logo asset.

## Source Entry

- `src/main.tsx`: React DOM root.
- `src/App.tsx`: providers, routes, auth guard, toasts.
- `src/index.css`: global CSS and Tailwind/theme base.

## Pages

- `src/pages/Login.tsx`: admin password login.
- `src/pages/Dashboard.tsx`: dashboard layout and active tab state.

## Auth And Libraries

- `src/contexts/AuthContext.tsx`: admin auth session state.
- `src/lib/api.ts`: backend API wrapper and `adminApi` methods.
- `src/lib/authStorage.ts`: localStorage auth helpers.
- `src/lib/socket.ts`: Socket.IO singleton and subscriptions.
- `src/lib/formatters.ts`: INR/date/time formatting.
- `src/lib/utils.ts`: class utilities and error message helpers.
- `src/hooks/useDebounced.ts`: debounced value hook.

## Dashboard Components

- `src/components/dashboard/Sidebar.tsx`, `TopBar.tsx`: navigation shell.
- `Overview.tsx`, `StatCard.tsx`: admin summary.
- `Orders.tsx`, `ordersModel.ts`: restaurant order management.
- `Restaurants.tsx`: restaurant and cuisine management.
- `DeliveryPartners.tsx`: delivery partner management.
- `Customers.tsx`: user/customer management.
- `SurpriseBags.tsx`: surprise bag inventory.
- `Coupons.tsx`, `couponsModel.ts`: coupon management.
- `Finance.tsx`: financial summaries.
- `Settings.tsx`: operational settings.
- `Notifications.tsx`: scheduled push notifications.
- `GroceryStores.tsx`, `groceryStoresModel.ts`: grocery store admin.
- `GroceryCategories.tsx`: grocery category admin.
- `GroceryItems.tsx`, `groceryItemsModel.ts`: grocery item admin.
- `GroceryBundleBoxes.tsx`: grocery bundle combo admin.
- `PaginationControls.tsx`: shared pagination.
- `index.ts`: dashboard exports.

## UI Components

`src/components/ui` contains shared primitives: badge, button, card, dialog,
input, label, multi-select, select, separator, sheet, switch, table, tabs, and
textarea.

## Types And Constants

- `src/types/*`: API/domain types for all dashboard modules.
- `src/constants/orderStatus.ts`: order status constants used by admin views.
- `src/assets/react.svg`: leftover template asset.

## Generated Or Dependency Files

Dependency locks and generated build output are not part of the app source map.
Do not edit lockfiles manually.
