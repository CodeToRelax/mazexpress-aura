

## Fix Plan: 3 Issues

### Issue 1: Status filter shows no options
**Root cause:** The `ShipmentsFilters` component checks `isSuperAdmin` and `accessibleStatuses` from ACL. The backend's `/api/acl/user` response doesn't include `accessibleStatuses` or `isSuperAdmin` fields, so they default to `[]` and `false`. The filter code then runs `allStatuses.filter(status => accessibleStatuses.includes(status))` which returns an empty array.

**Fix:** In `ShipmentsFilters.tsx`, when `accessibleStatuses` is empty (not provided by backend), default to showing all statuses instead of none. This is a safe fallback — the backend still enforces permissions on the data it returns.

### Issue 2: Shipment export only has CSV, no PDF
**Root cause:** `ExportShipmentsDialog` only has a single "Export CSV" button calling `exportShipmentsToCSV`.

**Fix:** 
- Add `exportShipmentsToPDF` function in `shipmentExport.ts` using jsPDF + autoTable (same pattern as existing `invoicePDF.ts`)
- Update `ExportShipmentsDialog` to show two export buttons: "Export CSV" and "Export PDF"

### Issue 3: Wallet balance sorting doesn't work
**Root cause:** Two problems:
1. `balanceSortOrder` state is separate from `filters.sortBy`, so the sort icon on the balance column header never highlights (it checks `sortBy === 'balance'` but `sortBy` stays as `'createdAt'`)
2. Sorting only applies to the current page slice, not to all wallets before pagination — so results are wrong across pages

**Fix:** In `Wallets.tsx`:
- Store balance sort in `filters` state as `sortBy: 'balance'` instead of a separate state
- Apply balance sorting to `filteredWallets` array **before** pagination slicing in `fetchWallets`
- Remove the separate `balanceSortOrder` state

### Files to modify
1. `src/screens/shipments/ShipmentsFilters.tsx` — fallback to all statuses when `accessibleStatuses` is empty
2. `src/utilities/helpers/shipmentExport.ts` — add `exportShipmentsToPDF` function
3. `src/screens/shipments/ExportShipmentsDialog.tsx` — add PDF export button
4. `src/screens/wallets/Wallets.tsx` — fix balance sorting to work across pages and reflect in sort icon

