# Admin Feature Map

## Overview

Files:

- `src/components/dashboard/Overview.tsx`
- `src/components/dashboard/StatCard.tsx`

Shows aggregate admin stats and shortcuts into other dashboard sections.
Depends on `/admin/overview-stats`.

## Orders

Files:

- `src/components/dashboard/Orders.tsx`
- `src/components/dashboard/ordersModel.ts`
- `src/constants/orderStatus.ts`

Manages restaurant orders, filtering, pagination, and admin/delivery status
updates. List data comes from `/admin/orders`; status updates call
`/orders/:orderId/status`.

## Restaurants And Cuisines

Files:

- `src/components/dashboard/Restaurants.tsx`
- `src/types/restaurants.ts`

Manages restaurant onboarding, profile/status changes, cuisine assignment, and
image upload. It also calls Google Geocoding for coordinates.

Cuisine read/create calls are under `/admin/cuisines`; image upload uses
`/upload/cuisine`.

## Delivery Partners

Files:

- `src/components/dashboard/DeliveryPartners.tsx`
- `src/types/delivery.ts`

Manages delivery partner onboarding, status, online status, and profile changes
through `/admin/delivery-partners`.

## Surprise Bags

Files:

- `src/components/dashboard/SurpriseBags.tsx`
- `src/types/bags.ts`

Manages restaurant surprise bag inventory. Admin list/grouped data comes from
`/admin/bags` and `/admin/bags/grouped`; create/update/delete uses `/bags`.

## Coupons

Files:

- `src/components/dashboard/Coupons.tsx`
- `src/components/dashboard/couponsModel.ts`
- `src/types/coupons.ts`

Manages coupon listing, create, update, delete, activation, applicability, and
restaurant/grocery targeting through `/admin/coupons`.

## Customers

Files:

- `src/components/dashboard/Customers.tsx`
- `src/types/users.ts`

Lists and manages users, with filters for customer/user types. Uses
`/admin/users` and `/admin/users/count`.

## Finance

Files:

- `src/components/dashboard/Finance.tsx`
- `src/types/finance.ts`

Shows restaurant and delivery partner financial summaries from
`/admin/finance/restaurants` and `/admin/finance/delivery-partners`.

## Notifications

Files:

- `src/components/dashboard/Notifications.tsx`
- `src/types/notifications.ts`

Creates, edits, deletes, and lists scheduled notifications. Backend scheduler
later sends them through FCM.

## Settings

Files:

- `src/components/dashboard/Settings.tsx`
- `src/types/settings.ts`

Reads and updates operational settings through `/admin/settings`. Backend emits
`settings_updated` socket events after changes.

## Grocery Admin

Files:

- `src/components/dashboard/GroceryStores.tsx`
- `src/components/dashboard/GroceryCategories.tsx`
- `src/components/dashboard/GroceryItems.tsx`
- `src/components/dashboard/GroceryBundleBoxes.tsx`
- grocery model/type files under `src/components/dashboard/*Model.ts` and
  `src/types/grocery.ts`

Manages grocery stores, category catalog, individual grocery items, bundle box
combos, images, stock, pricing, and grocery order status updates.

## Pagination

`src/components/dashboard/PaginationControls.tsx` is the shared pagination UI.
`src/lib/api.ts` supports `page`, `limit`, and `offset` query params.
