import { createClient } from "@/lib/supabase/server";

// Página provisória (tarefa 0.3): confirma que a base de dados responde.
// Ainda não há tabelas, por isso "tabela não encontrada" significa que a ligação funciona.
const TABLE_NOT_FOUND = ["PGRST205", "42P01"];

async function checkConnection(): Promise<{ ok: boolean; message: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, message: "Faltam chaves do Supabase no .env.local." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("teste_ligacao").select("*").limit(1);
    if (!error || TABLE_NOT_FOUND.includes(error.code)) {
      return { ok: true, message: "A base de dados respondeu sem erro." };
    }
    return { ok: false, message: `A base de dados devolveu um erro (${error.code}): ${error.message}` };
  } catch (e) {
    return { ok: false, message: `Não foi possível contactar o Supabase: ${(e as Error).message}` };
  }
}

export default async function ConnectionTestPage() {
  const { ok, message } = await checkConnection();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center">
      <p className="text-5xl">{ok ? "✅" : "❌"}</p>
      <h1 className="text-2xl font-semibold text-zinc-900">
        {ok ? "Ligação ao Supabase OK" : "Ligação ao Supabase falhou"}
      </h1>
      <p className="text-zinc-600">{message}</p>
    </main>
  );
}
