import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    return (
        <aside className="w-64 bg-blue-900 text-white min-h-screen p-4">
            <h2 className="text-xl font-semibold mb-6">
                <Image src="/Qubito-icon.svg" width={24} height={24} alt="Qubito Icon" className="inline-block mr-2" />
                Qubito
            </h2>
            <nav className="space-y-2">
                <Link href="/inventory" className="block py-2 px-4 rounded hover:bg-blue-800">
                    Inventory
                </Link>
                <Link href="/pos" className="block py-2 px-4 rounded hover:bg-blue-800">
                    Punto de Venta
                </Link>
                <Link href="/notifications" className="block py-2 px-4 rounded hover:bg-blue-800">
                    Notifications
                </Link>
                <Link href="/test" className="block py-2 px-4 rounded hover:bg-blue-800">
                    Test Pages
                </Link>
            </nav>
        </aside>
    );
}
