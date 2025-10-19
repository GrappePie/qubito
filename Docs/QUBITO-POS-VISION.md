# Qubito POS Vision

## Resumen ejecutivo
- Qubito POS es una plataforma de punto de venta enfocada en restaurantes y cafeterias con mesas, venta rapida y canal de mostrador.
- El producto integra control de inventario, catalogo de productos, programa de lealtad ligero y reportes de rendimiento en tiempo real.
- El flujo principal parte de un tablero central que ofrece acceso inmediato a mesas, ventas rapidas y tareas administrativas.
- El sistema se entrega como aplicacion web hospedada en `qubito.pixelgrimoire.com` y autenticada a traves de entitlements emitidos por `pixelgrimoire.com`.

## Problema a resolver
- Negocios de alimentos con mesas requieren agilidad para abrir cuentas, dividir cuentas y cerrar ventas con multiples metodos de pago.
- La administracion del stock resulta propensa a errores cuando se maneja en hojas de calculo o sistemas separados.
- Las operaciones dependen de reportes diarios y semanales para tomar decisiones sobre compras y personal.
- La facturacion en Mexico requiere recopilar datos fiscales rapidamente durante el proceso de pago.

## Objetivos de producto
- Reducir el tiempo promedio para abrir y cobrar una mesa por debajo de 2 minutos, incluso en horarios pico.
- Ofrecer visibilidad clara del inventario critico para anticipar reposiciones y activar alertas.
- Facilitar la curva de aprendizaje de un cajero nuevo a menos de 1 hora mediante interfaz consistente y flujos guiados.
- Garantizar la disponibilidad de datos operativos (ventas, tickets, compras) en menos de 60 segundos despues de cada transaccion.

## Alcance de la version inicial (MVP+)
- Gestion de mesas con estados disponible/ocupada y totales por cuenta.
- Venta rapida para pedidos sin mesa o takeaway.
- Carrito de orden con calculo de impuestos, propinas, division de cuenta y multiples metodos de pago.
- Catalogo de productos con CRUD y subida de imagen via URL.
- Inventario con niveles minimos, alertas y ajustes manuales.
- Registro de clientes, proveedores y compras para asegurar trazabilidad de la cadena de suministro.
- Dashboard con metricas clave y reportes sobre ventas, ticket promedio y productos destacados.
- Configuracion fiscal y de tienda para soportar facturacion CFDI basica.
- Integracion con el landing para entitlements y control de acceso sin replicar sesiones de Clerk.

## Principios de experiencia
1. **Velocidad ante todo**: acciones primarias (agregar producto, abrir mesa, generar pago) deben requerir maximo dos clics desde la vista activa.
2. **Contexto persistente**: el usuario siempre debe ver el estado del pedido y totales actualizados mientras cambia entre vistas relacionadas.
3. **Prevencion de errores**: los limites de stock y validaciones evitan ventas que exceden inventario disponible.
4. **Transparencia operativa**: dashboards y reportes siempre muestran la fuente de datos, fechas y totales para auditar facilmente.

## Indicadores clave (KPIs)
- Tiempo promedio para finalizar una venta desde que se abre el modal de pago.
- Porcentaje de ventas con propina registrada.
- Numero de alertas de stock procesadas vs generadas.
- Diferencia promedio entre corte esperado y corte real de caja.
- Adopcion de clientes recurrentes (ventas asociadas a programa de lealtad).

## Restricciones y supuestos
- El backend se ejecuta sobre Next.js 14 (App Router) con base de datos MongoDB gestionada via Mongoose.
- El sistema opera en navegadores modernos; no se garantiza compatibilidad con Internet Explorer.
- Las imagenes de productos se referencian mediante URLs publicas; no se contempla almacenamiento interno en la primera version.
- Se asume un regimen fiscal mexicano con IVA del 16% aplicable a la mayoria de los productos; las excepciones se documentan en fases posteriores.
- Los entitlements son la unica fuente de verdad para permitir acceso; si expiran, el usuario debe volver al landing.

## Publico objetivo
- Dueños y gerentes de cafeterias, restaurantes casuales y dark kitchens con entre 1 y 3 sucursales.
- Cajeros y meseros que necesitan una interfaz rapida y tactil para operar pedidos.
- Responsables de compras y almacen que requieren ajustes de inventario y reportes.

## Factores de diferenciacion
- Flujo de mesas optimizado para servicio en sitio y sincronizado con venta rapida.
- Integracion nativa con pipeline de entitlements multinegocio desde Pixel Grimoire.
- Configuracion fiscal integrada a la experiencia de cobro para emitir CFDI sin abandonar el POS.
- Paneles listos para auditorias internas con detalle de tickets, compras y ajustes de stock.

## Riesgos conocidos
- Dependencia de conectividad constante; se necesita estrategia de cache u offline para evolucion futura.
- Complejidad de dividir cuentas y propinas puede aumentar errores si no se valida correctamente.
- La gestion de imagenes via URL requiere validaciones para evitar contenido roto o inseguro.
- El modelo de inventario debe armonizar multiples fuentes (ventas, compras, ajustes) para evitar descuadres.

## Vision futura
- Extender soporte a multiples sucursales con sincronizacion consolidada de reportes.
- Liberar app movil (tablet) con modo offline y sincronizacion diferida.
- Integrar terminales de pago y lectores de codigo de barras en tiempo real.
- Ofrecer flujos avanzados de facturacion con certificados CSD y timbrado oficial.
- Conectar con programas de fidelidad y CRMs externos mediante webhooks.
