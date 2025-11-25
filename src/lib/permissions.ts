export type PermissionDef = {
  code: string;
  label: string;
  description: string;
  area: string;
};

export const PERMISSION_CATALOG: PermissionDef[] = [
  {
    code: "pos.use",
    label: "Punto de venta",
    description: "Cobrar, abrir tickets y usar la venta r\u00e1pida.",
    area: "Operacion",
  },
  {
    code: "tables.manage",
    label: "Mesas y cuentas",
    description: "Crear y mover cuentas entre mesas.",
    area: "Operacion",
  },
  {
    code: "cash.close",
    label: "Corte de caja",
    description: "Realizar y ver cortes de caja.",
    area: "Operacion",
  },
  {
    code: "sales.history",
    label: "Historial de ventas",
    description: "Consultar ventas anteriores y tickets.",
    area: "Operacion",
  },
  {
    code: "products.manage",
    label: "Productos",
    description: "Crear y editar productos del cat\u00e1logo.",
    area: "Catalogos",
  },
  {
    code: "categories.manage",
    label: "Categorias",
    description: "Gestionar categorias y familias.",
    area: "Catalogos",
  },
  {
    code: "inventory.manage",
    label: "Inventario",
    description: "Ajustes de stock, minimos y alertas.",
    area: "Inventario",
  },
  {
    code: "notifications.view",
    label: "Notificaciones",
    description: "Ver alertas y avisos del sistema.",
    area: "Backoffice",
  },
  {
    code: "dashboard.view",
    label: "Dashboard",
    description: "Panel general y KPIs.",
    area: "Backoffice",
  },
  {
    code: "reports.view",
    label: "Reportes",
    description: "Reportes y exportes de datos.",
    area: "Backoffice",
  },
  {
    code: "customers.manage",
    label: "Clientes",
    description: "Alta y seguimiento de clientes.",
    area: "Backoffice",
  },
  {
    code: "suppliers.manage",
    label: "Proveedores",
    description: "Gestion de proveedores y compras.",
    area: "Backoffice",
  },
  {
    code: "settings.manage",
    label: "Configuracion y usuarios",
    description: "Gestionar roles, accesos y cuentas.",
    area: "Administracion",
  },
];

export type PermissionCode = (typeof PERMISSION_CATALOG)[number]["code"];

const CATALOG_BY_CODE: Record<string, PermissionDef> = PERMISSION_CATALOG.reduce(
  (acc, def) => {
    acc[def.code] = def;
    return acc;
  },
  {} as Record<string, PermissionDef>
);

export const DEFAULT_ADMIN_PERMISSIONS: PermissionCode[] = PERMISSION_CATALOG.map(
  (p) => p.code
);

export function normalizePermissions(value: unknown): PermissionCode[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<PermissionCode>();
  const out: PermissionCode[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const candidate = raw.trim();
    if (!candidate || !(candidate in CATALOG_BY_CODE)) continue;
    if (seen.has(candidate as PermissionCode)) continue;
    seen.add(candidate as PermissionCode);
    out.push(candidate as PermissionCode);
  }
  return out;
}
