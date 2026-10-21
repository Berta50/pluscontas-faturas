import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";
import { UploadInvoiceForm, type CompanySummary } from "./upload-form";
import Link from "next/link";

type CompanyMemberJoin = {
  company: {
    id: string;
    name: string;
    vat_number: string;
    is_active: boolean;
  } | null;
};

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
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  let companies: CompanySummary[] = [];

  if (isAdmin) {
    // Administrador tem acesso a todas as empresas
    const { data: allCompanies } = await supabase
      .from("companies")
      .select("id, name, vat_number")
      .eq("is_active", true)
      .order("name", { ascending: true });
    companies = allCompanies || [];
  } else {
    // Cliente tem acesso apenas às empresas a que está associado
    const { data: userMemberships } = await supabase
      .from("company_members")
      .select(`
        company:companies (
          id,
          name,
          vat_number,
          is_active
        )
      `)
      .eq("profile_id", user.id);

    const typedMemberships = (userMemberships || []) as unknown as CompanyMemberJoin[];

    companies = typedMemberships
      .map((m) => m.company)
      .filter((c): c is { id: string; name: string; vat_number: string; is_active: boolean } =>
        Boolean(c && c.is_active),
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        vat_number: c.vat_number,
      }));
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Barra de Topo */}
        <header className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                PC
              </span>
              <h1 className="text-xl font-bold text-zinc-900">Plus Contas</h1>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {profile?.full_name || profile?.email || "Cliente"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cliente/faturas"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50"
            >
              Faturas
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Título da Página */}
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Enviar Fatura</h2>
          <p className="text-xs text-zinc-500">
            Tire foto ou anexe o ficheiro da sua fatura de compra.
          </p>
        </div>

        {/* Formulário de Envio */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <UploadInvoiceForm companies={companies} />
        </div>
      </div>
    </main>
  );
}
