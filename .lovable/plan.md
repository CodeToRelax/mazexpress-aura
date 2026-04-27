## Plan: Domestic Shipments admin module

Build to the Cursor "continuation" PRD. The original uploaded PRD is background context — it's superseded.

### 1. Types & API clients

- **`src/types/domestic.ts`** — `Route`, `DomesticShipment`, `StatusHistoryEntry`, `DomesticStatus` union (7 states), `Tier` union (`A|B|C|D|OTHER`), `AdminCreateBody`, `AdminEditBody`, `WalletTransaction` (for the inline card), paginated response wrappers.
- **`src/utilities/api/routes.api.ts`** — `listRoutes`, `getRoute`, `createRoute`, `updateRoute`, `deleteRoute`, `lookupRoute(origin, destination)`. Unwraps `{success, data, message}`. Surfaces `409 ROUTE_DUPLICATE` as a typed error.
- **`src/utilities/api/domesticShipments.api.ts`** — `listAdminShipments`, `getAdminShipment`, `createWalkIn`, `updateAdminShipment`, `changeStatus`, `softDelete`, `getShipmentTransactions`. `changeStatus` parses `409 DOMESTIC_SHIPMENT_INVALID_TRANSITION` and exposes `details.allowed`.
- Reuse existing `/users?search=&userType=customer` for the sender picker via a thin wrapper.

### 2. Shared building blocks

- **`src/components/domestic/DomesticStatusChip.tsx`** — single source for the 7 status colors + bilingual labels; `sm` and `md` variants.
- **`src/components/domestic/TierChip.tsx`** — A/B/C/D neutral, OTHER warning tone.
- **`src/components/domestic/CityCombobox.tsx`** — Libya-only subset (32 entries, including the intentional duplicates) wrapped around the existing `CitySearchCombobox` pattern.
- **`src/data/domesticCities.ts`** — title-case helper + the 32-city list.
- **`src/utilities/zod/domestic.schemas.ts`** — `routeSchema`, `walkInSchema`, `editShipmentSchema`. Phone regex `/^[+]?[0-9\s\-()]{7,20}$/`. Origin ≠ destination guard. `tier === 'OTHER' ⇒ shippingPrice required`.

### 3. Navigation & routes

Extend `src/data/navigation.tsx` with a `Domestic` parent (icon `Truck`) right under the existing `shipments` entry, with two children:
- `Routes` → `/admin/domestic/routes` (icon `Route`)
- `Shipments` → `/admin/domestic/shipments` (icon `Package`)

Add to `src/App.tsx`:
```
/admin/domestic/routes
/admin/domestic/shipments
/admin/domestic/shipments/new
/admin/domestic/shipments/:id
```

### 4. Routes pricing page (`src/screens/domestic/routes/`)

- **`Routes.tsx`** — header, search box, two clearable city filters, `+ New route` button, shadcn `Table`, server-side pagination (`limit=50`), empty state.
- **`RouteFormDrawer.tsx`** — right-side drawer (480px) for create + edit. Fields: origin, destination (must differ), four tier prices (number, ≥0, step 0.01). Inline `409` → "A route already exists for this pair." on the destination field.
- **`DeleteRouteDialog.tsx`** — `AlertDialog` with the soft-delete copy.

### 5. Domestic shipments list (`src/screens/domestic/shipments/`)

- **`Shipments.tsx`** — header, optional client-computed KPI strip, `+ New walk-in shipment`.
- **`StatusTabs.tsx`** — horizontal scrollable tab strip, `All` + one per status, drives `?status=`.
- **`ShipmentsFilters.tsx`** — debounced (300ms) search → `?q=`, origin/destination city, sender async picker → `?senderUserId=`, reset.
- **`ShipmentsTable.tsx`** — columns per §6.4 (Number mono + copy, Status chip, Origin → Dest, Sender + USN, Recipient + tel: link, Tier chip, Shipping + ✓ charged pill, Item + ✓ credited pill, Created relative+hover, row actions). `limit=20`. Row click → detail.

### 6. Walk-in create (`src/screens/domestic/shipments/CreateWalkIn.tsx`)

Three cards on one page:

- **Step 1 – Sender:** async user combobox on `/users?search=&userType=customer&limit=10`. On select: prefill `senderUserId` and `originCity` (still editable).
- **Step 2 – Recipient & shipment:** recipient block + shipment block. On `tier !== 'OTHER'` + both cities filled, call `GET /routes/lookup` and render a read-only "Tier C • 25.00 LYD" chip; on 404, destructive `Alert` "No route exists for this pair. Create one in Routes first." and disable submit. On `tier === 'OTHER'`, hide the chip and show a required `shippingPrice` input. Smart `itemPaidBy` default: Receiver if `itemPrice > 0`, else Sender.
- **Step 3 – Options & status:** three switches + initial status radio (default `awaiting_shipping`). Hint card under `in_transit` (generic wording per PRD).

On success: navigate to detail with toast `Walk-in shipment {{number}} created.`

### 7. Shipment detail (`src/screens/domestic/shipments/ShipmentDetail.tsx`)

Two columns; single column on small screens.

