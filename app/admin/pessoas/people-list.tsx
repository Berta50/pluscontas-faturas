"use client";

import { useState } from "react";
import { InviteModal, type CompanyOption } from "./invite-modal";

export type PersonProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
  companies: {
    id: string;
    name: string;
    vat_number: string;
  }[];
};

type Props = {
  people: PersonProfile[];
  availableCompanies: CompanyOption[];
};

export function PeopleList({ people, availableCompanies }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = people.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesEmail = p.email?.toLowerCase().includes(term);
    const matchesName = p.full_name?.toLowerCase().includes(term);
    const matchesCompany = p.companies.some(
      (c) =>
        c.name.toLowerCase().includes(term) || c.vat_number.includes(term),
    );
    return matchesEmail || matchesName || matchesCompany;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Ações: Pesquisa + Botão Convidar Pessoa */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, email ou empresa..."
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
          onClick={() => setIsModalOpen(true)}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.375 21c-2.331 0-4.512-.645-6.375-1.765z"
            />
          </svg>
          Convidar Pessoa
        </button>
      </div>

      {/* Lista de Pessoas */}
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
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-900">
            {searchTerm ? "Nenhuma pessoa encontrada" : "Ainda não existem pessoas"}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchTerm
              ? "Tente pesquisar por outro nome, email ou empresa."
              : "Convide o primeiro cliente ou membro da equipa."}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500"
            >
              + Convidar Pessoa
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((person) => {
            const isAdmin = person.role === "admin";
            return (
              <div
                key={person.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-zinc-900">
                        {person.full_name || person.email || "Sem nome"}
                      </h3>
                      {person.full_name && person.email && (
                        <p className="truncate text-xs text-zinc-500">
                          {person.email}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        isAdmin
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isAdmin ? "Admin" : "Cliente"}
                    </span>
                  </div>

                  {/* Empresas associadas */}
                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-zinc-500 mb-1.5">
                      Empresas associadas:
                    </p>
                    {isAdmin ? (
                      <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 font-medium">
                        Acesso a todas as empresas (Admin)
                      </span>
                    ) : person.companies.length === 0 ? (
                      <span className="inline-block text-[11px] text-zinc-400 italic">
                        Nenhuma empresa atribuída
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {person.companies.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                          >
                            <span className="truncate max-w-[140px]">{c.name}</span>
                            <span className="text-[9px] text-emerald-600 font-mono">
                              ({c.vat_number})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    Adicionado em:{" "}
                    {new Date(person.created_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Convite */}
      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableCompanies={availableCompanies}
      />
    </div>
  );
}
