# Show weight (kg) per status on Air Shipments card

## What you're seeing today
The "Air Shipments" dashboard card currently shows **counts** under each status (e.g. At Warehouse: 30, Ready for Pickup: 111). You want those numbers to be **weight in kg** instead.

## Why a frontend-only change isn't enough
The frontend (`AirShipmentsCard.tsx`) is **already wired** to display weight when the backend provides it. It does this:

```ts
const breakdown = data?.kgBreakdown ?? data?.statusBreakdown ?? {};
const isKg = !!data?.kgBreakdown;
// renders "X kg" when isKg, otherwise just the count
```

But the air analytics endpoint (`GET /api/analytics/shipments/air`) currently returns only `statusBreakdown` (counts). It does **not** return `kgBreakdown`. That's why we see counts.

The Sea card already has the equivalent: backend returns `cbmBreakdown` alongside `statusBreakdown`, and the Sea card uses it.

## Plan

### 1. Backend (required) — add `kgBreakdown` to air analytics
Mirror what `cbmBreakdown` does for sea. Update `GET /api/analytics/shipments/air` response to include:

```json
{
  "totalShipments": ...,
  "totalKG": ...,
  "totalKGExcludingDelivered": ...,
  "totalShipmentsExcludingDelivered": ...,
  "statusBreakdown": { "in transit": 0, "received at warehouse": 30, ... },
  "kgBreakdown":     { "in transit": 0.0, "received at warehouse": 412.5, ... },
  "chartData": [...]
}
```

`kgBreakdown` keys must match `statusBreakdown` keys (same statuses: `pending`, `in transit`, `delivered`, `received at warehouse`, `shipped to destination`, `ready for pick up`). Values are the **sum of `weight_kg`** of shipments in that status, within the requested date range.

### 2. Frontend — promote `kgBreakdown` to a typed field
Small cleanup in `src/types/analytics.ts`:

```ts
export interface AirShipmentsAnalytics {
  ...
  statusBreakdown: ShipmentStatusBreakdown;
  kgBreakdown?: ShipmentStatusBreakdown; // NEW
  chartData: ShipmentChartDataPoint[];
}
```

Then drop the `(data as any)` cast in `AirShipmentsCard.tsx`. No rendering changes needed — it already formats as `"X kg"` when `kgBreakdown` is present.

## Result
Once the backend ships `kgBreakdown`, the card will read e.g.:

```
In Transit              0 kg     At Warehouse        412.5 kg
shipped to destination  0 kg     Ready for Pickup    1,108.8 kg
```

## Question
You said earlier you don't want to hardcode logic in the BE. This one truly needs a BE change because the frontend doesn't have per-shipment weight data — only the aggregated counts the API returns. Want me to proceed with just the frontend type cleanup (so it's ready), and you'll add `kgBreakdown` on the BE? Or should I skip until the BE is updated?