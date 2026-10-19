"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Por favor, introduza o email e a palavra-passe." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: "Email ou palavra-passe incorretos. Por favor, tente novamente.",
    };
  }

  // Obter o perfil para direcionar para o ecrã certo
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin/empresas");
  }

  redirect("/cliente/enviar");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
