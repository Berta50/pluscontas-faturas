import { describe, it, expect, vi, beforeEach } from "vitest";
import { getInvoiceStatusInfo, formatInvoiceDate } from "@/lib/invoices";
import { deleteInvoiceAction } from "@/app/cliente/faturas/actions";

// Mock do next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Variáveis hoisted para Vitest
const mocks = vi.hoisted(() => {
  return {
    mockUser: { id: "user-1" } as { id: string } | null,
    mockInvoice: null as { id: string; review_status: string; company_id: string } | null,
    mockFiles: [] as { file_path: string }[],
    mockStorageRemove: vi.fn().mockResolvedValue({ error: null }),
  };
});

// Mock do createClient do Supabase Server
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn().mockImplementation(() => {
      return {
        auth: {
          getUser: vi.fn().mockImplementation(() => {
            return Promise.resolve({
              data: { user: mocks.mockUser },
            });
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "invoices") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockImplementation(() => {
                    if (!mocks.mockInvoice) {
                      return Promise.resolve({ data: null, error: { message: "Not found" } });
                    }
                    return Promise.resolve({ data: mocks.mockInvoice, error: null });
                  }),
                }),
              }),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === "invoice_files") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockImplementation(() => {
                  return Promise.resolve({ data: mocks.mockFiles, error: null });
                }),
              }),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          return {};
        }),
      };
    }),
  };
});

// Mock do createAdminClient do Supabase (para apagar ficheiros do storage)
vi.mock("@/lib/supabase/admin", () => {
  return {
    createAdminClient: vi.fn().mockReturnValue({
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mocks.mockStorageRemove,
        }),
      },
    }),
  };
});

describe("Estados de Fatura e Apresentação (lib/invoices.ts)", () => {
  it("Deve mapear corretamente todos os estados para português segundo a Secção 4 do PLAN.md", () => {
    expect(getInvoiceStatusInfo("new").label).toBe("Enviada");
    expect(getInvoiceStatusInfo("in_review").label).toBe("Em análise");
    expect(getInvoiceStatusInfo("answered").label).toBe("Em análise");
    expect(getInvoiceStatusInfo("returned").label).toBe("Pedido do escritório");
    expect(getInvoiceStatusInfo("approved").label).toBe("Tratada");
    expect(getInvoiceStatusInfo("exported").label).toBe("Tratada");
    expect(getInvoiceStatusInfo("desconhecido").label).toBe("Pendente");
  });

  it("Deve formatar datas corretamente em formato legível", () => {
    expect(formatInvoiceDate(null)).toBe("—");
    expect(formatInvoiceDate("2026-10-21T15:30:00Z")).toContain("2026");
  });
});

describe("Eliminação de Faturas pelo Cliente (app/cliente/faturas/actions.ts)", () => {
  beforeEach(() => {
    mocks.mockUser = { id: "user-1" };
    mocks.mockInvoice = null;
    mocks.mockFiles = [];
    mocks.mockStorageRemove.mockClear();
  });

  it("Deve rejeitar quando o ID da fatura não é fornecido", async () => {
    const result = await deleteInvoiceAction("");
    expect(result.error).toContain("Identificador da fatura em falta");
  });

  it("Deve rejeitar se a fatura não for encontrada", async () => {
    mocks.mockInvoice = null;
    const result = await deleteInvoiceAction("fatura-inexistente");
    expect(result.error).toContain("Fatura não encontrada");
  });

  it("Deve PROIBIR apagar faturas que já não estejam no estado 'new' (ex: 'in_review')", async () => {
    mocks.mockInvoice = {
      id: "fatura-123",
      review_status: "in_review",
      company_id: "empresa-1",
    };

    const result = await deleteInvoiceAction("fatura-123");
    expect(result.error).toContain("Apenas pode apagar faturas que ainda se encontram no estado 'Enviada'");
    expect(result.success).toBeFalsy();
    expect(mocks.mockStorageRemove).not.toHaveBeenCalled();
  });

  it("Deve PROIBIR apagar faturas que já estejam no estado 'approved'", async () => {
    mocks.mockInvoice = {
      id: "fatura-456",
      review_status: "approved",
      company_id: "empresa-1",
    };

    const result = await deleteInvoiceAction("fatura-456");
    expect(result.error).toContain("Apenas pode apagar faturas que ainda se encontram no estado 'Enviada'");
    expect(result.success).toBeFalsy();
    expect(mocks.mockStorageRemove).not.toHaveBeenCalled();
  });

  it("Deve PERMITIR apagar a fatura quando o estado é 'new' (Enviada) e remover ficheiros", async () => {
    mocks.mockInvoice = {
      id: "fatura-789",
      review_status: "new",
      company_id: "empresa-1",
    };
    mocks.mockFiles = [
      { file_path: "fatura-789/pagina_1.jpg" },
      { file_path: "fatura-789/pagina_2.jpg" },
    ];

    const result = await deleteInvoiceAction("fatura-789");
    expect(result.success).toBe(true);
    expect(result.message).toContain("Fatura apagada com sucesso");
    expect(mocks.mockStorageRemove).toHaveBeenCalledWith([
      "fatura-789/pagina_1.jpg",
      "fatura-789/pagina_2.jpg",
    ]);
  });
});
