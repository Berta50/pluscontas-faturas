import { describe, it, expect, vi } from "vitest";
import { loginAction } from "@/app/(auth)/login/actions";

// Mock do createClient do Supabase Server para testar sem contexto de requisição HTTP
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
          if (email === "admin@pluscontas.pt" && password === "Segredo123!") {
            return Promise.resolve({
              data: { user: { id: "user-admin-id" } },
              error: null,
            });
          }
          return Promise.resolve({
            data: { user: null },
            error: { message: "Invalid login credentials" },
          });
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
          }),
        }),
      }),
    }),
  };
});

describe("Autenticação e Login (Tarefa 1.3)", () => {
  it("Deve recusar submissão sem email ou sem palavra-passe com mensagem clara", async () => {
    const formData = new FormData();
    formData.append("email", "");
    formData.append("password", "");

    const result = await loginAction({}, formData);
    expect(result.error).toBe("Por favor, introduza o email e a palavra-passe.");
  });

  it("Deve recusar credenciais inválidas com mensagem amigável", async () => {
    const formData = new FormData();
    formData.append("email", "utilizador-inexistente@pluscontas.pt");
    formData.append("password", "PalavraPasseErrada123");

    const result = await loginAction({}, formData);
    expect(result.error).toBe(
      "Email ou palavra-passe incorretos. Por favor, tente novamente."
    );
  });
});
