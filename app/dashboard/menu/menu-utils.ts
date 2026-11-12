/**
 * Utilitários compartilhados do Cardápio (usados no Servidor e no Cliente)
 */

export function getCategoryBadgeStyle(catName: string): { bg: string; text: string } {
  const lower = catName.toLowerCase()
  if (lower.includes("bowl")) return { bg: "bg-[#EBF5ED] dark:bg-[#1A2E20] dark:border dark:border-[#2E543A]", text: "text-[#477A55] dark:text-[#86EFAC]" }
  if (lower.includes("bebid")) return { bg: "bg-[#FDF4E7] dark:bg-[#342410] dark:border dark:border-[#5C3F20]", text: "text-[#BA732F] dark:text-[#FBBF24]" }
  if (lower.includes("sobrem")) return { bg: "bg-[#F7EDF9] dark:bg-[#2F1835] dark:border dark:border-[#522D5A]", text: "text-[#8E5296] dark:text-[#E879F9]" }
  if (lower.includes("entrad")) return { bg: "bg-[#EFF6FF] dark:bg-[#16214A] dark:border dark:border-[#1E3A8A]", text: "text-[#2563EB] dark:text-[#93C5FD]" }
  if (lower.includes("promo") || lower.includes("oferta")) return { bg: "bg-[#FDF2F0] dark:bg-[#381812] dark:border dark:border-[#6B2A1E]", text: "text-[#CB5A3C] dark:text-[#FF7D4F]" }
  if (lower.includes("mais pedido") || lower.includes("destaque")) return { bg: "bg-[#FEF3C7] dark:bg-[#352305] dark:border dark:border-[#6B470A]", text: "text-[#B45309] dark:text-[#FCD34D]" }
  if (lower.includes("organ") || lower.includes("vegan")) return { bg: "bg-[#DCFCE7] dark:bg-[#11311C] dark:border dark:border-[#1F5C34]", text: "text-[#15803D] dark:text-[#86EFAC]" }
  if (lower.includes("gluten") || lower.includes("glúten")) return { bg: "bg-[#F1F5F9] dark:bg-[#1A2433] dark:border dark:border-[#334155]", text: "text-[#475569] dark:text-[#CBD5E1]" }
  return { bg: "bg-gray-100 dark:bg-[#222C25] dark:border dark:border-[#2A382E]", text: "text-gray-700 dark:text-[#F2EFE9]" }
}

export function formatPromoPeriod(
  startDateStr?: string | null,
  endDateStr?: string | null,
  isIndefinite?: boolean
): { periodText: string; totalDays: number } {
  if (isIndefinite || (!startDateStr && !endDateStr)) {
    return {
      periodText: "Prazo indeterminado",
      totalDays: Infinity
    }
  }

  const formatDateBR = (isoDate?: string | null) => {
    if (!isoDate) return ""
    const parts = isoDate.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return isoDate
  }

  const startBR = formatDateBR(startDateStr)
  const endBR = formatDateBR(endDateStr)

  let totalDays = 0
  if (startDateStr && endDateStr) {
    const start = new Date(`${startDateStr}T00:00:00`)
    const end = new Date(`${endDateStr}T23:59:59`)
    const diffMs = end.getTime() - start.getTime()
    totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
  }

  if (startBR && endBR) {
    return {
      periodText: `${startBR} a ${endBR}`,
      totalDays
    }
  }
  if (startBR) {
    return {
      periodText: `A partir de ${startBR}`,
      totalDays: Infinity
    }
  }
  return {
    periodText: `Até ${endBR}`,
    totalDays
  }
}
