export default function Navbar() {
    return (
        <aside className="w-64 bg-blue-900 text-white min-h-screen p-4">
            <h2 className="text-xl font-semibold mb-6">
                <img src="/Qubito-icon.svg" alt="Qubito Icon" className="inline-block w-6 h-6 mr-2" />
                Qubito
            </h2>
            <nav className="space-y-2">
                <a href="/inventory" className="block py-2 px-4 rounded hover:bg-blue-800">
                    Inventory
                </a>
                <a href="/notifications" className="block py-2 px-4 rounded hover:bg-blue-800">
                    Notifications
                </a>
            </nav>
        </aside>
    );
}