- **Hero:** `#shipmentNumber` + status chip; subline `originCity → recipient.city`, relative createdAt.
- **Right-side actions:**
  - **Change status popover** — only allowed next statuses (computed via the §4 transition table). Each option shows label, optional note (≤500), and the wallet hint when applicable:
    - to `in_transit`: only when `creationSource === 'app' && shippingPaidBy === 'sender' && shippingPrice > 0 && !shippingChargedAt` (walk-in suppresses).
    - to `delivered`: only when `itemPaidBy === 'receiver' && itemPrice > 0 && !itemCreditedAt`.
    - On 409, refresh the popover from `details.allowed`.
  - **Edit dialog** — same form as walk-in minus sender. Auto-recalc: when admin changes `tier`, `originCity`, or `recipient.city` and tier ≠ OTHER, clear `shippingPrice` so the server recomputes; show inline note "Shipping price will be recalculated from the route directory. Type a custom value to override." `tier === 'OTHER'` requires `shippingPrice`.
  - Overflow → soft delete with confirmation.

- **Left column:**
  - **Pricing & wallet card** — tier chip, shipping price + "✓ Charged on …" + amount + delta-posted banner if `shippingChargedAmount !== shippingPrice`; same for item; tiny "Wallet not yet charged" / "Wallet already charged on {{date}}" info chip.
  - **Wallet transactions for this shipment card** (sits beneath pricing) — `GET /wallet/admin/user/{senderUserId}/transactions?domesticShipmentId={id}&limit=10`. Compact rows: type icon (truck / package-plus / coins), description + status pill if not `completed`, signed amount + relative createdAt, tooltip with absolute timestamp + transactionNumber. Documented empty state. `View all` link if `totalDocs > 5`. Refresh button on header. Auto-invalidates with `['domestic-shipment', id]`.
  - **Recipient card** — phones with `tel:` + copy buttons.
  - **Item card** — description, quantity, paidBy, price.
  - **Options card** — three pills.
  - **Notes card** (collapsed if empty).

- **Right column – Status history timeline:** chip `from → to`, wallet posting badge if `shippingChargedAt`/`itemCreditedAt` flipped on this transition, actor (or "System"), note, timestamp. Newest on top.

- **Soft-deleted detail still loads** → destructive banner instead of 404.

### 8. React Query keys

```
['routes', { page, limit, originCity, destinationCity }]
['route', id]
['domestic-shipments', { status, page, limit, originCity, destinationCity, senderUserId, q }]
['domestic-shipment', id]
['domestic-shipment-transactions', { id, senderUserId }]
['users:search', { q, userType }]
```

Invalidations per §9: route mutations invalidate `['routes']` + `['domestic-shipments']`; shipment edit/status/delete invalidates `['domestic-shipment', id]` + `['domestic-shipments']` + `['domestic-shipment-transactions', { id }]`.

### 9. i18n

Add the full `domestic.admin.*` key tree (plus `domestic.status.*`, `domestic.tier.*`, `domestic.paid-by.*`) to both `src/utilities/localization/en/common.json` and `ar/common.json`. EN values straight from §11. AR labels per the original PRD §4 (بانتظار الموافقة, بانتظار الشحن, قيد التوصيل, تم التسليم, فشل التسليم, تم الإرجاع, ملغاة) and §11 hints.

### 10. Edge cases respected

- Soft-delete only (no hard-delete UI).
- Same-pair recreate after soft delete is allowed.
- Admin edit never sends `status` (status changes only via `/status`).
- Walk-in (`creationSource === 'walk_in'`) suppresses the wallet debit hint on `in_transit`.
- OTHER tier requires `shippingPrice` on create and on any edit switching to OTHER.
- All currency inputs `step="0.01"`, plain numbers.
- 401 falls through to the existing login redirect.

## Files to create / modify

**New (~21 files):**
- `src/types/domestic.ts`
- `src/utilities/api/routes.api.ts`
- `src/utilities/api/domesticShipments.api.ts`
- `src/utilities/zod/domestic.schemas.ts`
- `src/data/domesticCities.ts`
- `src/components/domestic/DomesticStatusChip.tsx`
- `src/components/domestic/TierChip.tsx`
- `src/components/domestic/CityCombobox.tsx`
- `src/components/domestic/SenderUserCombobox.tsx`
- `src/screens/domestic/routes/Routes.tsx`
- `src/screens/domestic/routes/RouteFormDrawer.tsx`
- `src/screens/domestic/routes/DeleteRouteDialog.tsx`
- `src/screens/domestic/shipments/Shipments.tsx`
- `src/screens/domestic/shipments/StatusTabs.tsx`
- `src/screens/domestic/shipments/ShipmentsFilters.tsx`
- `src/screens/domestic/shipments/ShipmentsTable.tsx`
- `src/screens/domestic/shipments/CreateWalkIn.tsx`
- `src/screens/domestic/shipments/ShipmentDetail.tsx`
- `src/screens/domestic/shipments/ChangeStatusPopover.tsx`
- `src/screens/domestic/shipments/EditShipmentDialog.tsx`
- `src/screens/domestic/shipments/ShipmentTransactionsCard.tsx`

**Modified:**
- `src/App.tsx` (4 new routes)
- `src/data/navigation.tsx` (Domestic parent + 2 children)
- `src/utilities/localization/en/common.json` and `ar/common.json` (domestic.* keys)

## Out of scope (per §13)

Driver assignment, push/SMS, bulk operations, separate rejection workflow, reports, multi-currency.

## One question before I start

The Cursor PRD specifies `/admin/domestic/routes` and `/admin/domestic/shipments`. Your existing app uses unprefixed paths (`/shipments`, `/users`, `/settings`). I'll follow the PRD literally and use the `/admin/domestic/...` prefix unless you'd rather match the existing convention with `/domestic/routes` + `/domestic/shipments`. Defaulting to the PRD prefix — say the word if you want the shorter version.
