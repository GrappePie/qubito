import Link from "next/link";
import {MdHistory, MdPointOfSale} from "react-icons/md";
import {GrMoney} from "react-icons/gr";
import {RxDashboard} from "react-icons/rx";
import {TbArchive, TbCube, TbLogout} from "react-icons/tb";
import {LiaMoneyBillSolid} from "react-icons/lia";
import {BsBarChart, BsPeople} from "react-icons/bs";
import {FaBarsStaggered} from "react-icons/fa6";
import {PiTruckTrailer} from "react-icons/pi";
import {IoMdNotificationsOutline} from "react-icons/io";
import {IoSettingsOutline} from "react-icons/io5";
import { LuRatio } from "react-icons/lu";


export default function Navbar() {
    return (
        <aside className="w-64 bg-slate-800 text-white h-screen p-4">
            <div className="text-xl font-semibold mb-6 flex items-center border-b border-slate-700 pb-2 h-11">
                <TbCube className="h-8 w-8 text-sky-400" />
                <span className="ml-3 text-2xl font-bold">Qubito POS</span>
            </div>
            <div className="max-h-1/3 pt-1 overflow-y-auto">
                <Link href="/tables" className="nav-link bg-slate-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <LuRatio size={25} className={"basis-1/6"}/>
                    <span>Mesas</span>
                </Link>
                <Link href="/sale" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <LiaMoneyBillSolid size={25} className={"basis-1/6"}/>
                    <span>Venta Rápida</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <GrMoney size={25} className={"basis-1/6"}/>
                    <span>Corte de Caja</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <MdHistory size={25} className={"basis-1/6"}/>
                    <span>Historial de ventas</span>
                </Link>
            </div>
            <hr className="border-slate-700 my-2"/>
            <div className="h-1/3 overflow-y-auto">
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <RxDashboard size={25} className={"basis-1/6"}/>
                    <span>Dashboard</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <BsBarChart  size={25} className={"basis-1/6"}/>
                    <span>Reportes</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <FaBarsStaggered size={25} className={"basis-1/6"}/>
                    <span>Productos</span>
                </Link>
                <Link href="/inventory" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <TbArchive size={25} className={"basis-1/6"}/>
                    <span>Inventario</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <BsPeople  size={25} className={"basis-1/6"}/>
                    <span>Clientes</span>
                </Link>
                <Link href="#" className="px-4 py-3 rounded-lg flex items-center gap-2">
                    <PiTruckTrailer  size={25} className={"basis-1/6"}/>
                    <span>Proveedores</span>
                </Link>
                <Link href="/pos" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <MdPointOfSale size={25} className={"basis-1/6"}/>
                    <span>Punto de Venta</span>
                </Link>
                <Link href="/notifications" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <IoMdNotificationsOutline  size={25} className={"basis-1/6"}/>
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
                    <IoSettingsOutline size={25} className={"basis-1/6"}/>
                    <span>Configuración</span>
                </Link>
                <Link href="#" className="nav-link px-4 py-3 rounded-lg flex items-center gap-2">
                    <TbLogout size={25} className={"basis-1/6"}/>
                    <span>Cerrar Sesión</span>
                </Link>
            </div>
        </aside>
    );
}
