import { describe, it, expect, vi } from "vitest";
import { submitInvoiceAction } from "@/app/cliente/enviar/actions";

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
          data: { user: { id: "user-123" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: "client" } }),
              }),
            }),
          };
        }
        if (table === "company_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "member-1" } }),
                }),
              }),
            }),
          };
        }
        if (table === "invoices") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "inv-999" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "invoice_files") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
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
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
    }),
  };
});

describe("Envio de Faturas pelo Cliente (app/cliente/enviar/actions.ts)", () => {
  it("Deve exigir a seleção da empresa", async () => {
    const formData = new FormData();
    formData.append("client_notes", "Almoço com cliente de trabalho");
    const file = new File(["dummy content"], "fatura.jpg", { type: "image/jpeg" });
    formData.append("files", file);

    const result = await submitInvoiceAction({}, formData);
    expect(result.error).toContain("selecione a empresa");
  });

  it("Deve rejeitar nota com menos de 3 palavras", async () => {
    const formData = new FormData();
    formData.append("company_id", "empresa-123");
    formData.append("client_notes", "Almoço cliente"); // Apenas 2 palavras
    const file = new File(["dummy content"], "fatura.jpg", { type: "image/jpeg" });
    formData.append("files", file);

    const result = await submitInvoiceAction({}, formData);
    expect(result.error).toContain("pelo menos 3 palavras");
  });

  it("Deve rejeitar envio sem ficheiros", async () => {
    const formData = new FormData();
    formData.append("company_id", "empresa-123");
    formData.append("client_notes", "Almoço com cliente de trabalho");

    const result = await submitInvoiceAction({}, formData);
    expect(result.error).toContain("adicione pelo menos uma foto ou ficheiro PDF");
  });

  it("Deve aceitar fatura válida com nota de 3 ou mais palavras e ficheiros", async () => {
    const formData = new FormData();
    formData.append("company_id", "empresa-123");
    formData.append("client_notes", "Almoço de trabalho com cliente importante");
    const file1 = new File(["dummy content 1"], "pagina1.jpg", { type: "image/jpeg" });
    const file2 = new File(["dummy content 2"], "pagina2.jpg", { type: "image/jpeg" });
    formData.append("files", file1);
    formData.append("files", file2);

    const result = await submitInvoiceAction({}, formData);
    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe("inv-999");
    expect(result.message).toContain("Fatura enviada com sucesso");
  });
});
