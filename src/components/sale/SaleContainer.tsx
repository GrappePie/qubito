import TopSearchBar from "@/components/sale/TopSearchBar";
import { IoMdArrowBack } from "react-icons/io";
import ProductsContainer from "@/components/sale/ProductsContainer";


const SaleContainer = () => {
    return (
        <div className={"w-full h-full min-h-0 flex flex-col"}>
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
            {/*Categories container*/}
            <div className={"w-full relative h-12 px-2 py-1"}>
                <div className={"w-full min-w-0 h-full flex flex-nowrap px-4 overflow-x-auto overflow-y-hidden gap-2"}>
                    {/* Categories */}
                    {Array.from({ length: 20 }, (x, index) => (
                        <div
                            key={index}
                            className={"flex items-center gap-2 h-8 max-w-32 flex-shrink-0 p-1 rounded-[32px] border border-[color:var(--gm3-sys-color-outline-variant,#c4c7c5)]"}
                        >
                                                        <span
                                className="text-base tracking-[0]  mr-1 overflow-hidden text-ellipsis whitespace-nowrap">Categoría {index + 1}</span>

                        </div>
                    ))}
                </div>
            </div>
            {/* Products container */}
            <div className={"flex-1 m-2 overflow-y-auto"}>
                <ProductsContainer/>
            </div>
        </div>
    );
};

export default SaleContainer;