import {ReactNode} from "react";

type DialogProps = {
    open: boolean;
    handler: () => void;
    children: ReactNode;
};

export const Dialog = ({open, handler, children}: DialogProps) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center max-w-lg backdrop-blur-sm size-max min-w-screen max-w-screen h-screen ">
            <div
                className="fixed inset-0  bg-black opacity-60"
                onClick={handler}
                aria-label="Close dialog"
            />
                <div className="relative bg-white rounded-lg shadow-lg p-6 z-10 min-w-1/4 max-w-2/3">
                    {children}
                </div>
        </div>
    );
}