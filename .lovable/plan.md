

## Why `TRI-I928` doesn't show up in shipment search

### Root cause analysis

The frontend already has logic to handle ISN searches (lines 84-125 of `shipments.api.ts`):
1. First tries `?searchParam=TRI-I928` — the backend's general search endpoint.
2. If that returns 0 results AND the value matches the ISN pattern (`/^[A-Z]+-[A-Z0-9]+$/i`), it retries with `?isn=TRI-I928`.

`TRI-I928` matches the regex, so the retry IS firing. The problem is one of two backend behaviors:

**Hypothesis A (most likely):** The backend's `searchParam` searches `esn`/`csn` but NOT `isn`, AND the `isn` filter requires an **exact match**. If the stored ISN is something like `tri-i928` (lowercase) or `TRI-I0928`, the exact-match `isn=TRI-I928` query returns 0.

**Hypothesis B:** The backend's `isn` validator rejects the format and 4xx's, which our retry silently swallows.

I cannot confirm from the frontend alone — I need to see the actual network request/response for the failed search.

### Plan

**Step 1 — Diagnose (in default mode):**
- Use browser tools to navigate to `/shipments`, type `TRI-I928` in the search box, and capture the actual network requests/responses for both `searchParam=TRI-I928` and the `isn=TRI-I928` retry.
- This tells us whether the backend returns 0 (data issue / case-sensitivity) or 4xx (validator issue).

**Step 2 — Fix based on findings:**

| Scenario | Fix |
|----------|-----|
| Backend `isn` filter is case-sensitive and stored value differs in case | Retry with both upper and lowercase variants of the ISN |
| Backend `isn` requires exact match but user typed a partial/typo | Add a "did you mean?" hint when ISN-shaped search returns nothing |
| Backend rejects the ISN format (4xx) | Surface the error instead of swallowing it; coordinate with backend to relax the validator |
| Shipment with `TRI-I928` simply doesn't exist in the DB | Show clearer empty state — nothing to fix in code |

**Step 3 — Improve robustness regardless:**
- Add a third fallback that tries `?esn=TRI-I928` (some backends store the prefix-format value as the ESN, not the ISN).
- Log the retry attempts to console so future debugging is easier.

### Files likely to change
- `src/utilities/api/shipments.api.ts` — extend the fallback chain (searchParam → isn → esn, with case variants).

### What I need from you
Just approve and I'll run the live diagnostic against the deployed backend to confirm which scenario applies before changing code.

