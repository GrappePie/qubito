# Qubito Copilot Instructions

## Project Overview
- Qubito POS is a Next.js 14 (App Router) + React 19 dashboard for restaurant POS flows; Redux + RTK Query power client state and API access.
- `src/app/layout.tsx` wraps every route with `Providers` (Redux store) and `react-hot-toast` `Toaster`; keep that wrapper when adding layouts.
- Domain documentation lives in `Docs/` (vision, functional spec, tech arch); review before changing critical flows.

## Data & Persistence
- MongoDB access goes through `src/lib/mongodb.ts`, which memoizes the connection; always call `connectToDatabase()` at the top of new route handlers.
- Models: `Item` (POS catalog), `Category`, `Notification`, `AdjustmentHistory`, and a lighter `Product` schema for inventory basics; import via the `@/models/*` alias from `tsconfig.json`.
- `Item` documents carry pricing, stock, variants, categories; inventory APIs sometimes still expect `quantity` while UI expects `stock`, so double-check which field downstream components use before writing updates.
- Environment variables required for local runs: `MONGODB_URI`, `ENTITLEMENTS_JWT_SECRET`, `ENTITLEMENTS_BASE_URL` (see `.env.local` template in README).

## API Layer Patterns
- REST endpoints live under `src/app/api/**`; each handler is an App Router module exporting HTTP verbs (`GET/POST/PUT/DELETE`).
- Dynamic routes (e.g., `api/products/[id]`) type `params` as a `Promise` due to the Next 14 handler signature; follow that pattern when adding routes.
- Responses consistently use `NextResponse.json`; propagate user-facing error messages in Spanish to match existing UI copy.
- `api/products` normalizes category arrays via `normalizeCats`; pass either `categories: string[]` or a single `category` string when calling it.
- Category creation (`api/categories`) slugifies names and reuses existing docs on duplicates; treat name as the primary key for idempotent writes.
- `inventory/upload` expects a `multipart/form-data` file (`csv` or `json`) and bulk-inserts products; reuse this endpoint for mass imports instead of bespoke scripts.

## Client State & UI Conventions
- Redux Toolkit store (`src/store/store.ts`) combines the `cartSlice` with RTK Query slices (`productsApi`, `inventoryApi`, `notificationsApi`, `categoriesApi`); add new APIs as slices to keep caching consistent.
- Use the typed hooks from `src/store/hooks.ts` inside client components; pages under `src/app/**/page.tsx` are marked `"use client"` when they rely on Redux or browser APIs.
- Cart logic (`cartSlice.ts`) keeps separate carts per table vs quick orders; when integrating checkout, honor `selectActiveTableId` and `selectCartItems` selectors.
- Category filters in `SaleContainer` rely on positional indices against `useGetCategoriesQuery()` results—preserve array order when transforming data.
- `MultiCategorySelect` handles deduplication and on-the-fly category creation (triggering `createCategory`); wire new forms through its callbacks instead of reimplementing tag inputs.
- UI feedback standard is `toast.*` from `react-hot-toast`; ensure API mutations unwrap promises and surface toasts for success/error states.

## Developer Workflow
- Install dependencies with `npm install`; run locally via `npm run dev` (Next + Turbopack). Use `npm run build`/`npm run start` for production parity and `npm run lint` for ESLint with Next defaults.
- TypeScript is strict (`strict: true`) and uses the `@/*` alias—update both imports and `tsconfig` paths if relocating directories.
- Styling mixes Tailwind utility classes (see `src/app/globals.css`) with lightweight custom components in `src/components/**`.
- Fixtures for manual testing live in `Docs/Mock/POS-Qubito.html`; open it to understand expected POS interactions when building new UI pieces.
- Before shipping data changes, manually exercise inventory adjustments (`/inventory` modal triggers `inventory/adjust`) and low-stock notifications (`/api/notifications/check-stock`) since automated tests are not yet present.
