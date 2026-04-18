
The user is logged in and wants me to run the end-to-end browser test. This is a testing task, not a code change — I should switch to default mode to use browser automation tools.

Plan:

## End-to-End Test Run

I'll use browser automation to verify the recently shipped features against the live preview:

1. **Settings → Air International Pricing**
   - Navigate to `/settings`
   - Open the Turkey tab in the new Air International Rates card
   - Edit one bracket's `ratePerKgUsd`, save, confirm success toast
   - Reload and confirm the value persisted

2. **Price Calculator (no 3kg floor)**
   - Navigate to `/price-calculator`
   - Submit an air quote with weight `1.5` kg to Turkey
   - Confirm the API responds and price reflects tier rate (not forced to 3kg)

3. **Shipment Search for `TRI-I928`**
   - Navigate to `/shipments`
   - Type `TRI-I928` into search
   - Inspect the network request to confirm `isn=TRI-I928` is added
   - Confirm the matching shipment appears

4. **Wallet Donut Chart**
   - Navigate to `/dashboard`
   - Screenshot the Wallet Balance card
   - Confirm donut renders with positive/negative slices and totals

5. **Shipments Pagination**
   - On `/shipments`, click Next/Prev page buttons
   - Confirm page changes and buttons enable/disable correctly based on `currentPage` vs `totalPages`

I'll report findings per area with screenshots and any bugs found. If a bug is discovered, I'll stop and surface it before continuing.
