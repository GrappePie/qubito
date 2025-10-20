"use client";

import { ReactNode } from "react";

type DialogProps = {
    open: boolean;
    handler: () => void;
    children: ReactNode;
};

export const Dialog = ({open, handler, children}: DialogProps) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div
                className="fixed inset-0 bg-black opacity-60"
                onClick={handler}
                aria-label="Cerrar"
            />
            <div
                className="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg"
                role="dialog"
                aria-modal="true"
            >
                {children}
            </div>
        </div>
    );
}