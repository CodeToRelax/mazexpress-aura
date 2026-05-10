## Backend API alignment — admin web

Five backend changes to integrate. Frontend-only edits, no backend contract assumptions beyond what the user provided.

### 1. Domestic shipments — remove `itemPaidBy` / `shippingPaidBy` from request bodies

The fields still exist on the **read** model (we display "Paid by sender/receiver" on detail/table cards), so we keep them in the `DomesticShipment` type. We just stop **sending** them on create/edit.

Files:
- `src/types/domestic.ts` — drop `itemPaidBy` and `shippingPaidBy` from `AdminCreateBody` and `AdminEditBody`. Keep them on `DomesticShipment` (read-only).
- `src/utilities/zod/domestic.schemas.ts` — remove `itemPaidBy` and `shippingPaidBy` from `walkInSchema` and `editShipmentSchema` (and from the inferred form value types).
- `src/screens/domestic/shipments/CreateWalkIn.tsx` — remove the two "Paid by" Select fields, the smart-default `useEffect` that flips `itemPaidBy`, and stop including the fields in the submitted body.
- `src/screens/domestic/shipments/EditShipmentDialog.tsx` — remove the two "Paid by" Select fields and stop including them in the submitted body. Keep showing the current value somewhere read-only is unnecessary (already visible on the detail page cards).

### 2. Domestic shipments — new tier rules

- Customer mobile uses A/B/C only. Admin web uses A/B/C/D and removes `OTHER`.
- For tier D, `shippingPrice` is required and admin-set. For A/B/C, the input is hidden (server auto-calculates from the route).

Files:
- `src/types/domestic.ts` — change `DomesticTier` to `'A' | 'B' | 'C' | 'D'` (drop `OTHER`). Update `STANDARD_TIERS` accordingly.
- `src/utilities/zod/domestic.schemas.ts` — `tierEnum = z.enum(['A','B','C','D'])`. Replace the OTHER-based `shippingPrice` refinement with: `shippingPrice` required when `tier === 'D'`, otherwise omit/ignore.
- `src/screens/domestic/shipments/CreateWalkIn.tsx`:
  - Remove the `OTHER` `<SelectItem>`.
  - Show the shipping price input only when `tier === 'D'`.
  - Live route lookup + tier price preview now runs for A/B/C only (D shows "manual price" hint instead).
  - Submission: send `shippingPrice` only when `tier === 'D'`.
- `src/screens/domestic/shipments/EditShipmentDialog.tsx`:
  - Same tier list change, same conditional `shippingPrice` field (only for D), same submission rule.
  - Drop the "leave blank to recalculate" hint for non-D tiers since the input itself is gone.
- `src/components/domestic/TierChip.tsx` — confirm it handles only A/B/C/D. Remove any `OTHER` styling branch.

### 3. Domestic shipments — bulk status update

New endpoint:
```
POST /api/domestic-shipments/admin/bulk-status
body: { ids: string[], toStatus: DomesticStatus, note?: string }
→ { results: [{id, success, error?}], successCount, failCount }
```

Files:
- `src/utilities/api/domesticShipments.api.ts` — add `bulkUpdateStatus(ids, toStatus, note?)`.
- `src/screens/domestic/shipments/ShipmentsTable.tsx` — add row-level checkbox column + header "select all on page" checkbox. Lift selection state to parent.
- `src/screens/domestic/shipments/Shipments.tsx` — track `selectedIds: Set<string>`; render a sticky toolbar above the table when `selectedIds.size > 0` showing count, a status `<Select>`, optional note `<Input>`, "Apply" and "Clear" buttons. On apply: call `bulkUpdateStatus`, toast `successCount`/`failCount`, invalidate `['domestic-shipments']`, clear selection.
- The status options shown in the bulk select are the union of `ALLOWED_TRANSITIONS` targets — keep it simple: list all `DomesticStatus` values and let the backend reject per-row (the response already reports per-id failures).

### 4. Domestic shipments — label data endpoint (replaces ad-hoc print)

```
GET /api/domestic-shipments/admin/:id/label
→ { shipmentNumber, barcode, createdAt, status, tier,
    origin: { city, senderName, senderPhone },
    destination: { city, address, recipientName, recipientPhone, recipientAlternatePhone },
    parcel: { description, quantity, itemPrice, itemCurrency },
    shipping: { price, currency },
    options, notes }
```

Files:
- `src/types/domestic.ts` — add `DomesticLabelData` interface matching the response.
- `src/utilities/api/domesticShipments.api.ts` — add `getShipmentLabel(id): Promise<DomesticLabelData>`.
- New: `src/components/domestic/PrintDomesticLabel.tsx` — A6/10×10 printable label using the response data: barcode (use existing barcode lib if present, else `JsBarcode` via existing `PrintLabel*` pattern), shipment number, status chip, tier, origin/destination blocks (name + phone + city + address), parcel description and quantity, shipping price.
  - Re-use the look-and-feel of `src/components/shipments/PrintLabel10x10.tsx`. Same print CSS (`@media print`).
- `src/screens/domestic/shipments/ShipmentDetail.tsx` — add a "Print label" button next to "Edit". On click: fetch label data via the new endpoint, render `PrintDomesticLabel` in a portal, call `window.print()`. Mirror the existing print pattern used by international shipments.

### 5. Dashboard stats — values are now KG, not counts

`GET /api/shipments/stats` keeps the same keys but each value is total weight in kg. The dashboard widgets that consume this need their unit relabeled.

Files (verify usages with `rg "shipments/stats" src/` and `rg "ShipmentsStatsBar"`):
- `src/screens/shipments/ShipmentsStatsBar.tsx` — append `kg` to each stat value (use `kg` suffix and format with `toLocaleString(undefined, { maximumFractionDigits: 1 })`). Update the i18n labels to read "Total weight", "Pending weight", etc. Keep the click-through filter behavior intact.
- `src/types/shipment.ts` — keep `ShipmentStats` shape; add a JSDoc note that values are kilograms.
- Any dashboard cards on `Dashboard.tsx` that pull from `/shipments/stats` need the same kg suffix. (Existing `AirShipmentsCard` already uses `analytics` endpoints and is unaffected.)
- i18n: add/update `shipments.stats.*` keys in `src/utilities/localization/en/common.json` and `ar/common.json` to use weight wording. Keep keys at ≤3 levels (per project memory).

### Out of scope (per the user's note)

- Sea invoice fix: backend-only, no client change. Don't touch invoice generation code.

### Verification

- `tsc --noEmit` after the type and form-schema edits (catch any leftover `itemPaidBy`/`shippingPaidBy` / `OTHER` references).
- Manually run through: create walk-in (tier A → no price field, tier D → required), edit shipment (same), bulk status update from list, print label from detail.
- Check the dashboard stats card visibly shows `kg` units in both EN and AR.
