# Pickup Cost Toggle — Verification Evidence

Target file: `public/dashboard.html` (Next.js app, static dashboard served from `public/`).

## What changed

- Added a module-level toggle state `let includePickup = true;` (default ON, preserves current behavior).
- Replaced the one-way `__pickupFolded` fold in `renderDashboard()` with an idempotent
  `applyPickupMode(rows)` that:
  - captures an immutable baseline once per row — `r.__rawTotalCost = Number(r['Total Cost'])||0`
    and `r.__pickupCost = Number(r['Pickup Cost'])||0` (only if not already captured);
  - sets `r['Total Cost'] = r.__rawTotalCost + (includePickup ? r.__pickupCost : 0)` on every call.
  - The raw `Pickup Cost` field is never mutated, so `groupByPickup()` (City/Customer Pickup Cost tabs) is unaffected.
- Added `onPickupToggleChange(checked)` which flips `includePickup`, re-applies `applyPickupMode(rawRows)`,
  and calls the existing `applyFilters()` pipeline to re-render KPIs + the current tab against the
  already-loaded dataset (no re-fetch / re-upload). Active tab (`currentTab`) and filter selections are preserved.
- Added a labeled switch control in the dashboard `file-bar` ("Include Pickup Cost" with Included/Excluded
  state text), styled with existing dark-theme CSS variables, plus `updatePickupToggleLabel()` to keep the UI in sync.

Both data paths (Excel upload and RDS fetch) go through `renderDashboard()`, so capture/apply runs for both.

## Verification method

A temporary Node harness (`_pickup_verify.mjs`, since removed) replicated the exact formulas from
`dashboard.html` — `applyPickupMode`, `renderKPIs` cost/price/profit, `groupBy`, `groupByPickup`, and the
per-shipment In Profit / In Loss split — and ran a 4-row sample containing nonzero pickup values and both
profit and loss shipments.

Sample rows (raw DB values):

| Row | LM | Pickup City | raw Total Cost | Pickup Cost | Price (no GST) |
|-----|----|-------------|----------------|-------------|----------------|
| A   | X  | Delhi       | 100            | 20          | 200            |
| B   | X  | Delhi       | 90             | 20          | 100            |
| C   | Y  | Mumbai      | 300            | 50          | 150            |
| D   | Y  | Mumbai      | 40             | 0           | 100            |

## Concrete results

ON (include pickup) — current/default behavior:
- Total Cost KPI = **620**, Total Price = 550, Net Profit = **-70**, Margin = -12.73%
- LM group-by: X {cost:230, profit:70}, Y {cost:390, profit:-140}
- Shipment split: In Profit = 2 (A, D), In Loss = 2 (B, C)

OFF (exclude pickup) — earlier behavior:
- Total Cost KPI = **530**, Total Price = 550, Net Profit = **20**, Margin = 3.64%
- LM group-by: X {cost:190, profit:110}, Y {cost:340, profit:-90}
- Shipment split: In Profit = 3 (A, B, D), In Loss = 1 (C)

ON again (toggle back ON->OFF->ON):
- Identical to the first ON snapshot (Total Cost 620, Net Profit -70, same group-by and split) —
  confirms idempotency, no drift or double-counting.

Pickup Cost tabs (independent of toggle):
- City Pickup Cost sums raw Pickup Cost in BOTH modes: Delhi = 40, Mumbai = 50 (unchanged ON vs OFF).

All assertions passed (ON cost 620 / profit -70; OFF cost 530 / profit 20; ON==ON after round-trip;
pickup sums identical across modes; splits 2/2 ON vs 3/1 OFF).

## Build

Ran `next build` (Next.js 15.5.25):
- "Compiled successfully in 2.9s"
- Static pages generated 5/5, routes include `/` and `/api/costing`.
- No errors.

## Cleanup

Temporary files `_pickup_verify.mjs`, `_build_log.txt`, `_build_exit.txt` were removed after verification.
