"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Cabeçalho com identificação da marca */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
            Plus Contas
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            App de Faturas — Inicie sessão para continuar
          </p>
        </div>

        {/* Cartão do formulário de Login */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div
                className="rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200/60"
                role="alert"
              >
                <div className="flex gap-2">
                  <svg
                    className="h-5 w-5 text-red-500 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{state.error}</span>
                </div>
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-800"
              >
                Email
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  placeholder="exemplo@empresa.pt"
                  className="block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            {/* Campo Palavra-passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-800"
              >
                Palavra-passe
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="A sua palavra-passe"
                  className="block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 pr-11 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botão de Entrar (grande para toque fácil no telemóvel) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:bg-emerald-700"
              >
                {isPending ? (
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
                    A iniciar sessão...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Rodapé informativo */}
        <p className="text-center text-xs text-zinc-500">
          O acesso é reservado a clientes e equipa da Plus Contas. Se não tem
          acesso, contacte o seu contabilista.
        </p>
      </div>
    </main>
  );
}
