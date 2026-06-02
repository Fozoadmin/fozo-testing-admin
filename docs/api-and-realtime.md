# API And Realtime

## Backend Base URL

`src/lib/api.ts` reads:

- `VITE_API_BASE_URL`
- `VITE_API_KEY`

The base URL should point at the backend API prefix, usually:

```text
https://<backend-host>/v4/fozo/api
```

Every JSON request sends:

- `Content-Type: application/json`
- `x-api-key: <VITE_API_KEY>`
- `Authorization: Bearer <accessToken>` when `requireAuth` is true

## Auth Storage

`src/lib/authStorage.ts` uses localStorage keys:

- `user`
- `auth_token`
- `refresh_token`

`AuthContext` restores those keys on mount. `isAuthenticated` requires a user
and refresh token. Logout clears local storage and calls `/auth/logout` with the
refresh token.

## Login

`src/pages/Login.tsx` calls:

```text
POST /auth/login-password
```

Payload:

- `identifier`
- `password`

The expected response includes `user`, `accessToken`, and `refreshToken`.

## Token Refresh

`src/lib/api.ts` handles refresh internally:

1. If an authenticated request has no access token, call `/auth/refresh`.
2. If an authenticated request returns 401, call `/auth/refresh` once and retry.
3. If refresh fails or a retry still fails, clear session and redirect to
   `/login`.

Refresh requests are mutexed with `refreshAccessTokenPromise` to prevent
parallel refresh storms.

## Request Wrapper

Use `apiRequest<T>(endpoint, options)` for low-level calls and `adminApi` for
feature calls. `adminApi` groups calls for:

- overview stats
- users/customers
- restaurants and cuisines
- orders
- delivery partners
- surprise bags
- settings
- coupons
- finance
- notifications
- image uploads
- grocery categories/stores/items/bundle boxes/orders

The wrapper unwraps backend responses shaped as `{ success, data, message }` and
returns the `data` payload.

## Uploads

`uploadImage` posts `FormData` with field name `image` and does not set
`Content-Type`, allowing the browser to set the multipart boundary.

Admin upload helpers:

- `uploadRestaurantImage`
- `uploadSurpriseBagImage`
- `uploadCuisineImage`
- `uploadGroceryImage`
- `uploadGroceryCategoryImage`

All require admin auth on the backend.

## Google Geocoding

`Restaurants.tsx` calls Google Geocoding directly from the browser using
`VITE_GOOGLE_MAPS_API_KEY` to turn addresses into coordinates during restaurant
management.

## Socket.IO

`src/lib/socket.ts` derives the socket host from `VITE_API_BASE_URL` by removing
the `/api` path. It connects with the stored access token:

```ts
io(socketUrl, {
  auth: { token },
  transports: ['websocket', 'polling'],
  reconnection: true,
})
```

Known events:

- `new_order`
- `settings_updated`
- `order_updated`
- `new_grocery_order`
- `grocery_order_updated`

Use `subscribeToEvent` to listen and always call the returned unsubscribe
function from React cleanup.
