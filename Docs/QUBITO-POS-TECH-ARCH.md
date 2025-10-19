# Qubito POS Tech Architecture

## Stack principal
- Frontend y backend sobre Next.js 14 con App Router (`src/app`).
- MongoDB como base de datos principal gestionada via Mongoose (`src/lib/mongodb.ts`).
- State management local con Redux Toolkit (`src/store`).
- Componentes de UI con Tailwind CSS, Heroicons y componentes propios ubicados en `src/components`.
- Chart.js y Day.js para visualizaciones y manejo de fechas (ver mock HTML).

## Estructura de carpetas relevante
- `src/app` contiene vistas principales: mesas, venta, inventario, etc.
- `src/app/api` define endpoints REST para productos, inventario, categorias y notificaciones.
- `src/components` agrupa UI reutilizable (navbar, dialogs, tabs, sale components, etc.).
- `src/models` centraliza esquemas Mongoose para Items, Categories, Tickets, Notifications y ajustes.
- `Docs/Mock` incluye referencia de interfaz a replicar.

## Modelos de datos

### Item (`src/models/Item.ts`)
- Campos clave: `barCode`, `categories`, `cost`, `price`, `stock`, `variants`, `supplier`.
- Bandera `isAvailableForSale` controla visibilidad en POS.
- `lowStock` define umbral para alertas.

### Category (`src/models/Category.ts`)
- `categoryId`, `name`, `description`, `imageUrl`, `parentCategoryId` y bandera `isActive`.
- Relacion con productos via referencias a `Item`.

### Product (legacy auxiliar)
- Esquema simple con `name`, `quantity`, `minThreshold`, `unit`.
- Usado en historico o componentes heredados; en producto final se alinea con `Item`.

### Notification (`src/models/Notification.ts`)
- Propiedades `trigger` (`low_stock`, `out_of_stock`, `new_product`) y `type` (`email`, `sms`, `whatsapp`).
- Campo `address` para destino.

### Ticket (`src/models/Ticket.ts`)
- Guarda ventas con `products`, `customerId`, `createdBy` y timestamps.
- Cada `ITicketProduct` almacena `productId`, `name`, `quantity`, `unitPrice`, `total`.

### AdjustmentHistory (`src/models/AdjustmentHistory.ts`)
- Registra ajustes de inventario con `productId`, `previousStock`, `newStock`, `reason`, `date`.

## API endpoints actuales

### Productos (`src/app/api/products/route.ts`)
- `GET /api/products`: lista todos los productos.
- `POST /api/products`: crea producto normalizando categorias (`normalizeCats`).
- CRUD extendido pendiente (PUT/DELETE) para fase siguiente.

### Inventario (`src/app/api/inventory`)
- Endpoints para agregar (`add`), ajustar (`adjust`), historial (`history`), listar (`list`), reabastecer (`restock`), vender (`sell`), subir (`upload`).
- Cada ruta aplica logica especifica (validaciones, integraciones externas). Documentar en profundidad al completar implementacion.

### Categorias (`src/app/api/categories`)
- `GET /api/categories`: devuelve categorias activas.
- `POST /api/categories`: crea nueva categoria.
- Rutas dinamicas `/api/categories/[id]` para updates especficos.

### Notificaciones (`src/app/api/notifications`)
- Gestiona preferencias de alertas y verificacion de stock (`check-stock`).

## Integracion de entitlements
- Qubito consume JWT emitido desde landing `pixelgrimoire.com`.
- Secret compartido `ENTITLEMENTS_JWT_SECRET` y endpoints `/api/entitlements/token`, `/api/entitlements/verify` documentados en `QUBITO-ENTITLEMENTS.md`.
- El servidor debe exponer helper `verifyEntitlementsToken` y proteger rutas sensibles.

## Estado global y slices (`src/store`)
- `store.ts` configura Redux Toolkit.
- `slices/cartSlice.ts` maneja carrito de venta y division de cuenta.
- `slices/categoriesApi.ts`, `inventoryApi.ts`, `notificationsApi.ts`, `productsApi.ts` usan RTK Query para fetch.
- `hooks.ts` expone `useAppDispatch` y `useAppSelector` tipados.

## Seguridad y configuracion
- Variables de entorno: `MONGODB_URI`, `ENTITLEMENTS_JWT_SECRET`, `ENTITLEMENTS_BASE_URL`, etc.
- Politica CORS: restringir origenes a landing y subdominio.
- Validar entrada en endpoints para evitar datos incompletos o injection.
- Logger centralizado para errores de integracion y monitoreo de inventario.

## Consideraciones de despliegue
- Hospedaje recomendado en Vercel o infraestructura compatible con Next.js serverless.
- MongoDB Atlas como servicio gestionado.
- Stripe webhooks y Clerk se mantienen en landing; POS requiere conectividad a APIs internas.
- Configurar build pipeline para ejecutar `npm run lint` y pruebas unitarias antes de deploy.

## Testing y calidad
- Tests unitarios enfocados en slices de Redux y helpers de inventario.
- Tests e2e (Playwright o Cypress) para flujos: login, abrir mesa, checkout, cierre de caja.
- Validaciones de accesibilidad (ARIA, contraste) en componentes principales.
- Verificacion de performance: LCP < 2.5 s en dashboard, interaccion en venta < 150 ms.
