/**
 * Tradução e estilização dos estados de revisão de faturas para apresentação ao utilizador (pt-PT).
 *
 * Mapeamento da Secção 4 do PLAN.md:
 * - 'new' -> 'Enviada'
 * - 'in_review' / 'answered' -> 'Em análise'
 * - 'returned' -> 'Pedido do escritório'
 * - 'approved' / 'exported' -> 'Tratada'
 */

export type InvoiceStatusInfo = {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
};

export function getInvoiceStatusInfo(reviewStatus: string | null | undefined): InvoiceStatusInfo {
  switch (reviewStatus) {
    case "new":
      return {
        label: "Enviada",
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-800",
        badgeBorder: "border-amber-200",
        dotBg: "bg-amber-500",
      };
    case "in_review":
    case "answered":
      return {
        label: "Em análise",
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-800",
        badgeBorder: "border-blue-200",
        dotBg: "bg-blue-500",
      };
    case "returned":
      return {
        label: "Pedido do escritório",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-800",
        badgeBorder: "border-rose-200",
        dotBg: "bg-rose-500",
      };
    case "approved":
    case "exported":
      return {
        label: "Tratada",
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-800",
        badgeBorder: "border-emerald-200",
        dotBg: "bg-emerald-500",
      };
    default:
      return {
        label: "Pendente",
        badgeBg: "bg-zinc-100",
        badgeText: "text-zinc-800",
        badgeBorder: "border-zinc-200",
        dotBg: "bg-zinc-400",
      };
  }
}

/**
 * Formatação de data amigável em Português europeu
 */
export function formatInvoiceDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return isoDate;
  }
}
