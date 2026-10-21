"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { submitInvoiceAction } from "./actions";

export type CompanySummary = {
  id: string;
  name: string;
  vat_number: string;
};

type PageItem = {
  id: string;
  file: File;
  previewUrl: string | null;
  isPdf: boolean;
};

type Props = {
  companies: CompanySummary[];
  defaultCompanyId?: string;
};

export function UploadInvoiceForm({ companies, defaultCompanyId }: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    defaultCompanyId || (companies.length === 1 ? companies[0].id : ""),
  );
  const [pages, setPages] = useState<PageItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contagem de palavras na nota do cliente
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).filter(Boolean).length : 0;
  const isNotesValid = wordCount >= 3;

  // Processar ficheiros selecionados (comprimindo fotos)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setErrorMessage(null);
    setIsCompressing(true);

    const newPages: PageItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const rawFile = fileList[i];
      const isPdf = rawFile.type === "application/pdf" || rawFile.name.endsWith(".pdf");

      if (isPdf) {
        newPages.push({
          id: `${Date.now()}_${Math.random()}`,
          file: rawFile,
          previewUrl: null,
          isPdf: true,
        });
      } else if (rawFile.type.startsWith("image/")) {
        try {
          // Compressão otimizada para telemóveis (cerca de 300-350 KB)
          const options = {
            maxSizeMB: 0.35,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressed = await imageCompression(rawFile, options);
          const previewUrl = URL.createObjectURL(compressed);

          newPages.push({
            id: `${Date.now()}_${Math.random()}`,
            file: compressed,
            previewUrl,
            isPdf: false,
          });
        } catch {
          // Se falhar a compressão, utiliza o ficheiro original
          newPages.push({
            id: `${Date.now()}_${Math.random()}`,
            file: rawFile,
            previewUrl: URL.createObjectURL(rawFile),
            isPdf: false,
          });
        }
      }
    }

    setPages((prev) => [...prev, ...newPages]);
    setIsCompressing(false);

    // Limpar o input para permitir selecionar os mesmos ficheiros se necessário
    e.target.value = "";
  };

  const handleRemovePage = (id: string) => {
    setPages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCompanyId) {
      setErrorMessage("Por favor, selecione a empresa associada a esta fatura.");
      return;
    }

    if (pages.length === 0) {
      setErrorMessage("Por favor, tire uma foto ou selecione um ficheiro da fatura.");
      return;
    }

    if (!isNotesValid) {
      setErrorMessage(
        "A nota é obrigatória e deve ter pelo menos 3 palavras a explicar o que foi comprado e para quê.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("company_id", selectedCompanyId);
      formData.append("client_notes", notes);

      for (const page of pages) {
        formData.append("files", page.file);
      }

      const res = await submitInvoiceAction({}, formData);

      if (res.error) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setErrorMessage("Ocorreu um erro ao enviar a fatura. Por favor tente novamente.");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPages([]);
    setNotes("");
    setSuccess(false);
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h2 className="mt-4 text-lg font-bold text-zinc-900">Fatura Enviada com Sucesso!</h2>
        <p className="mt-1.5 text-xs text-zinc-600">
          A fatura foi guardada no sistema e já está disponível para análise pelo escritório.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700"
          >
            + Enviar Outra Fatura
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* 1. Escolha da Empresa */}
      {companies.length > 1 ? (
        <div>
          <label htmlFor="company-select" className="block text-xs font-semibold text-zinc-700">
            Empresa da Fatura *
          </label>
          <select
            id="company-select"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            required
            className="mt-1.5 block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          >
            <option value="">Selecione a empresa...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vat_number})
              </option>
            ))}
          </select>
        </div>
      ) : companies.length === 1 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-[10px] font-medium text-zinc-500">Empresa:</p>
          <p className="text-xs font-semibold text-zinc-800">
            {companies[0].name}{" "}
            <span className="font-mono text-zinc-500">({companies[0].vat_number})</span>
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Não tem nenhuma empresa associada. Contacte o seu contabilista.
        </div>
      )}

      {/* 2. Botões de Ação para Fotos / Ficheiros */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 mb-2">
          Documento da Fatura *
        </label>

        {/* Inputs escondidos acionados pelos botões */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3">
          {/* Botão Tirar Foto (Câmara Traseira) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCompressing || isSubmitting}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 p-4 text-emerald-800 hover:bg-emerald-100/60 active:bg-emerald-200/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="h-7 w-7 text-emerald-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
            <span className="text-xs font-semibold">Tirar Foto</span>
          </button>

          {/* Botão Escolher Ficheiro / Galeria */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing || isSubmitting}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white p-4 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="h-7 w-7 text-zinc-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className="text-xs font-semibold">Escolher Ficheiro</span>
          </button>
        </div>

        {isCompressing && (
          <p className="mt-2 text-center text-xs text-emerald-600 animate-pulse font-medium">
            A otimizar páginas da fatura...
          </p>
        )}
      </div>

      {/* 3. Pré-visualização das Páginas Adicionadas */}
      {pages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700">
              Páginas adicionadas ({pages.length})
            </span>
            <span className="text-[10px] text-zinc-500">Pode adicionar mais fotos</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-xs"
              >
                {p.isPdf ? (
                  <div className="flex h-32 flex-col items-center justify-center p-3 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-10 w-10 text-red-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <span className="mt-1 truncate max-w-full text-[11px] font-medium text-zinc-700">
                      {p.file.name}
                    </span>
                    <span className="text-[9px] text-zinc-400">PDF Documento</span>
                  </div>
                ) : (
                  <div className="relative h-32 w-full bg-zinc-900/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.previewUrl || ""}
                      alt={`Página ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Badge da página */}
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Pág. {idx + 1}
                </span>

                {/* Botão de Apagar Página */}
                <button
                  type="button"
                  onClick={() => handleRemovePage(p.id)}
                  className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                  aria-label="Remover página"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Campo de Nota Obrigatória */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="client-notes" className="block text-xs font-semibold text-zinc-700">
            O que foi comprado e para quê? *
          </label>
          <span
            className={`text-[10px] font-medium ${
              isNotesValid ? "text-emerald-600" : "text-zinc-500"
            }`}
          >
            {wordCount} {wordCount === 1 ? "palavra" : "palavras"}{" "}
            {!isNotesValid && `(mín. 3)`}
          </span>
        </div>

        <textarea
          id="client-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
          placeholder="Ex: Almoço de trabalho com cliente, combustível da carrinha, material de escritório..."
          className="block w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          Nota obrigatória (mínimo 3 palavras) para o contabilista classificar a despesa.
        </p>
      </div>

      {/* 5. Botão de Envio */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isCompressing || pages.length === 0 || !isNotesValid}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:bg-emerald-700"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              A enviar fatura...
            </span>
          ) : (
            "Enviar Fatura"
          )}
        </button>
      </div>
    </form>
  );
}
