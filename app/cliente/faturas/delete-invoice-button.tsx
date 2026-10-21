"use client";

import { useState } from "react";
import { deleteInvoiceAction } from "./actions";

type Props = {
  invoiceId: string;
  notesSummary?: string;
};

export function DeleteInvoiceButton({ invoiceId, notesSummary }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = await deleteInvoiceAction(invoiceId);
      if (result.error) {
        setErrorMessage(result.error);
        setIsDeleting(false);
      } else {
        setIsOpen(false);
        setIsDeleting(false);
      }
    } catch {
      setErrorMessage("Ocorreu um erro ao apagar a fatura. Tente novamente.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100/70 active:bg-red-200/50 transition-colors"
        title="Apagar fatura"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
        <span>Apagar</span>
      </button>

      {/* Modal de Confirmação */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <h3 className="mt-3 text-base font-bold text-zinc-900">Apagar Fatura?</h3>
            <p className="mt-1.5 text-xs text-zinc-600">
              Tem a certeza de que deseja apagar esta fatura
              {notesSummary ? ` ("${notesSummary}")` : ""}? Os ficheiros serão eliminados do
              armazenamento e esta ação é irreversível.
            </p>

            {errorMessage && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-500 active:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "A apagar..." : "Sim, apagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
