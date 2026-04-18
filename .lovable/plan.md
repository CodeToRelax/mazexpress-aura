

## Plan: Integrate updated MazExpress API contracts

I'll align the frontend with the new/changed API contracts documented by the backend team. Scoping by section:

### 1. Legal/Policies editor (NEW)
- Add API client `src/utilities/api/policies.api.ts` with `getPolicies()` and `updatePolicies(partial)` — only sends `policies | prohibitedItems | extra`.
- Add admin screen `src/screens/settings/PoliciesCard.tsx` mounted in `SystemSettings.tsx`: 3 textareas + Markdown preview toggle. Gated by `config.manage` via `ACLGuard`.
- Add a public/customer-facing route `src/pages/Policies.tsx` (read-only, Markdown rendered). Register in `App.tsx`.
- Use `react-markdown` (already lightweight) for rendering; if not installed, add it.

### 2. Price calculator — breaking change
- Update `src/pages/PriceCalculator.tsx` and any consumer of `shipmentsApi.calculatePrice` to read `data.price`, `data.currency`, `data.finalWeight`, `data.dimensionalWeight`, `data.shippingMethod`, `data.country`, `data.isDomestic` from the object (not as a raw number).
- Display `dimensionalWeight` and `finalWeight` when present.
- Audit `CreateShipmentDialog.tsx` / `EditShipmentDialog.tsx` for any place treating `data` as a number.

### 3. Shipment `pricingBreakdown` display
- Extend `IShipment` in `src/types/shipment.ts` with optional `pricingBreakdown: { cbmM3, airVolumetricWeightKg?, chargeableQuantity, chargeableUnit }`.
- Pass through in `shipmentNormalizer.ts`.
- Render a small "Chargeable" block in `ShipmentDetail.tsx` (e.g. "12.5 kg (volumetric)" or "0.8 cbm").
- Lowercase ESN handling for public track is already backend-side; verify `TrackShipment.tsx` works as-is.

### 4. Air international rates — already wired
- Confirm `getAirInternationalRates` / `updateAirInternationalRates` in `config.api.ts` match the documented shape. No code change expected; just verify against the new contract once backend is live.

### 5. Item cost calculator (NEW)
- Add to `config.api.ts`: `getItemCalculatorRates()`, `updateItemCalculatorRates(partial)`, `convertItemAmount({amount, currency})`.
- Add `src/screens/settings/ItemCalculatorCard.tsx` in System Settings: editable currency→LYD rate map + a small "Convert" widget. Gated by `config.manage`.

### 6. Analytics enhancements
- Update `analytics.api.ts` types to include:
  - Air: `totalShipmentsExcludingDelivered`, `totalKGExcludingDelivered`.
  - Wallet: `balanceDonut.segments[]` with `key: 'positive'|'negative'|'zero'`, `walletCount`, `percentOfWallets`, `sumBalance`, `distribution`.
- Update `AirShipmentsCard.tsx` to optionally display "active pipeline" (excluding delivered).
- Update `WalletBalanceCard.tsx` donut to consume `balanceDonut.segments` (with a backwards-compatible fallback to current shape).

### 7. Users — DOB alias
- In `src/types/user.ts` add `dateOfBirth?: string` as alias of `birthdate`.
- In `EditUserDialog.tsx` / `CreateUserDialog.tsx` / `UserDetail.tsx`: display `dateOfBirth` (fallback to `birthdate`); on PATCH continue sending `birthdate` (matches existing schema in `user.schemas.ts`).

### 8. Validation guardrails
- Policies PATCH: strictly send only the 3 allowed keys (no stray fields → 422).
- Calculate price: TypeScript change forces `.price` access — eliminates the legacy "data as number" path.

### Files to create
- `src/utilities/api/policies.api.ts`
- `src/screens/settings/PoliciesCard.tsx`
- `src/screens/settings/ItemCalculatorCard.tsx`
- `src/pages/Policies.tsx`

### Files to modify
- `src/utilities/api/config.api.ts` (item calculator endpoints)
- `src/utilities/api/analytics.api.ts` (new fields)
- `src/utilities/api/shipments.api.ts` (none expected; types only)
- `src/types/shipment.ts`, `src/types/user.ts`, `src/types/analytics.ts`
- `src/utilities/helpers/shipmentNormalizer.ts`
- `src/pages/PriceCalculator.tsx`
- `src/screens/shipments/ShipmentDetail.tsx`
- `src/screens/settings/SystemSettings.tsx` (mount new cards)
- `src/components/dashboard/AirShipmentsCard.tsx`, `WalletBalanceCard.tsx`
- `src/screens/users/EditUserDialog.tsx`, `CreateUserDialog.tsx`, `UserDetail.tsx`
- `src/App.tsx` (Policies route)
- Localization files: `en/common.json`, `ar/common.json` for policies/item-calculator labels (≤3 levels deep per project rule)

### Out of scope (already implemented / no change)
- System config GET/PUT, per-country shipping, domestic city-to-city pricing — already wired.
- Air international rates UI — already exists; will work once backend deploy lands.

### Open question
None blocking. I'll wire policies as Markdown-rendered (with `react-markdown`) since the spec explicitly mentions Markdown links.

