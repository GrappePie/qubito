"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname?.startsWith('/login');

  return (
    <div className="flex min-h-0">
      {!hideNav && <Navbar />}
      <main className="flex-1 h-screen p-4 overflow-x-hidden">{children}</main>
    </div>
  );
}
