

## Bug List Coverage Analysis

Here's a breakdown of all 9 items from your PDF and their current status:

| # | Bug/Feature | Status | Frontend Done? | Backend Needed? |
|---|-------------|--------|----------------|-----------------|
| 1 | Status filter not working | Partially addressed | Filter sends `status` param correctly | **Yes** — Backend must support exact status matching (e.g., `received at warehouse`, `ready for pick up`). Verify the backend `/api/shipments` endpoint filters by the `status` query param correctly with space-containing values. |
| 2 | Export shipments (PDF/Excel) | **Not done** | No | **No** — Can be done client-side like invoice export. Needs a new export dialog + helpers. |
| 3 | Mandatory country of origin | **Done** ✓ | Zod schema refined, required indicator added | No |
| 4 | Wallet sorting by balance | **Not done** | No | **Possibly** — If sorting is server-side, backend needs `sort=balance` support. If client-side, frontend-only. |
| 5 | Invoice price in Libyan Dinar (sea) | **Not done** | No | **Possibly** — Depends on whether the currency comes from backend or is determined in frontend display logic. |
| 6 | Large invoice glitch (40+ items) | **Not done** | No | **Possibly** — If it's a PDF rendering issue (page overflow), frontend fix. If totals come wrong from API, backend fix. |
| 7 | Weight discrepancy in air invoices | **Not done** | No | **Yes** — Likely a backend calculation issue where weight and CBM are mixed in the total. |
| 8 | Dashboard CBM accuracy | **Not done** | No | **Yes** — The `/api/analytics/shipments/sea` endpoint returns CBM data. Backend must correctly calculate warehouse vs in-transit CBM. |
| 9 | Domestic shipments | **Deferred** | N/A | N/A — Workflow details pending. |

---

### Summary of What Was Already Covered (from previous work)

- **Bug #3** (Mandatory origin) — Fully implemented with Zod validation + UI indicator.
- **Bug #1** (Status filter) — Frontend sends the correct param. The shipping method tab case-insensitivity was also fixed.
- **Active summary boxes** (Total CBM/Weight/Shipments) — Done, with the `ShipmentsSummaryBar` component.
- **Empty dimension defaults** — Done.
- **Single-click select / double-click open** — Done.

### What Still Needs Frontend Work

| # | Feature | Effort |
|---|---------|--------|
| 2 | Shipment export (PDF/Excel/CSV) | Medium — Create export dialog + helpers similar to existing invoice/user export |
| 4 | Wallet balance column sorting | Small — Add sort handler to balance column header in `WalletsTable.tsx` |
| 5 | Sea invoice currency display | Small — Check currency logic in invoice components, force LYD for sea invoices |
| 6 | Large invoice PDF overflow | Medium — Fix PDF generation to handle pagination for 40+ line items |

### What Needs Backend Changes

1. **Bug #1 (Status filter)** — Confirm backend `/api/shipments` correctly handles `status=received at warehouse` (with spaces/URL encoding). If not, backend needs to support these exact status values as query filters.

2. **Bug #7 (Weight discrepancy)** — Backend invoice generation likely sums weight incorrectly when both weight-based and CBM-based items exist. The calculation logic on the backend needs review to ensure weight totals only include weight-based items and CBM totals only include CBM-based items.

3. **Bug #8 (Dashboard CBM)** — The `/api/analytics/shipments/sea` endpoint needs to break down CBM by location (at warehouse vs in transit vs delivered) rather than returning a single total.

4. **Bug #5 (Currency)** — If the invoice currency is set on creation (backend), the backend must ensure sea invoices are created with LYD currency. If it's display-only, frontend can handle it.

5. **Bug #4 (Wallet sorting)** — If wallet listing is paginated server-side, the backend `/api/wallets` endpoint needs to support `sort=balance` and `sort=-balance` query parameters.

Would you like me to proceed with implementing the remaining frontend items (#2, #4, #5, #6)?

