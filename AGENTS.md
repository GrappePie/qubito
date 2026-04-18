# Qubito AI Rules

## Objetivo

`qubito` es un POS independiente. Debe mantenerse simple de operar, con bajo acoplamiento a infraestructura externa y sin arrastrar complejidad innecesaria desde otros proyectos.

## Prioridades

- mantener el flujo de caja, inventario y tickets estable,
- evitar regresiones en UI operativa,
- proteger contratos de licencia y tenant,
- conservar una arquitectura sencilla y mantenible.

## Reglas

- No introducir servicios o dependencias nuevas sin una razón operativa clara.
- Mantener Redux Toolkit y el modelo actual como fuente clara de estado.
- Evitar mezclar reglas de negocio con componentes visuales.
- Tratar modelos de Mongo, inventario, tickets y caja como zonas críticas.
- Revisar impacto por tenant antes de cambiar seeds, modelos o rutas API.

## Diseño

- Preferir módulos pequeños y explícitos.
- Evitar abstraer demasiado pronto.
- Mantener separación clara entre acceso a datos, estado y UI.
- No copiar patrones de Nexora o landing-page si no encajan con Qubito.

## Validación mínima

Si un cambio toca flujo operativo, validar al menos:

- carga de la pantalla afectada,
- endpoint o acción afectada,
- consistencia básica del estado,
- ausencia de regresiones obvias en tenant o licencia.
