import { describe, it, expect, vi } from "vitest";
import { isValidNif } from "@/lib/validation";
import { createCompanyAction } from "@/app/admin/empresas/actions";

// Mock de revalidatePath para não falhar fora do contexto HTTP do Next.js
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock do createClient do Supabase
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
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
              }),
            }),
          };
        }
        if (table === "companies") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    }),
  };
});

describe("Validação de NIF Português (lib/validation.ts)", () => {
  it("Deve validar NIFs portugueses corretos", () => {
    // NIFs reais e calculados com módulo 11 correto
    expect(isValidNif("500000000")).toBe(true); // Fictício válido
    expect(isValidNif("500697256")).toBe(true); // EDP
    expect(isValidNif("504499777")).toBe(true); // Galp
    expect(isValidNif("500100144")).toBe(true); // Jerónimo Martins
  });

  it("Deve rejeitar NIFs com dígitos de controlo inválidos", () => {
    expect(isValidNif("500697257")).toBe(false);
    expect(isValidNif("500000001")).toBe(false);
  });

  it("Deve rejeitar NIFs com tamanho diferente de 9 dígitos", () => {
    expect(isValidNif("12345678")).toBe(false);
    expect(isValidNif("1234567890")).toBe(false);
    expect(isValidNif("")).toBe(false);
  });

  it("Deve rejeitar valores não numéricos", () => {
    expect(isValidNif("ABCDEFGHI")).toBe(false);
    expect(isValidNif("50069725A")).toBe(false);
  });
});

describe("Criação de Empresas (app/admin/empresas/actions.ts)", () => {
  it("Deve rejeitar empresas sem nome", async () => {
    const formData = new FormData();
    formData.append("name", " ");
    formData.append("vat_number", "500000000");

    const result = await createCompanyAction({}, formData);
    expect(result.error).toBe("O nome da empresa deve ter pelo menos 2 caracteres.");
  });

  it("Deve rejeitar NIF inválido", async () => {
    const formData = new FormData();
    formData.append("name", "Empresa de Teste Lda");
    formData.append("vat_number", "999999999"); // Inválido pelo algoritmo

    const result = await createCompanyAction({}, formData);
    expect(result.error).toBe("O NIF introduzido não é válido. Deve ter 9 dígitos válidos.");
  });

  it("Deve aceitar criação com dados válidos", async () => {
    const formData = new FormData();
    formData.append("name", "Cliente Teste Lda");
    formData.append("vat_number", "500697256");

    const result = await createCompanyAction({}, formData);
    expect(result.success).toBe(true);
    expect(result.message).toContain("criada com sucesso");
  });
});
