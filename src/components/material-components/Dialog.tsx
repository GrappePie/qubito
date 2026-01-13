"use client";

import React, { ReactNode, useEffect, useId } from "react";

type DialogProps = {
    open: boolean;
    // Handler para cerrar el diálogo.
    handler: () => void;
    children: ReactNode;
    // Título opcional del diálogo; si es string se mostrará con estilos por defecto,
    // si es ReactNode se renderea tal cual.
    title?: string | ReactNode;
    subtitle?: string;
    // Texto opcional para el botón de confirmar.
    confirmLabelBtn?: string;
    // Texto opcional para el botón de cancelar.
    cancelLabelBtn?: string;
    // Callbacks opcionales; si no se proporcionan, se usará `handler` como fallback.
    onCancel?: () => void;
    onConfirm?: () => void;
};

export const Dialog = ({
    open,
    handler,
    children,
    title,
    subtitle,
    confirmLabelBtn,
    cancelLabelBtn,
    onCancel,
    onConfirm,
}: DialogProps) => {
    const titleId = useId();

    // Cerrar con ESC cuando el diálogo esté abierto.
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                handler();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, handler]);

    if (!open) return null;

    const handleClose = () => {
        handler();
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            handleClose();
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            handleClose();
        }
    };

    const hasHeader = Boolean(title || confirmLabelBtn || cancelLabelBtn);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div
                className="fixed inset-0 bg-black opacity-60"
                onClick={handleClose}
                aria-label="Cerrar"
            />
            <div
                className="relative z-10 w-full max-h-[90%] max-w-2xl rounded-lg bg-white shadow-lg flex flex-col"
                role="dialog"
                aria-modal="true"
                {...(title ? { "aria-labelledby": titleId } : {})}
            >
                {hasHeader && (
                    <div className="flex items-center justify-between gap-4 px-6 py-3">
                        <div>
                            {title && typeof title === "string" ? (
                                <h2
                                    id={titleId}
                                    className="text-lg font-semibold text-gray-900"
                                >
                                    {title}
                                </h2>
                            ) : title ? (
                                <div id={titleId}>{title}</div>
                            ) : null}
                            {subtitle && <p className={"text-sm text-slate-500"}>{subtitle}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            {cancelLabelBtn && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="h-10 rounded-lg border border-slate-300 px-4 font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    {cancelLabelBtn}
                                </button>
                            )}
                            {confirmLabelBtn && (
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className="h-10 rounded-lg bg-sky-600 px-4 font-semibold text-white transition-colors disabled:bg-slate-400 disabled:text-slate-200 text-sm"
                                >
                                    {confirmLabelBtn}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};
