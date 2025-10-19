# Qubito POS UX Flows

Los siguientes flujos describen la experiencia esperada de extremo a extremo. Cada paso hace referencia a componentes visibles en el mock `POS-Qubito.html` y a las vistas implementadas en la app (App Router).

## Login y seleccion de rol
1. Usuario aterriza en pantalla de login (`#login-screen`).
2. Selecciona perfil en combo `#user-select` y escribe clave numica por defecto `1234`.
3. Al presionar "Iniciar sesion" se valida entitlement activo.
4. Se oculta login, se muestra contenedor principal `#app` y se carga vista `tables`.
5. La barra lateral muestra nombre y rol en `#user-info`; botones administradores se ocultan si rol es `cashier`.

## Apertura de caja
1. Usuario navega a "Corte de Caja" desde sidebar.
2. Si la caja esta cerrada, aparece tarjeta "Caja Cerrada" con formulario `#opening-amount`.
3. El usuario ingresa monto inicial y confirma "Abrir Caja".
4. El estado global cambia a `open`; se registra `openedBy`, `openingAmount` y timestamp.
5. Se redirige al usuario a vista `tables` para comenzar operaciones.

## Gestion de mesas y toma de orden
1. Vista `tables` muestra grid dinamico con tarjetas por mesa, coloreadas segun estado.
2. Al tocar una mesa disponible, se abre `view=sales` con el carrito vacio y titulo "Mesa X".
3. Busqueda opcional por nombre o SKU; el mock incluye input en barra superior.
4. Usuario agrega productos tocando tarjetas; cada item aparece en la lista con controles +/-.
5. El resumen de totales (subtotal, impuestos, total) se actualiza en tiempo real.
6. Si el usuario debe pausar la orden, presiona "Guardar Orden"; el estado de mesa cambia a `occupied` y se vuelve a `tables`.

## Venta rapida (sin mesa)
1. Desde sidebar el usuario selecciona "Venta Rapida".
2. La vista es identica a `view=sales` pero `orderTitle` muestra "Orden" y no hay boton de regreso a mesas.
3. Los productos se agregan al carrito y se procede directo a cobro.

## Cobro y facturacion
1. Con items en carrito, el boton "Proceder al Pago" se habilita.
2. Al hacer clic, se abre modal `#payment-modal` con dos columnas (metodos de pago y resumen).
3. El usuario ingresa montos en `#payment-cash` y/o `#payment-card`. Puede aplicar propina rapida o monto manual.
4. Seccion de lealtad permite asignar cliente existente mediante select y muestra puntos acumulados.
5. "Dividir Cuenta" abre modal `#split-bill-modal`; al definir numero de personas se recalcula monto por individuo.
6. El bloque de resumen muestra subtotal, propina, total, pagado, restante y cambio.
7. Cuando restante <= 0, el boton "Finalizar Venta" se habilita. Al confirmarlo, se generan registros de ticket y se actualiza inventario.
8. Se muestra modal de alerta con confirmacion y se regresa al flujo de mesas o venta rapida.

## Registro de clientes durante el cobro
1. En modal de pago, si el cliente no existe, el usuario abre seccion "Clientes" desde barra lateral (abre en nueva pestaña o en otra terminal).
2. En `view=customers`, presiona "Agregar Cliente" para abrir modal `#customer-modal`.
3. Captura nombre, email y opcionalmente RFC, razon social y direccion.
4. Tras guardar, puede volver al modal de pago y seleccionar cliente recien creado en lista de lealtad.

## Ajuste de inventario
1. Admin navega a `view=inventory`.
2. Identifica producto con estado "Stock bajo" o "Sin stock".
3. Presiona boton "Ajustar" para abrir `#inventory-modal`.
4. Introduce nueva cantidad y, opcionalmente, razon (ej. recepcion, perdida, ajuste).
5. Al guardar, el sistema actualiza stock, crea registro en `AdjustmentHistory` y refresca tabla.

## Registro de compra a proveedor
1. Admin ingresa a `view=purchases` y presiona "Registrar Compra".
2. Modal `#purchase-modal` solicita proveedor, fecha y productos adquiridos.
3. Cada renglon permite elegir producto, cantidad y costo unitario; se puede agregar multiples productos.
4. El total se recalcula dinamicamente en `#purchase-total`.
5. Al guardar, se almacena compra con folio `C-{timestamp}` y se incrementa el stock de cada producto.
6. La compra aparece en tabla; el admin puede ver detalles mediante modal de lectura.

## Reportes operativos
1. Usuario abre `view=reports` desde sidebar.
2. Selecciona rango en `#date-range-selector` o define fechas manualmente.
3. El grafico `#reports-sales-chart` se actualiza con datos filtrados.
4. Se muestran KPIs y tabla de ventas por producto; el usuario puede exportar datos en iteraciones futuras (notar backlog).

## Cierre de caja
1. Al final del turno, usuario regresa a `view=cash-register`.
2. Formulario solicita conteo real `#closing-amount`.
3. El sistema calcula diferencia entre efectivo esperado y conteo real.
4. Se muestra modal de alerta con diferencia; se marca `closedBy` y `closedAt`.
5. Caja regresa a estado `closed` y queda lista para siguiente turno.

## Administracion general
- Los modales de producto, cliente, proveedor y compra comparten patrones: titulo dinamico, botones de guardar/cancelar y validaciones inline.
- La barra lateral resalta la vista activa con clase `bg-slate-700`.
- El usuario puede cerrar sesion desde enlace inferior en sidebar; al hacerlo se destruye contexto y se muestra login.
