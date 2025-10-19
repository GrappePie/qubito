import SideSummarySale from "@/components/sale/sideSummarySale";
import SaleContainer from "@/components/sale/SaleContainer";

const Page = () => {
    return (
        <div className="flex flex-row w-full h-full min-h-0">
            <div className="basis-2/3 p-0  overflow-hidden">
                <SaleContainer />
            </div>
            <div className="h-full basis-1/3 p-0">
                <SideSummarySale />
            </div>
        </div>
    );
};

export default Page;