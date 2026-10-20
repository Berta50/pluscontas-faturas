"use client";

import { useState } from "react";
import { CompanyModal, type CompanyData } from "./company-modal";

type Props = {
  initialCompanies: CompanyData[];
};

export function CompanyList({ initialCompanies }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);

  const filtered = initialCompanies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vat_number.includes(searchTerm),
  );

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company: CompanyData) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações: Pesquisa + Botão Nova Empresa */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou NIF..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
          <svg
            className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 active:bg-emerald-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Empresa
        </button>
      </div>

      {/* Lista de Empresas */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-900">
            {searchTerm ? "Nenhuma empresa encontrada" : "Ainda não existem empresas"}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchTerm
              ? "Tente pesquisar por outro termo ou NIF."
              : "Comece por registar a primeira empresa cliente."}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500"
            >
              + Adicionar Empresa
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs transition hover:border-zinc-300"
            >
              <div className="space-y-1 pr-3 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-zinc-900" title={company.name}>
                    {company.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      company.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                    }`}
                  >
                    {company.is_active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  NIF: <span className="font-mono text-zinc-700">{company.vat_number}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEdit(company)}
                className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyToEdit={editingCompany}
      />
    </div>
  );
}
