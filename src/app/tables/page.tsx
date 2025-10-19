import TitlePage from "@/components/common/TitlePage";
import TablesComponent from "@/components/tables/TablesComponent";

const tables = Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
}));

const Tables = () => {
    return (
        <div>
            <TitlePage title="Gestión de Mesas" subtitle={"Selecciona una mesa para iniciar o continuar una orden."}/>
            <TablesComponent tables={tables} />
        </div>
    );
};

export default Tables;