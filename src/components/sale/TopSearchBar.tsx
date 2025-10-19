'use client';

import {IoIosSearch} from "react-icons/io";
import React from 'react';

interface TopSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const TopSearchBar: React.FC<TopSearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="w-1/2 flex flex-col">
      <div className="relative w-full">
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <IoIosSearch />
        </span>
        <input
          type="text"
          className="h-10 w-full px-10 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar o escanear código de barras..."
          autoFocus
          name="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default TopSearchBar;
