
## Goal

Strip every reference to "domestic" / `isDomestic` / `domesticShipmentDetails` / domestic routes from the app so the codebase only knows about international shipments. This gives a clean slate before the new domestic service is built from scratch.

## Scope of removal

### 1. Types & schemas
- `src/types/shipment.ts`
  - Drop `IDomesticShipmentDetails` interface.
  - Remove `isDomestic`, `domesticShipmentDetails` from `IShipment`, `CreateShipmentPayload`, `UpdateShipmentPayload`, `PriceCalculationPayload`, `ShipmentFilters`.
  - Remove `IN_TRANSIT`, `CANCELLED`, `RETURNED` only if exclusively used by domestic flows (audit references; if used elsewhere keep them, but remove only the domestic-specific helpers).
- `src/utilities/zod/shipment.schemas.ts`
  - Delete `domesticShipmentDetailsSchema`.
  - Remove `isDomestic`, `domesticShipmentDetails` from create/update schemas.
  - Simplify the `originCountry` refine (always required, since everything is international now).

### 2. Helpers
- `src/utilities/helpers/shipmentNormalizer.ts` — drop `isDomestic` and `domesticShipmentDetails` normalization.
- `src/utilities/helpers/shipmentHelpers.ts` — drop `isDomestic` line.
- `src/utilities/helpers/shipmentStatusHelpers.ts` — remove `DOMESTIC_STATUSES`, simplify `getAvailableStatuses` / `isValidStatusForShipmentType` to no longer take `isDomestic` (return only `INTERNATIONAL_STATUSES`).
- `src/utilities/helpers/shipmentLabel.ts` — remove `generateDomesticLabelHTML`, domestic CSS, and the `isDomestic` branching; always render the international label.
- `src/components/shipments/PrintLabel10x10.tsx` — remove `generateDomesticLabel10x10HTML`, domestic CSS block, and the split-by-`isDomestic` logic; always print the international 10x10 label.

### 3. Shipment screens & components
- Delete `src/components/shipments/DomesticShipmentDetailsForm.tsx`.
- `src/screens/shipments/CreateShipmentDialog.tsx`
  - Remove `defaultDomestic` prop, `isDomestic` toggle field, `DomesticShipmentDetailsForm`, and all `!form.watch('isDomestic')` conditionals (keep the international branch only).
  - Remove `domesticShipmentDetails` from defaults and submit payload.
- `src/screens/shipments/EditShipmentDialog.tsx` — same cleanup as create dialog.
- `src/screens/shipments/ShipmentDetail.tsx` — remove the "Domestic" yes/no row and the entire "Domestic Shipment Details" section.
- `src/components/shipments/QuickStatusUpdate.tsx` — drop the `isDomestic` prop; always use international statuses. Update every caller.
- `src/components/invoices/InvoiceItemsTable.tsx` — call `getAvailableStatuses()` without the `isDomestic` argument.
- Audit `Shipments.tsx`, `ShipmentsFilters.tsx`, `ShipmentsTable.tsx`, `BulkUpdateDialog.tsx`, `ExportShipmentsDialog.tsx` and remove any `isDomestic` filter / column / option.

### 4. Settings (domestic routes pricing)
- Delete files:
  - `src/screens/settings/DomesticRoutesCard.tsx`
  - `src/screens/settings/AddOriginCityDialog.tsx`
  - `src/screens/settings/AddRouteDialog.tsx`
  - `src/screens/settings/DeleteOriginCityDialog.tsx`
  - `src/screens/settings/DeleteRouteDialog.tsx`
  - `src/screens/settings/EditableRouteCell.tsx` (only used by DomesticRoutesCard — verify first; remove if so)
  - `src/data/libyanCities.ts` and `src/components/ui/CitySearchCombobox.tsx` if exclusively used by the deleted dialogs (verify first).
- `src/screens/settings/SystemSettings.tsx` — remove the import and the entire "Domestic Routes Section" block.
- `src/utilities/api/config.api.ts` — delete `DomesticRoutesResponse` interface, the `domestic` field on related types, and every domestic-routes function: `getDomesticRoutes`, `getOriginCityRoutes`, `getRoutePrice`, `setOriginCityRoutes`, `setRoutePrice`, `updateRoutePrice`, `deleteRoute`, `deleteOriginCity` (every function hitting `/api/config/domestic/...`). Remove the `DomesticRoutesResponse` re-export at the bottom.

### 5. Dashboard / pages
- `src/components/dashboard/QuickActionsPanel.tsx` — remove the "Create Domestic" button, the `createDomesticOpen` state, and the second `<CreateShipmentDialog defaultDomestic />` instance.
- `src/pages/PriceCalculator.tsx` — remove `isDomestic: false` from the default payload and the conditional UI rendering `t('shipments.detail.domestic')`.

### 6. Translations
- `src/utilities/localization/en/common.json` and `src/utilities/localization/ar/common.json`
  - Remove every `domestic`, `domesticDetails`, `domesticNote`, `isDomestic`, `createDomestic`, `domesticCities`, `domesticRoutes` key.
  - Remove the `settings.domesticCities` and `settings.domesticRoutes` blocks entirely.

### 7. Memory housekeeping
After removal, delete or update these now-stale memory files:
- `mem://features/domestic-routes-pricing`
- `mem://features/domestic-shipment-creation-pricing`
- `mem://features/domestic-shipments`
- Update `mem://constraints/shipment-origin-mandatory` to reflect that origin country is always required (no domestic exception).

## Acceptance criteria

- `rg -i "domestic|isDomestic"` over `src/` returns zero matches.
- App type-checks (`tsc`) and builds with no errors.
- Shipments list, detail, create, edit, bulk update, print labels, invoices, dashboard, price calculator, and settings page all render without runtime errors.
- Settings page no longer shows a "Domestic Shipping Routes" section.
- Dashboard quick actions only shows the international "Create Shipment" action.
- Create/Edit shipment dialogs no longer show the domestic toggle or domestic details form.
- Shipment detail page no longer shows the "Domestic" row or the domestic details block.

## Out of scope

- Building the new domestic service (that comes after this cleanup).
- Backend changes — this is frontend-only removal. Stale `/api/config/domestic` endpoints on the backend can stay; the frontend simply stops calling them.
