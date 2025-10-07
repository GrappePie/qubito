import TopSearchBar from "@/components/sale/TopSearchBar";
import { IoMdArrowBack } from "react-icons/io";
import ProductsContainer from "@/components/sale/ProductsContainer";


const SaleContainer = () => {
    return (
        <div className={"w-full h-full min-h-0"}>
            {/* Search bar container */}
            <div className={"w-full h-16 flex p-2"}>
                {/* Search bar */}
                <TopSearchBar/>
                <div className={"w-1/2 flex justify-end"} >
                    <button
                        className="bg-slate-200 text-slate-800 font-semibold px-4 h-10 rounded-lg hover:bg-slate-300 transition-colors flex items-center">
                        <IoMdArrowBack />
                        Volver a Mesas
                    </button>
                </div>
            </div>
            {/* Products container */}
            <div className={"w-full h-[calc(100%-4rem)] p-2 overflow-y-auto"}>
                <ProductsContainer/>
            </div>
        </div>
    );
};

export default SaleContainer;