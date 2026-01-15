import TitlePage from "@/components/common/TitlePage";
import TablesComponent from "@/components/tables/TablesComponent";
import PermissionGate from "@/components/PermissionGate";

const tables = Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
}));

function TablesContent() {
    return (
        <div>
            <TitlePage title="Gestion de Mesas" subtitle="Selecciona una mesa para iniciar o continuar una orden."/>
            <TablesComponent tables={tables} />
        </div>
    );
}

export default function TablesPage() {
    return (
        <PermissionGate permission="tables.manage" redirectTo="/">
            <TablesContent />
        </PermissionGate>
    );
}
