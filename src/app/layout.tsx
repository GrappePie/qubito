import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/store/Providers";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Qubito Inventory App",
    description: "Inventory management application for Qubito",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
        >
        <Providers>
            <div className="flex min-h-0">
                <Navbar />
                <main className=" flex-1 h-screen p-4 overflow-x-hidden">{children}</main>
            </div>
            <Toaster position="top-right" />
        </Providers>
        </body>
        </html>
    );
}
