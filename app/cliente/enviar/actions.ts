"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type SubmitInvoiceState = {
  error?: string;
  success?: boolean;
  message?: string;
  invoiceId?: string;
};

export async function submitInvoiceAction(
  prevState: SubmitInvoiceState,
  formData: FormData,
): Promise<SubmitInvoiceState> {
  const companyId = formData.get("company_id") as string;
  const clientNotes = (formData.get("client_notes") as string)?.trim();
  const files = formData.getAll("files") as File[];

  if (!companyId) {
    return { error: "Por favor, selecione a empresa associada a esta fatura." };
  }

  // Validação obrigatória da nota: mínimo de 3 palavras
  const words = clientNotes ? clientNotes.split(/\s+/).filter(Boolean) : [];
  if (words.length < 3) {
    return {
      error:
        "A nota é obrigatória e deve ter pelo menos 3 palavras a explicar o que foi comprado e para quê (ex: Almoço com cliente).",
    };
  }

  // Validar ficheiros
  const validFiles = files.filter((f) => f && f.size > 0);
  if (validFiles.length === 0) {
    return { error: "Por favor, adicione pelo menos uma foto ou ficheiro PDF da fatura." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Por favor, inicie sessão novamente." };
  }

  // Verificar se o utilizador pertence à empresa ou é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    const { data: membership } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!membership) {
      return { error: "Não tem permissão para enviar faturas para esta empresa." };
    }
  }

  // 1. Criar o registo da fatura na base de dados
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      company_id: companyId,
      submitted_by: user.id,
      client_notes: clientNotes,
      review_status: "new",
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    return {
      error: `Não foi possível registar a fatura: ${invoiceError?.message || "erro de base de dados"}`,
    };
  }

  // 2. Fazer o upload de cada ficheiro para o Supabase Storage e registar em invoice_files
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const extension = file.name.split(".").pop() || "bin";
    const filePath = `${invoice.id}/pagina_${i + 1}_${Date.now()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const adminSupabase = createAdminClient();
    const { error: uploadError } = await adminSupabase.storage
      .from("invoices")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro no upload do ficheiro:", uploadError);
      // Continua a gravar ficheiros para tentar recuperar páginas válidas
    }

    await supabase.from("invoice_files").insert({
      invoice_id: invoice.id,
      file_path: filePath,
      file_type: file.type || "application/octet-stream",
      page_order: i + 1,
    });
  }

  revalidatePath("/cliente/faturas");
  revalidatePath("/admin/faturas");

  return {
    success: true,
    message: "Fatura enviada com sucesso!",
    invoiceId: invoice.id,
  };
}
