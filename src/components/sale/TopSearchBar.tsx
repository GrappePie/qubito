'use client';

import {IoIosSearch} from "react-icons/io";

const TopSearchBar: React.FC = () => {

    return (
        <div className="w-1/2 flex flex-col">
           <div className="relative w-full">
               <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                   <IoIosSearch />
               </span>
               <input
                   type="text"
                   className="h-10 w-full px-10 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Search or scan barcode..."
                   autoFocus
                   name="search"
               />
               {/*<span className="absolute top-4 right-5 border-l border-l-gray-400 pl-4"><IoIosSearch /></span>*/}
           </div>
        </div>
    );
};

export default TopSearchBar;