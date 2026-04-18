

## Implementation Plan

A focused set of UX/feature changes across settings, dashboard, shipments, and users.

### 1. Air International Pricing Tiers (Admin Settings)
- **`src/utilities/api/config.api.ts`** — Add `getAirInternationalRates()` (GET) and `updateAirInternationalRates(body)` (PATCH) plus types `AirInternationalRateBracket`, `AirInternationalRates`.
- **NEW `src/screens/settings/AirInternationalRatesCard.tsx`** — Glass card with country tabs (Turkey / China / UAE). Each tab shows an editable bracket list with columns **Min kg**, **Max kg** (last row shows "∞"), **USD/kg**, plus row delete + "Add bracket" + Reset/Save buttons. Client-side validation: first bracket `minKg=0`, contiguous brackets (`next.minKg === prev.maxKg`), only last may omit `maxKg`, `ratePerKgUsd > 0`. Inline error banner if invalid.
- **`src/screens/settings/SystemSettings.tsx`** — Mount the new card between `ExchangeRateCard` and `DomesticRoutesCard`.
- **`src/pages/PriceCalculator.tsx`** — Remove any 3 kg air floor (none in form, but clarify hint text and trust backend tiers).

### 2. Shipment Status Filter — Restrict to 4 statuses
- **`src/screens/shipments/ShipmentsFilters.tsx`** — Replace `allStatuses` array with only: `received at warehouse`, `shipped to destination`, `ready for pick up`, `delivered`. Applies to both visible dropdown and advanced sheet.

### 3. Show Extra Costs in Shipment Tables
- **`src/screens/shipments/ShipmentsTable.tsx`** — Add `extraCosts` column (already toggleable via `ColumnVisibilityToggle`, just missing from the table render). Show formatted USD when `shippingMethod` is `air` or `sea`.

### 4. Dashboard — Air Card shows weight per status (excl. delivered)
- **`src/components/dashboard/AirShipmentsCard.tsx`** — Hero number stays `totalKG`. Replace status count breakdown with **kg per status** (use `kgBreakdown` if backend exposes it; otherwise fall back to `statusBreakdown` counts as a temporary value and add a TODO). Drop the **delivered** row. Show: Pending, In transit, Received at warehouse, Shipped to destination, Ready for pickup.
- *(Note: backend prompt only confirmed `cbmBreakdown` for sea. For air I'll request `kgBreakdown` via the same shape; until then I'll display weight in subtitle/hero only and keep the per-status as counts excluding delivered.)*

### 5. Wallet Donut Chart
- **`src/components/dashboard/WalletBalanceCard.tsx`** — Replace the linear progress bar with a Recharts `<PieChart>` donut (innerRadius/outerRadius). Two slices: Positive (success), Negative (destructive). Center label shows total wallet count. Legend below shows positive/negative **count** + the **summed amount** (`totalPositiveBalance` / `|totalNegativeBalance|`).

### 6. Show Date of Birth in Users Table
- **`src/screens/users/UsersTable.tsx`** — Add optional column `birthdate` (formatted `MMM dd, yyyy`).
- **`src/screens/users/ColumnVisibilityToggle.tsx`** — Add `birthdate` toggle.
- **`src/screens/users/Users.tsx`** — Include `birthdate` in default visible columns.

### 7. Fix Shipments Pagination "only 1 page"
- **`src/screens/shipments/ShipmentsPagination.tsx`** — Bug: `disabled={!hasNextPage || currentPage === totalPages}` blocks navigation when backend sends `hasNextPage=false` even though more pages exist. Switch to: only disable next when `currentPage >= totalPages`, only disable prev when `currentPage <= 1`. Drop reliance on `hasNextPage/hasPrevPage` flags (still accept them but use page-number math as source of truth). Also guard `totalPages < 1` → render no number buttons.

### 8. Shipment Search for "TRI-I928"
- **`src/utilities/api/shipments.api.ts`** — Audit how `search` param is sent. The `-` in `TRI-I928` may need URL-encoding (already done by `URLSearchParams`) but backend may only match `esn`/`csn` and not `isn`. Send the trimmed search as-is and additionally pass `isn` if the value matches the ISN pattern (`/^[A-Z]+-[A-Z0-9]+$/i`) so backend filters by all three fields.
- **`src/screens/shipments/ShipmentsFilters.tsx`** — Already trims and debounces; verify uppercase normalization isn't dropping the input. Add a fallback: if backend returns 0 results for a search containing `-`, retry once with `isn=<value>`.

### Files touched
**Edit:** `config.api.ts`, `SystemSettings.tsx`, `PriceCalculator.tsx`, `ShipmentsFilters.tsx`, `ShipmentsTable.tsx`, `AirShipmentsCard.tsx`, `WalletBalanceCard.tsx`, `UsersTable.tsx`, `ColumnVisibilityToggle.tsx` (users), `Users.tsx`, `ShipmentsPagination.tsx`, `shipments.api.ts`, `Shipments.tsx`
**Create:** `AirInternationalRatesCard.tsx`

