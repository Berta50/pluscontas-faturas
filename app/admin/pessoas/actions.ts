"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type InviteActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function invitePersonAction(
  prevState: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const fullName = (formData.get("full_name") as string)?.trim();
  const companyIds = formData.getAll("company_ids") as string[];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Introduza um endereço de email válido." };
  }

  if (companyIds.length === 0) {
    return { error: "Selecione pelo menos uma empresa para associar a esta pessoa." };
  }

  const supabase = await createClient();

  // Confirmar que quem está a convidar é administrador
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Inicie sessão novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Apenas administradores podem convidar pessoas." };
  }

  // Verificar se a pessoa já está registada no sistema
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return {
      error: `O email ${email} já está registado na aplicação (${existingProfile.role === "admin" ? "conta de Administradora" : "conta de Cliente"}). Para testar o convite de cliente, utilize um email diferente (ex: um email secundário).`,
    };
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirectUrl = `${appUrl}/auth/callback?next=/definir-senha`;

  let targetUserId: string;

  try {
    const adminSupabase = createAdminClient();

    // Convidar o utilizador através do Supabase Auth Admin
    const { data: inviteData, error: inviteError } =
      await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName || "",
          role: "client",
        },
        redirectTo: redirectUrl,
      });

    if (inviteError || !inviteData.user) {
      return {
        error:
          "Não foi possível enviar o convite: " +
          (inviteError?.message || "erro ao comunicar com o serviço de autenticação."),
      };
    }

    targetUserId = inviteData.user.id;

    // Associar o utilizador às empresas selecionadas
    // Inserir em company_members evitando duplicados
    for (const companyId of companyIds) {
      await adminSupabase.from("company_members").upsert(
        {
          company_id: companyId,
          profile_id: targetUserId,
        },
        { onConflict: "company_id,profile_id" },
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { error: errorMsg };
  }

  revalidatePath("/admin/pessoas");
  return {
    success: true,
    message: `Convite enviado com sucesso para ${email}!`,
  };
}
