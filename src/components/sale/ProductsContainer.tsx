import Product from "@/components/sale/Product";


const ProductsContainer = () => {
    return (
        <div className={"w-full max-h-full min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"}>
            {Array.from({ length: 100 }, (x,index) => <Product  key={index}/>)}
        </div>
    );
};

export default ProductsContainer;