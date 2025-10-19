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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren, MouseEvent } from 'react';
import { useAppDispatch } from '../store/hooks';
import { startQuickOrder } from '../store/slices/cartSlice';

// Reusable component for a nav link that handles active state styling
function NavItem({ href, icon: Icon, children, onClick }: PropsWithChildren<{ href: string; icon?: any; onClick?: (e: MouseEvent) => void }>) {
    const pathname = usePathname();
    const isActive = href !== '#' && (pathname === href || (href !== '/' && pathname.startsWith(href)));

    const baseClasses = 'px-4 py-3 rounded-lg flex items-center gap-2 transition-colors';
    const activeClasses = 'bg-slate-700 text-sky-400 font-semibold';
    const inactiveClasses = 'text-slate-200 hover:bg-slate-700 hover:text-white';

    return (
        <Link
            href={href}
            onClick={(e) => { if (onClick) onClick(e); }}
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

    return (
        <aside className="w-64 bg-slate-800 text-white h-screen p-4 flex flex-col">
            <div className="text-xl font-semibold mb-6 flex items-center border-b border-slate-700 pb-2 h-11 shrink-0">
                <Box className="h-8 w-8 text-sky-400" />
                <span className="ml-3 text-2xl font-bold">Qubito POS</span>
            </div>
            <div className="max-h-1/3 pt-1 overflow-y-auto space-y-1">
                <NavItem href="/tables" icon={Ratio}>Mesas</NavItem>
                <NavItem href="/sale" icon={Wallet} onClick={() => dispatch(startQuickOrder())}>Venta Rápida</NavItem>
                <NavItem href="#" icon={Landmark}>Corte de Caja</NavItem>
                <NavItem href="#" icon={History}>Historial de ventas</NavItem>
            </div>
            <hr className="border-slate-700 my-2" />
            <div className="h-1/3 overflow-y-auto space-y-1">
                <NavItem href="#" icon={LayoutDashboard}>Dashboard</NavItem>
                <NavItem href="#" icon={BarChart}>Reportes</NavItem>
                <NavItem href="/products" icon={PackageIcon}>Productos</NavItem>
                <NavItem href="/inventory" icon={Archive}>Inventario</NavItem>
                <NavItem href="#" icon={Users}>Clientes</NavItem>
                <NavItem href="#" icon={Truck}>Proveedores</NavItem>
                <NavItem href="/pos" icon={Store}>Punto de Venta</NavItem>
                <NavItem href="/notifications" icon={Bell}>Notifications</NavItem>
                <NavItem href="/test">Test</NavItem>
            </div>
            <hr className="border-slate-700 my-2" />
            <div className="mt-auto space-y-1">
                <div className="text-center py-2">
                    <h6 className="mb-0">Admin</h6>
                    <Link href="#" className="text-sky-400 text-[12px]">Admin</Link>
                </div>
                <NavItem href="#" icon={Settings}>Configuración</NavItem>
                <NavItem href="#" icon={LogOut}>Cerrar Sesión</NavItem>
            </div>
        </aside>
    );
}
