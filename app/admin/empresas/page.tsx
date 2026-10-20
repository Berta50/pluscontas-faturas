import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";
import { CompanyList } from "./company-list";
import Link from "next/link";

export default async function AdminEmpresasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/cliente/enviar");
  }

  // Obter empresas registadas
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, vat_number, is_active")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Barra de Topo */}
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                PC
              </span>
              <h1 className="text-xl font-bold text-zinc-900">Plus Contas</h1>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Admin
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {profile.full_name || profile.email}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            {/* Navegação entre secções de administração */}
            <nav className="flex items-center gap-1">
              <Link
                href="/admin/empresas"
                className="rounded-lg bg-zinc-200/80 px-3 py-1.5 text-xs font-semibold text-zinc-900"
              >
                Empresas
              </Link>
              <Link
                href="/admin/pessoas"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Pessoas
              </Link>
              <Link
                href="/admin/faturas"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Faturas
              </Link>
            </nav>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 active:bg-zinc-100"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Título da Secção */}
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Empresas Clientes</h2>
          <p className="text-xs text-zinc-500">
            Registe e faça a gestão das empresas clientes do escritório.
          </p>
        </div>

        {/* Lista interativa de Empresas */}
        <CompanyList initialCompanies={companies || []} />
      </div>
    </main>
  );
}
