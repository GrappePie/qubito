# Qubito POS Functional Spec

Este documento detalla las capacidades funcionales esperadas para el producto final, alineadas con el mock `Docs/Mock/POS-Qubito.html` y la arquitectura actual del repositorio.

## Roles de usuario

### Admin
- Acceso total a catalogos, inventario, reporteria, configuraciones y cortes de caja.
- Permisos para crear, editar y eliminar productos, clientes, proveedores y compras.
- Puede ajustar inventario y definir parametros fiscales o de tienda.
- Puede abrir y cerrar caja, ademas de generar cortes y revisar historiales completos.

### Cajero
- Acceso a mesas, venta rapida, cobros, historial de ventas y dashboard de operacion diaria.
- Puede agregar productos a ordenes existentes y finalizar ventas con los metodos permitidos.
- Puede registrar clientes en ticket pero no modificar catalogos ni niveles de stock.
- Puede abrir y cerrar caja solo si se le delega el turno; no puede editar configuracion global.

## Modulos funcionales

### 1. Autenticacion y entitlements
- El POS verifica entitlements al cargar y refresca tokens cada vez que expiran (ver `QUBITO-ENTITLEMENTS.md`).
- Si el token vence o la validacion devuelve 401, se redirige al landing con parametro `redirect`.
- Mantener nombre y rol del usuario vigente en la barra lateral (`Admin`, `Cajero`).

### 2. Dashboard operacional
- Muestra tarjetas con ventas del dia, numero de transacciones, ticket promedio y nuevos clientes.
- Grafica semanal interactiva (Chart.js) que muestra ventas por dia; debe recalcularse al cambiar filtros.
- Lista de productos mas vendidos con top 4 y cantidad.
- El dashboard se actualiza en tiempo real (polling o WebSockets) o cuando se registran nuevas ventas.

### 3. Gestion de mesas (`view=tables`)
- Grilla responsive con tarjetas para cada mesa (minimo 12 por defecto, extensible via configuracion).
- Estado `Disponible` o `Ocupada`; cuando hay orden asociada se muestra total con IVA incluido.
- Al seleccionar mesa se abre la vista de venta con titulo dinamico y carrito cargado desde la orden almacenada.
- Persistencia: cada mesa guarda lista de items con cantidades, notas y totales en la base de datos.

### 4. Venta rapida y pantalla de venta (`view=sales`)
- Buscador de productos por nombre o SKU con filtrado instantaneo.
- Grid de productos con imagen, nombre y precio; al hacer clic se agrega al carrito.
- Boton para volver a mesas cuando la venta pertenece a una mesa.
- Carrito lateral con controles para sumar/restar cantidades, ingresar cantidad manual y remover items.
- Calculo automatico de subtotal, impuestos (16%) y total.
- Botones para guardar orden (se mantiene pendiente) o proceder al pago.
- Validacion de stock: no permitir agregar cantidades superiores al stock disponible; mostrar modal de alerta.

### 5. Modal de pago y facturacion
- Registro de montos por metodo (efectivo, tarjeta) y calculo de propinas rapidas (10/15/20%).
- Campo manual para propina; se suma al total.
- Calculo de total pagado, restante y cambio; bloquea boton "Finalizar venta" hasta cubrir total.
- Seccion de programa de lealtad: asociar cliente existente, ver puntos y removerlo si es necesario.
- Boton para dividir cuenta: abre modal con numero de personas y calcula montos equivalentes.
- Al finalizar venta se genera ticket con `subtotal`, `impuestos`, `propina`, `total`, `items`, `usuario`, `mesa`.

### 6. Corte de caja (`view=cash-register`)
- Cuando la caja esta cerrada pide monto de apertura; registra usuario y hora de apertura.
- Con caja abierta muestra resumen con monto inicial, ventas en efectivo acumuladas y efectivo esperado.
- Formulario para cerrar caja que solicita conteo real; calcula diferencia y la muestra en modal de alerta.
- Todos los movimientos deben almacenarse en `cashRegister` con historial de transacciones y responsable.

### 7. Historial de ventas (`view=sales-history`)
- Tabla con folio, fecha, mesa, total y cajero.
- Boton "Ver detalle" que abre modal con lista de productos, cantidades, precios y totales.
- Posibilidad de filtrar por rango de fechas y por usuario (futuro enhancement anotado).
- Debe soportar paginacion o lazy loading para historiales extensos.

