"use client";

import {
  History,
  Store,
  Landmark,
  LayoutDashboard,
  Archive,
  Box,
  LogOut,
  Wallet,
  BarChart,
  Users,
  Package as PackageIcon,
  Truck,
  Bell,
  Settings,
  Ratio,
  Tags,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren, MouseEvent, ComponentType } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { startQuickOrder } from '@/store/slices/cartSlice';
import { useAccounts } from '@/contexts/AccountsContext';
import { toast } from 'react-hot-toast';

type NavEntry = {
  href: string;
  label: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  perm?: string;
  onClick?: () => void;
};

// Reusable component for a nav link that handles active state styling
function NavItem({
  href,
  icon: Icon,
  children,
  onClick,
}: PropsWithChildren<{
  href: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  onClick?: (e: MouseEvent) => void;
}>) {
  const pathname = usePathname();
  const isActive =
    href !== '#' && (pathname === href || (href !== '/' && pathname.startsWith(href)));

  const baseClasses = 'px-4 py-3 rounded-lg flex items-center gap-2 transition-colors';
  const activeClasses = 'bg-slate-700 text-sky-400 font-semibold';
  const inactiveClasses = 'text-slate-200 hover:bg-slate-700 hover:text-white';

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && <Icon size={25} className="basis-1/6" />}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { hasPermission, loading } = useAccounts();
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('qubito_tenant');
      window.localStorage.removeItem('qubito_sub');
      window.location.href = '/login';
    } else {
      toast.success('Sesión cerrada');
    }
  };

  const navTop: NavEntry[] = [
    { href: '/tables', label: 'Mesas', icon: Ratio, perm: 'tables.manage' },
    { href: '/sale', label: 'Venta Rapida', icon: Wallet, perm: 'pos.use', onClick: () => dispatch(startQuickOrder()) },
    { href: '#', label: 'Corte de Caja', icon: Landmark, perm: 'cash.close' },
    { href: '#', label: 'Historial de ventas', icon: History, perm: 'sales.history' },
  ];
  const navMid: NavEntry[] = [
    { href: '#', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
    { href: '#', label: 'Reportes', icon: BarChart, perm: 'reports.view' },
    { href: '/products', label: 'Productos', icon: PackageIcon, perm: 'products.manage' },
    { href: '/categories', label: 'Categorias', icon: Tags, perm: 'categories.manage' },
    { href: '/inventory', label: 'Inventario', icon: Archive, perm: 'inventory.manage' },
    { href: '#', label: 'Clientes', icon: Users, perm: 'customers.manage' },
    { href: '#', label: 'Proveedores', icon: Truck, perm: 'suppliers.manage' },
    { href: '/pos', label: 'Punto de Venta', icon: Store, perm: 'pos.use' },
    { href: '/notifications', label: 'Notifications', icon: Bell, perm: 'notifications.view' },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-white h-screen p-4 flex flex-col">
      <div className="text-xl font-semibold mb-6 flex items-center border-b border-slate-700 pb-2 h-11 shrink-0">
        <Box className="h-8 w-8 text-sky-400" />
        <span className="ml-3 text-2xl font-bold">Qubito POS</span>
      </div>
      <div className="max-h-1/3 pt-1 overflow-y-auto space-y-1">
        {!loading &&
          navTop
            .filter((item) => !item.perm || hasPermission(item.perm))
            .map((item) => (
              <NavItem
                key={item.href + item.label}
                href={item.href}
                icon={item.icon}
                onClick={item.onClick}
              >
                {item.label}
              </NavItem>
            ))}
      </div>
      <hr className="border-slate-700 my-2" />
      <div className="h-1/3 overflow-y-auto space-y-1">
        {!loading &&
          navMid
            .filter((item) => !item.perm || hasPermission(item.perm))
            .map((item) => (
              <NavItem
                key={item.href + item.label}
                href={item.href}
                icon={item.icon}
                onClick={item.onClick}
              >
                {item.label}
              </NavItem>
            ))}
      </div>
      <hr className="border-slate-700 my-2" />
      <div className="mt-auto space-y-1">
        {!loading && hasPermission('settings.manage') && (
          <NavItem href="/settings" icon={Settings}>
            Settings
          </NavItem>
        )}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-lg flex items-center gap-2 transition-colors text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          <LogOut size={25} className="basis-1/6" />
          <span className="truncate">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
