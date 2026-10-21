"use client";

import { useActionState, useEffect } from "react";
import { invitePersonAction, type InviteActionState } from "./actions";

export type CompanyOption = {
  id: string;
  name: string;
  vat_number: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  availableCompanies: CompanyOption[];
};

export function InviteModal({ isOpen, onClose, availableCompanies }: Props) {
  const [state, formAction, isPending] = useActionState<InviteActionState, FormData>(
    invitePersonAction,
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
          <h2 className="text-lg font-semibold text-zinc-900">Convidar Pessoa</h2>
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
          {state?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {state.error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="invite-email" className="block text-xs font-semibold text-zinc-700">
              Email do Cliente *
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="cliente@empresa.pt"
              className="mt-1.5 block w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* Nome completo */}
          <div>
            <label htmlFor="invite-name" className="block text-xs font-semibold text-zinc-700">
              Nome Completo
            </label>
            <input
              id="invite-name"
              name="full_name"
              type="text"
              placeholder="Ex: João Silva"
              className="mt-1.5 block w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* Selecionar Empresas */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Empresas Associadas *
            </label>
            {availableCompanies.length === 0 ? (
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
                Ainda não existem empresas registadas. Crie primeiro uma empresa em Admin › Empresas.
              </p>
            ) : (
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3">
                {availableCompanies.map((company) => (
                  <label
                    key={company.id}
                    className="flex items-center gap-2.5 text-xs text-zinc-800 hover:bg-zinc-50 p-1 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="company_ids"
                      value={company.id}
                      className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{company.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">NIF: {company.vat_number}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || availableCompanies.length === 0}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60"
            >
              {isPending ? "A enviar convite..." : "Enviar Convite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
