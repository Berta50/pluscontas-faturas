import { describe, it, expect, vi } from "vitest";
import { invitePersonAction } from "@/app/admin/pessoas/actions";

// Mock do next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock do createClient do Supabase Server
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn((field: string) => {
                if (field === "id") {
                  return {
                    single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
                  };
                }
                if (field === "email") {
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                  };
                }
                return {};
              }),
            }),
          };
        }
        return {};
      }),
    }),
  };
});

// Mock do createAdminClient do Supabase
vi.mock("@/lib/supabase/admin", () => {
  return {
    createAdminClient: vi.fn().mockReturnValue({
      auth: {
        admin: {
          inviteUserByEmail: vi.fn().mockResolvedValue({
            data: { user: { id: "new-invited-user-id" } },
            error: null,
          }),
        },
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
});

describe("Convites de Pessoas (app/admin/pessoas/actions.ts)", () => {
  it("Deve rejeitar endereço de email inválido", async () => {
    const formData = new FormData();
    formData.append("email", "email-invalido");
    formData.append("company_ids", "00000000-0000-0000-0000-000000000000");

    const result = await invitePersonAction({}, formData);
    expect(result.error).toBe("Introduza um endereço de email válido.");
  });

  it("Deve exigir a seleção de pelo menos uma empresa", async () => {
    const formData = new FormData();
    formData.append("email", "cliente@teste.pt");

    const result = await invitePersonAction({}, formData);
    expect(result.error).toBe("Selecione pelo menos uma empresa para associar a esta pessoa.");
  });

  it("Deve convidar utilizador com dados válidos e associar à empresa", async () => {
    const formData = new FormData();
    formData.append("email", "novo-cliente@teste.pt");
    formData.append("full_name", "Cliente Teste");
    formData.append("company_ids", "11111111-1111-1111-1111-111111111111");

    const result = await invitePersonAction({}, formData);
    expect(result.success).toBe(true);
    expect(result.message).toContain("Convite enviado com sucesso");
  });
});
