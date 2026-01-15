# Project TODOs

- `src/components/Navbar.tsx`: add "Detalle de ventas" (ticket search/reprints) when needed.
- `src/app/api/notifications/check-stock/route.ts`: send email/push notifications and expand to other triggers (out_of_stock, new_product).
- `src/app/api/inventory/upload/route.ts`: send email/push notifications for new products and low stock after bulk import.
- `src/app/api/cash-register/close/route.ts`: send email/push notifications to tenant when cash discrepancy is detected.
- `src/app/api/inventory/adjust/route.ts`: send email/push notifications when adjustments cause low/out-of-stock thresholds.
- `src/app/api/inventory/add/route.ts`: send email/push notifications for new product creation.
- `src/app/api/inventory/sell/route.ts`: send email/push notifications when items hit low/out-of-stock after a sale.