### 8. Reportes (`view=reports`)
- Filtros de rango rapido (hoy, ayer, semana, mes) y selector de fechas personalizado.
- Grafica principal de ventas con dataset dinamico en funcion del filtro.
- KPIs: ventas netas, ganancia bruta, transacciones, ticket promedio.
- Tabla secundaria con ventas por producto (cantidad y total vendido).
- La ganancia bruta se calcula como total vendido menos costo total basado en productos.

### 9. Catalogo de productos (`view=products`)
- Tabla con imagen, nombre, categoria, SKU, precio, costo, stock.
- Acciones de editar y borrar habilitadas solo para admin.
- Modal CRUD con campos: nombre, categoria, SKU, precio, costo, stock, nivel bajo, URL de imagen.
- Validaciones: valores numericos positivos, SKU unico, categoria existente o default `General`.
- Al guardar se actualiza lista y se sincroniza con inventario.

### 10. Inventario (`view=inventory`)
- Tabla con producto, SKU, stock actual, nivel bajo, estado (En stock, Stock bajo, Sin stock).
- Boton "Ajustar" abre modal para editar cantidad y registrar razon.
- Cada ajuste produce entrada en `AdjustmentHistory` con fecha, usuario y motivo.
- Debe mostrar alertas cuando stock <= nivel minimo; integrarse con triggers de notificaciones.

### 11. Clientes (`view=customers`)
- Tabla con nombre, email, puntos, RFC, acciones.
- Modal CRUD para capturar datos de contacto y fiscales opcionales.
- Campos minimos: nombre, email; puntos se inicializan en cero.
- Asociacion con programa de lealtad: cada venta puede asignar puntos (1 por cada 10 unidades monetarias del subtotal).

### 12. Proveedores (`view=suppliers`)
- Tabla con nombre, contacto, telefono, correo.
- Modal CRUD con validaciones basicas.
- Registrar proveedor permite asociarlo a compras y buscarlo rapidamente.

### 13. Compras (`view=purchases`)
- Tabla con folio, fecha, proveedor, total y accion de ver detalle.
- Modal "Registrar compra" para seleccionar proveedor, fecha y lista de productos con cantidad y costo unitario.
- Cada item de la compra debe actualizar stock (sumar existencias) al guardar la transaccion.
- Reportar total de compra y almacenar items detallados para consultas futuras.

### 14. Configuracion (`view=settings`)
- Formulario con datos de perfil de tienda (nombre, direccion) y datos fiscales (RFC, razon social, regimen).
- Boton "Guardar cambios" disponible solo para admin.
- Debe persistir en coleccion `settings` (por definir) y servir como fuente para facturacion y recibos.

### 15. Notificaciones y alertas
- Configuracion para habilitar canales (email, sms, whatsapp) segun tipo de trigger (low_stock, out_of_stock, new_product).
- Cuando stock cae por debajo de nivel minimo se genera notificacion y se marca en vista de inventario.
- Debe existir endpoint para consultar y actualizar preferencias (`app/api/notifications`).

## Reglas transversales
- Todas las tablas deben soportar estado vacio con mensajes amigables.
- Los modales siguen transiciones uniformes y pueden cerrarse con `Esc`.
- Los formularios validan campos requeridos y muestran errores inline.
- Cada accion destructiva pide confirmacion mediante modal especifico.
- El sistema registra timestamps (`createdAt`, `updatedAt`) para auditoria.

## Integraciones externas
- Clerk para autenticacion en landing; POS consume tokens sin almacenar secretos.
- Stripe mediante landing para sincronizar entitlements (ver documento de entitlements).
- Futuro: integracion con pasarelas de pago fisicas, timbrado CFDI y sistemas contables.

## Criterios de aceptacion generales
- Flujos deben ser navegables via teclado y amigables en pantallas de 1280x800 o superiores.
- El layout lateral y contenido central deben renderizar en menos de 2 segundos en conexiones medias.
- Las operaciones CRUD devuelven mensajes claros de exito o error al usuario.
- A nivel de API, cada endpoint responde con JSON y codigos HTTP apropiados (200, 201, 400, 401, 403, 404, 500).
