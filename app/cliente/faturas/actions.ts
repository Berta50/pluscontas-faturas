"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type DeleteInvoiceResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function deleteInvoiceAction(invoiceId: string): Promise<DeleteInvoiceResult> {
  if (!invoiceId) {
    return { error: "Identificador da fatura em falta." };
  }

  const supabase = await createClient();

  // 1. Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Por favor, inicie sessão novamente." };
  }

  // 2. Procurar a fatura e verificar permissões e estado
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, review_status, company_id")
    .eq("id", invoiceId)
    .single();

  if (fetchError || !invoice) {
    return { error: "Fatura não encontrada ou sem permissão de acesso." };
  }

  // 3. Regra essencial do PLAN.md (1.7): Botão Apagar só enquanto o estado for 'Enviada' (review_status = 'new')
  if (invoice.review_status !== "new") {
    return {
      error:
        "Apenas pode apagar faturas que ainda se encontram no estado 'Enviada'. Esta fatura já está em processamento pelo escritório.",
    };
  }

  // 4. Obter os ficheiros associados para apagar do armazenamento privado
  const { data: files } = await supabase
    .from("invoice_files")
    .select("file_path")
    .eq("invoice_id", invoiceId);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => f.file_path).filter(Boolean);
    if (filePaths.length > 0) {
      try {
        const adminSupabase = createAdminClient();
        await adminSupabase.storage.from("invoices").remove(filePaths);
      } catch (storageErr) {
        console.error("Aviso ao remover ficheiros do storage:", storageErr);
      }
    }
  }

  // 5. Apagar registos de invoice_files
  await supabase.from("invoice_files").delete().eq("invoice_id", invoiceId);

  // 6. Apagar o registo da fatura
  const { error: deleteError } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId);

  if (deleteError) {
    return {
      error: `Não foi possível apagar a fatura: ${deleteError.message}`,
    };
  }

  revalidatePath("/cliente/faturas");
  revalidatePath("/admin/faturas");

  return {
    success: true,
    message: "Fatura apagada com sucesso.",
  };
}
