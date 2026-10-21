import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";
import { PeopleList, type PersonProfile } from "./people-list";
import Link from "next/link";

type CompanyMemberJoin = {
  company: {
    id: string;
    name: string;
    vat_number: string;
  } | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
  company_members: CompanyMemberJoin[];
};

export default async function AdminPessoasPage() {
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

  // Obter todas as pessoas registadas e as respetivas empresas associadas
  const { data: rawProfiles } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      created_at,
      company_members (
        company:companies (
          id,
          name,
          vat_number
        )
      )
    `)
    .order("created_at", { ascending: false });

  // Obter lista de empresas ativas para o formulário de convite
  const { data: rawCompanies } = await supabase
    .from("companies")
    .select("id, name, vat_number")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const typedProfiles = (rawProfiles || []) as unknown as ProfileRow[];

  const people: PersonProfile[] = typedProfiles.map((p) => {
    const companies = p.company_members
      ?.map((cm) => cm.company)
      .filter((c): c is { id: string; name: string; vat_number: string } => Boolean(c)) || [];

    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      created_at: p.created_at,
      companies,
    };
  });

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
            <nav className="flex items-center gap-1">
              <Link
                href="/admin/empresas"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Empresas
              </Link>
              <Link
                href="/admin/pessoas"
                className="rounded-lg bg-zinc-200/80 px-3 py-1.5 text-xs font-semibold text-zinc-900"
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
          <h2 className="text-lg font-bold text-zinc-900">Pessoas e Clientes</h2>
          <p className="text-xs text-zinc-500">
            Convide clientes por email e associe-os às suas respetivas empresas.
          </p>
        </div>

        {/* Lista de Utilizadores */}
        <PeopleList people={people} availableCompanies={rawCompanies || []} />
      </div>
    </main>
  );
}
