# Qubito Architecture Decision Prep

Qubito remains a MongoDB-backed SaaS-style POS for this phase. Do not migrate
to PostgreSQL or local-first storage until the operating model is decided.

## Current critical areas

- Mongo/Mongoose models: products, categories, orders, tickets, inventory,
  cash register sessions, accounts, roles, and notifications.
- Critical flows: sale checkout, cash close, inventory upload/adjust/sell,
  table orders, login/recovery, and entitlement verification.
- Tenant boundary: every operational route must preserve tenant scoping.

## Decision options

1. Keep SaaS + MongoDB.
   - Lowest migration cost.
   - Requires clear offline limitation for restaurants.

2. Move to PostgreSQL cloud.
   - Better relational integrity for tickets, cash, inventory, and reports.
   - Requires model/API migration and new backup strategy.

3. Move to local-first.
   - Best operational resilience for restaurants.
   - Requires a deeper product shift similar to Nexora: local DB, installer or
     local runtime, license refresh, and optional sync.

## Recommendation for now

Keep MongoDB while licensing contracts are stabilized. Revisit storage/runtime
after measuring the actual need for offline operation in target customers.
