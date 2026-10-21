import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/login/actions";
import { InvoicesClient, type InvoiceItem } from "./invoices-client";

type RawInvoiceJoin = {
  id: string;
  created_at: string;
  client_notes: string;
  review_status: string;
  company_id: string;
  company: {
    id: string;
    name: string;
    vat_number: string;
  } | null;
  submitter: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  files: {
    id: string;
    file_path: string;
    file_type: string;
    page_order: number;
  }[];
};

export default async function ClienteFaturasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obter perfil do utilizador autenticado
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Obter as empresas às quais o utilizador tem acesso
  let accessibleCompanies: { id: string; name: string; vat_number: string }[] = [];

  if (isAdmin) {
    const { data: allCompanies } = await supabase
      .from("companies")
      .select("id, name, vat_number")
      .eq("is_active", true)
      .order("name", { ascending: true });
    accessibleCompanies = allCompanies || [];
  } else {
    const { data: memberCompanies } = await supabase
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (memberCompanies || []) as any[];
    accessibleCompanies = list
      .map((item) => item.company)
      .filter((c) => Boolean(c && c.is_active))
      .map((c) => ({
        id: c.id,
        name: c.name,
        vat_number: c.vat_number,
      }));
  }

  // Obter as faturas
  // Graças ao RLS da tabela 'invoices', o cliente só recebe as faturas das suas empresas
  const { data: rawInvoices, error: invoicesError } = await supabase
    .from("invoices")
    .select(`
      id,
      created_at,
      client_notes,
      review_status,
      company_id,
      company:companies (id, name, vat_number),
      submitter:profiles (id, full_name, email),
      files:invoice_files (id, file_path, file_type, page_order)
    `)
    .order("created_at", { ascending: false });

  if (invoicesError) {
    console.error("Erro ao carregar faturas:", invoicesError);
  }

  const typedInvoices = (rawInvoices || []) as unknown as RawInvoiceJoin[];

  // Mapear dados para o formato do componente
  const invoices: InvoiceItem[] = typedInvoices.map((inv) => {
    const files = inv.files || [];
    const hasPdf = files.some(
      (f) => f.file_type === "application/pdf" || f.file_path.toLowerCase().endsWith(".pdf"),
    );

    return {
      id: inv.id,
      created_at: inv.created_at,
      client_notes: inv.client_notes,
      review_status: inv.review_status,
      company_id: inv.company_id,
      company_name: inv.company?.name || "Empresa",
      company_vat: inv.company?.vat_number || "",
      submitter_name: inv.submitter?.full_name || inv.submitter?.email || "Cliente",
      files_count: files.length,
      has_pdf: hasPdf,
    };
  });

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-lg space-y-5">
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
              href="/cliente/enviar"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 active:bg-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-3.5 w-3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Enviar</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Título do Ecrã */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">As Minhas Faturas</h2>
            <p className="text-xs text-zinc-500">
              Histórico e acompanhamento das despesas enviadas.
            </p>
          </div>
        </div>

        {/* Listagem e Filtros */}
        <InvoicesClient invoices={invoices} companies={accessibleCompanies} />
      </div>
    </main>
  );
}
