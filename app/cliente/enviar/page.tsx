import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";

export default async function ClienteEnviarPage() {
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

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Plus Contas</h1>
            <p className="text-xs text-zinc-500">Área do Cliente</p>
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

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            Olá, {profile?.full_name || profile?.email || "Cliente"}
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Sessão iniciada na Área de Cliente.
          </p>
        </div>
      </div>
    </main>
  );
}
