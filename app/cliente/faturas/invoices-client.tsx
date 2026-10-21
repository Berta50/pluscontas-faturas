"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getInvoiceStatusInfo, formatInvoiceDate } from "@/lib/invoices";
import { DeleteInvoiceButton } from "./delete-invoice-button";

export type InvoiceItem = {
  id: string;
  created_at: string;
  client_notes: string;
  review_status: string;
  company_id: string;
  company_name: string;
  company_vat: string;
  submitter_name: string;
  files_count: number;
  has_pdf: boolean;
};

type Props = {
  invoices: InvoiceItem[];
  companies: { id: string; name: string; vat_number: string }[];
};

export function InvoicesClient({ invoices, companies }: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Filtro por empresa
      if (selectedCompanyId !== "all" && inv.company_id !== selectedCompanyId) {
        return false;
      }

      // Filtro por estado
      if (statusFilter === "new" && inv.review_status !== "new") return false;
      if (
        statusFilter === "in_review" &&
        inv.review_status !== "in_review" &&
        inv.review_status !== "answered"
      ) {
        return false;
      }
      if (statusFilter === "returned" && inv.review_status !== "returned") return false;
      if (
        statusFilter === "treated" &&
        inv.review_status !== "approved" &&
        inv.review_status !== "exported"
      ) {
        return false;
      }

      // Filtro por pesquisa de texto na nota
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNote = inv.client_notes.toLowerCase().includes(query);
        const matchesCompany = inv.company_name.toLowerCase().includes(query);
        const matchesSubmitter = inv.submitter_name.toLowerCase().includes(query);
        if (!matchesNote && !matchesCompany && !matchesSubmitter) return false;
      }

      return true;
    });
  }, [invoices, selectedCompanyId, statusFilter, searchQuery]);

  // Contadores
  const counts = useMemo(() => {
    return {
      total: invoices.length,
      new: invoices.filter((i) => i.review_status === "new").length,
      in_review: invoices.filter(
        (i) => i.review_status === "in_review" || i.review_status === "answered",
      ).length,
      treated: invoices.filter(
        (i) => i.review_status === "approved" || i.review_status === "exported",
      ).length,
    };
  }, [invoices]);

  return (
    <div className="space-y-4">
      {/* 1. Resumo em cartões rápidos */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="rounded-xl border border-zinc-200/90 bg-white p-3 shadow-xs">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="mt-0.5 text-lg font-bold text-zinc-900">{counts.total}</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-xs">
          <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider">Enviadas</p>
          <p className="mt-0.5 text-lg font-bold text-amber-900">{counts.new}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">Tratadas</p>
          <p className="mt-0.5 text-lg font-bold text-emerald-900">{counts.treated}</p>
        </div>
      </div>

      {/* 2. Filtros e Pesquisa */}
      <div className="space-y-2.5 rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-xs">
        {/* Barra de Pesquisa */}
        <div>
          <input
            type="text"
            placeholder="Pesquisar por nota ou despesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filtro de Empresas (se tiver mais do que uma) */}
        {companies.length > 1 && (
          <div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-emerald-600 focus:outline-none"
            >
              <option value="all">Todas as empresas ({invoices.length})</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.vat_number})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs de Filtro de Estado */}
        <div className="flex gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
            }`}
          >
            Todas ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("new")}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              statusFilter === "new"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100/70"
            }`}
          >
            Enviadas ({counts.new})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("in_review")}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              statusFilter === "in_review"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100/70"
            }`}
          >
            Em análise ({counts.in_review})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("treated")}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              statusFilter === "treated"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70"
            }`}
          >
            Tratadas ({counts.treated})
          </button>
        </div>
      </div>

      {/* 3. Lista de Faturas */}
      {filteredInvoices.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-8 text-center shadow-xs">
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-900">
            {invoices.length === 0 ? "Ainda não tem faturas enviadas" : "Nenhuma fatura encontrada"}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {invoices.length === 0
              ? "Envie a sua primeira fatura tirando uma foto com o telemóvel."
              : "Tente ajustar os filtros ou a pesquisa acima."}
          </p>
          {invoices.length === 0 && (
            <div className="mt-5">
              <Link
                href="/cliente/enviar"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500"
              >
                + Enviar Primeira Fatura
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const status = getInvoiceStatusInfo(inv.review_status);
            const isDeletable = inv.review_status === "new";

            return (
              <div
                key={inv.id}
                className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Linha de topo: Empresa + Estado */}
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                    {inv.company_name}
                  </span>

                  {/* Estado em Português */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.badgeBg} ${status.badgeBorder} ${status.badgeText}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dotBg}`} />
                    {status.label}
                  </span>
                </div>

                {/* Nota do Cliente */}
                <p className="mt-2.5 text-sm font-medium text-zinc-900 line-clamp-2">
                  {inv.client_notes}
                </p>

                {/* Detalhes: Quem enviou, data, páginas */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 border-t border-zinc-100 pt-2.5">
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-3.5 w-3.5 text-zinc-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatInvoiceDate(inv.created_at)}
                  </span>

                  <span>•</span>

                  <span>Por: {inv.submitter_name}</span>

                  <span>•</span>

                  <span className="font-medium text-zinc-700">
                    {inv.has_pdf
                      ? "1 PDF"
                      : `${inv.files_count} ${inv.files_count === 1 ? "página" : "páginas"}`}
                  </span>
                </div>

                {/* Rodapé do Cartão com Botão Apagar (apenas se review_status === 'new') */}
                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ID: {inv.id.slice(0, 8)}
                  </span>

                  <div>
                    {isDeletable ? (
                      <DeleteInvoiceButton
                        invoiceId={inv.id}
                        notesSummary={inv.client_notes.slice(0, 30)}
                      />
                    ) : (
                      <span className="text-[10px] italic text-zinc-400">
                        Em processamento (bloqueada)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
