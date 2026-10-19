import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jqepktfzojsfqvspyrzs.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_GZj6OOveldLtnQQOmOcjSg_6U9E5RR-";

describe("Tabelas criadas no Supabase (Tarefa 1.1)", () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const tables = [
    "profiles",
    "companies",
    "company_members",
    "staff_assignments",
    "invoices",
    "invoice_files",
  ];

  for (const table of tables) {
    it(`A tabela '${table}' deve responder sem erro de tabela inexistente`, async () => {
      const { error } = await supabase.from(table).select("*").limit(1);
      // Se a tabela existe, pode dar vazio (null) ou erro de permissão RLS, mas NUNCA 42P01 (relation does not exist)
      if (error) {
        expect(error.code).not.toBe("42P01");
        expect(error.code).not.toBe("PGRST205");
      }
    });
  }
});
