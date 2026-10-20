"use client";

import { useActionState, useEffect } from "react";
import { createCompanyAction, updateCompanyAction, type CompanyActionState } from "./actions";

export type CompanyData = {
  id: string;
  name: string;
  vat_number: string;
  is_active: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyToEdit?: CompanyData | null;
};

export function CompanyModal({ isOpen, onClose, companyToEdit }: Props) {
  const isEditing = Boolean(companyToEdit);

  const [state, formAction, isPending] = useActionState<CompanyActionState, FormData>(
    isEditing ? updateCompanyAction : createCompanyAction,
    {},
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            {isEditing ? "Editar Empresa" : "Nova Empresa"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Fechar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="mt-4 space-y-4">
          {isEditing && <input type="hidden" name="id" value={companyToEdit?.id} />}

          {state?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {state.error}
            </div>
          )}

          {/* Nome da empresa */}
          <div>
            <label htmlFor="company-name" className="block text-xs font-semibold text-zinc-700">
              Nome da Empresa *
            </label>
            <input
              id="company-name"
              name="name"
              type="text"
              required
              defaultValue={companyToEdit?.name || ""}
              placeholder="Ex: Pastelaria Central, Lda."
              className="mt-1.5 block w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* NIF */}
          <div>
            <label htmlFor="company-vat" className="block text-xs font-semibold text-zinc-700">
              NIF (9 dígitos) *
            </label>
            <input
              id="company-vat"
              name="vat_number"
              type="text"
              inputMode="numeric"
              maxLength={9}
              required
              defaultValue={companyToEdit?.vat_number || ""}
              placeholder="Ex: 501234567"
              className="mt-1.5 block w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* Estado Ativa / Inativa (Apenas na edição) */}
          {isEditing && (
            <div className="flex items-center gap-3 pt-1">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                value="true"
                defaultChecked={companyToEdit?.is_active ?? true}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-zinc-700">
                Empresa ativa no sistema
              </label>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60"
            >
              {isPending ? "A guardar..." : isEditing ? "Guardar Alterações" : "Criar Empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
