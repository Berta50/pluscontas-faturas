"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidNif } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export type CompanyActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

// Criar nova empresa
export async function createCompanyAction(
  prevState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const name = (formData.get("name") as string)?.trim();
  const vatNumber = (formData.get("vat_number") as string)?.trim().replace(/\s+/g, "");

  if (!name || name.length < 2) {
    return { error: "O nome da empresa deve ter pelo menos 2 caracteres." };
  }

  if (!vatNumber || !isValidNif(vatNumber)) {
    return { error: "O NIF introduzido não é válido. Deve ter 9 dígitos válidos." };
  }

  const supabase = await createClient();

  // Confirmar que o utilizador autenticado é admin
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
    return { error: "Apenas administradores podem criar empresas." };
  }

  // Verificar se já existe empresa com este NIF
  const { data: existing } = await supabase
    .from("companies")
    .select("id, name")
    .eq("vat_number", vatNumber)
    .maybeSingle();

  if (existing) {
    return { error: `Já existe uma empresa registada com o NIF ${vatNumber} (${existing.name}).` };
  }

  const { error } = await supabase.from("companies").insert({
    name,
    vat_number: vatNumber,
    is_active: true,
  });

  if (error) {
    return { error: `Erro ao criar empresa: ${error.message}` };
  }

  revalidatePath("/admin/empresas");
  return { success: true, message: `Empresa "${name}" criada com sucesso!` };
}

// Atualizar empresa existente
export async function updateCompanyAction(
  prevState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const vatNumber = (formData.get("vat_number") as string)?.trim().replace(/\s+/g, "");
  const isActive = formData.get("is_active") === "true";

  if (!id) {
    return { error: "ID da empresa em falta." };
  }

  if (!name || name.length < 2) {
    return { error: "O nome da empresa deve ter pelo menos 2 caracteres." };
  }

  if (!vatNumber || !isValidNif(vatNumber)) {
    return { error: "O NIF introduzido não é válido. Deve ter 9 dígitos válidos." };
  }

  const supabase = await createClient();

  // Confirmar que o utilizador autenticado é admin
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
    return { error: "Apenas administradores podem editar empresas." };
  }

  // Verificar se o NIF foi alterado para um que já existe noutra empresa
  const { data: existing } = await supabase
    .from("companies")
    .select("id, name")
    .eq("vat_number", vatNumber)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return { error: `O NIF ${vatNumber} já está associado a outra empresa (${existing.name}).` };
  }

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      vat_number: vatNumber,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    return { error: `Erro ao atualizar empresa: ${error.message}` };
  }

  revalidatePath("/admin/empresas");
  return { success: true, message: `Empresa "${name}" atualizada com sucesso!` };
}
