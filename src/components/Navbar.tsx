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


export default function Navbar() {
    return (
        <aside className="w-64 bg-slate-800 text-white h-screen p-4">
            <div className="text-xl font-semibold mb-6 flex items-center border-b border-slate-700 pb-2 h-11">
                <Box className="h-8 w-8 text-sky-400" />
                <span className="ml-3 text-2xl font-bold">Qubito POS</span>
            </div>
            <div className="max-h-1/3 pt-1 overflow-y-auto">
                <Link href="/tables" className="nav-link bg-slate-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <Ratio size={25} className={"basis-1/6"}/>
                    <span>Mesas</span>
                </Link>
                <Link href="/sale" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <Wallet size={25} className={"basis-1/6"}/>
                    <span>Venta Rápida</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <Landmark size={25} className={"basis-1/6"}/>
                    <span>Corte de Caja</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <History size={25} className={"basis-1/6"}/>
                    <span>Historial de ventas</span>
                </Link>
            </div>
            <hr className="border-slate-700 my-2"/>
            <div className="h-1/3 overflow-y-auto">
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <LayoutDashboard size={25} className={"basis-1/6"}/>
                    <span>Dashboard</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <BarChart  size={25} className={"basis-1/6"}/>
                    <span>Reportes</span>
                </Link>
                <Link href="/products" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <PackageIcon size={25} className={"basis-1/6"}/>
                    <span>Productos</span>
                </Link>
                <Link href="/inventory" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <Archive size={25} className={"basis-1/6"}/>
                    <span>Inventario</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <Users  size={25} className={"basis-1/6"}/>
                    <span>Clientes</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <Truck  size={25} className={"basis-1/6"}/>
                    <span>Proveedores</span>
                </Link>
                <Link href="/pos" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <Store size={25} className={"basis-1/6"}/>
                    <span>Punto de Venta</span>
                </Link>
                <Link href="/notifications" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <Bell  size={25} className={"basis-1/6"}/>
                    <span>Notifications</span>
                </Link>
                <Link href="/test" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <span>Test</span>
                </Link>
            </div>
            <hr className="border-slate-700 my-2"/>
            <div>
                <div className={"text-center py-2"}>
                    <h6 className={"mb-0"}>Admin</h6>
                    <Link href={"#"} className={"text-sky-400 text-[12px]"}>Admin</Link>
                </div>
                <Link href="#" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <Settings size={25} className={"basis-1/6"}/>
                    <span>Configuración</span>
                </Link>
                <Link href="#" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <LogOut size={25} className={"basis-1/6"}/>
                    <span>Cerrar Sesión</span>
                </Link>
            </div>
        </aside>
    );
}
