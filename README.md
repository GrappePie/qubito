# Qubito POS

Qubito POS es una plataforma de punto de venta pensada para cafeterias y restaurantes con atencion en mesas, venta rapida, control de inventario y reporteria operativa. El sistema corre sobre Next.js 14 (App Router) con MongoDB y se autentica mediante entitlements emitidos desde el landing principal de Pixel Grimoire.

## Caracteristicas clave
- Gestion de mesas con estado y sincronizacion de ordenes activas.
- Venta rapida con carrito, impuestos dinamicos, propinas y division de cuenta.
- Catalogo de productos, inventario con umbrales, compras a proveedores y ajustes historicos.
- Programa de lealtad basico vinculado a clientes y tickets.
- Dashboard y reportes con graficas, KPIs y productos destacados.
- Configuracion fiscal y de tienda para soportar corte de caja y facturacion.

## Stack
- Next.js 14 (TypeScript, App Router).
- MongoDB via Mongoose.
- Redux Toolkit + RTK Query.
- Tailwind CSS y componentes custom.
- Chart.js y Day.js para visualizaciones y fechas.

## Requisitos previos
- Node.js 18+.
- Cuenta de MongoDB (Atlas o instancia local).
- Variables de entorno configuradas (`.env.local`).
- Acceso a landing `pixelgrimoire.com` para emitir tokens de entitlement.

## Configuracion rapida
1. Instalar dependencias:
	```bash
	npm install
	```
2. Crear archivo `.env.local` con al menos:
	```bash
	MONGODB_URI="mongodb+srv://<usuario>:<password>@cluster"
	ENTITLEMENTS_JWT_SECRET="<secreto-compartido>"
	ENTITLEMENTS_BASE_URL="https://pixelgrimoire.com"
	# Emisor esperado del JWT de entitlements (opcional; por defecto
	# "pixelgrimoire-entitlements"). Acepta lista separada por comas.
	ENTITLEMENTS_ISSUER="pixelgrimoire-entitlements"
	```
3. Ejecutar servidor de desarrollo:
	```bash
	npm run dev
	```
4. Abrir `http://localhost:3000` y validar flujos principales (login, mesas, venta, inventario).

## Scripts disponibles
- `npm run dev`: corre el servidor Next.js en modo desarrollo.
- `npm run build`: genera build optimizada para despliegue.
- `npm run start`: inicia servidor en modo produccion con build existente.
- `npm run lint`: ejecuta revisiones ESLint.

## Estructura destacada
- `src/app`: vistas y rutas API (App Router).
- `src/components`: componentes reutilizables (navbar, dialogs, POS UI).
- `src/models`: esquemas Mongo/Mongoose para productos, tickets, inventario, etc.
- `src/store`: configuracion Redux Toolkit y slices para cart, categorias, inventario y productos.
- `Docs`: documentacion funcional y tecnica, incluyendo mock de interfaz.

## Documentacion
- `Docs/QUBITO-POS-VISION.md`: objetivo estrategico, pilares y KPIs.
- `Docs/QUBITO-POS-FUNCTIONAL-SPEC.md`: requerimientos funcionales por modulo.
- `Docs/QUBITO-POS-UX-FLOWS.md`: flujos de experiencia de usuario paso a paso.
- `Docs/QUBITO-POS-TECH-ARCH.md`: stack tecnico, modelos y endpoints.
- `Docs/QUBITO-ENTITLEMENTS.md`: contrato de integracion con landing para accesos.

## Buenas practicas de desarrollo
- Mantener cobertura de pruebas (unitarias y e2e) para flujos criticos: venta, inventario, corte de caja.
- Validar formatos de datos antes de persistir en MongoDB para evitar registros inconsistentes.
- Asegurar que las rutas API respeten codigos HTTP y mensajes claros.
- Revisar accesibilidad de componentes (etiquetas, contraste) en cada iteracion.

## Roadmap inmediato
- Completar endpoints faltantes (PUT/DELETE) para productos y categorias.
- Implementar sincronizacion de alertas de stock con servicio de notificaciones.
- Agregar soporte multi sucursal y vistas de consolidado.
- Integrar flujo de facturacion CFDI y soporte a timbrado.
