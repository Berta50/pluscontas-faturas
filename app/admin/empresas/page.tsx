import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";

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

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Barra de topo */}
        <header className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Plus Contas</h1>
            <p className="text-xs text-zinc-500">Painel de Administração</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 active:bg-zinc-100"
            >
              Terminar sessão
            </button>
          </form>
        </header>

        {/* Cartão de Boas-Vindas */}
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-semibold">
              ✓
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Sessão iniciada com sucesso!
              </h2>
              <p className="text-xs text-zinc-600">
                {profile.full_name || profile.email} ({profile.role})
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            A sua sessão é permanente. Pode fechar o navegador no telemóvel e
            voltar a abrir que continuará com a sessão iniciada.
          </p>
        </div>

        {/* Espaço para a Tarefa 1.4 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-800">
            Gestão de Empresas
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Este ecrã será construído na próxima etapa (Tarefa 1.4: Criar e editar
            empresas).
          </p>
        </div>
      </div>
    </main>
  );
}
