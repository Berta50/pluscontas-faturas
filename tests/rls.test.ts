import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jqepktfzojsfqvspyrzs.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_GZj6OOveldLtnQQOmOcjSg_6U9E5RR-";

describe("Políticas de Segurança RLS (Tarefa 1.2)", () => {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  it("Um utilizador não autenticado não deve conseguir ler faturas", async () => {
    const { data, error } = await anonClient.from("invoices").select("*");
    expect(error).toBeNull();
    // Com o RLS ativo, o PostgREST aplica o filtro do utilizador atual e devolve lista vazia
    expect(data).toEqual([]);
  });

  it("Um utilizador não autenticado não deve conseguir ler empresas", async () => {
    const { data, error } = await anonClient.from("companies").select("*");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("Um utilizador não autenticado não deve conseguir inserir faturas", async () => {
    const { data, error } = await anonClient.from("invoices").insert({
      company_id: "00000000-0000-0000-0000-000000000000",
      client_notes: "Nota de teste para verificar RLS",
    }).select();

    // Deve ser bloqueado pela política de RLS
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("A migração RLS deve ativar segurança em todas as 6 tabelas", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../supabase/migrations/20260419000002_rls_policies.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    const requiredTables = [
      "profiles",
      "companies",
      "company_members",
      "staff_assignments",
      "invoices",
      "invoice_files",
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("A regra de isolamento deve garantir que o cliente apenas acede às faturas da sua empresa", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../supabase/migrations/20260419000002_rls_policies.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Confirma que a política de invoices usa a função get_user_company_ids()
    expect(sql).toContain("company_id in (select public.get_user_company_ids())");

    // Confirma que o admin tem acesso total
    expect(sql).toContain("public.is_admin()");
  });
});
