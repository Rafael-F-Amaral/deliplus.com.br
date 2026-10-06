/**
 * Utilitários compartilhados do Cardápio (usados no Servidor e no Cliente)
 */

export function getCategoryBadgeStyle(catName: string): { bg: string; text: string } {
  const lower = catName.toLowerCase()
  if (lower.includes("bowl")) return { bg: "bg-[#EBF5ED]", text: "text-[#477A55]" }
  if (lower.includes("bebid")) return { bg: "bg-[#FDF4E7]", text: "text-[#BA732F]" }
  if (lower.includes("sobrem")) return { bg: "bg-[#F7EDF9]", text: "text-[#8E5296]" }
  if (lower.includes("entrad")) return { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]" }
  if (lower.includes("promo") || lower.includes("oferta")) return { bg: "bg-[#FDF2F0]", text: "text-[#CB5A3C]" }
  if (lower.includes("mais pedido") || lower.includes("destaque")) return { bg: "bg-[#FEF3C7]", text: "text-[#B45309]" }
  if (lower.includes("organ") || lower.includes("vegan")) return { bg: "bg-[#DCFCE7]", text: "text-[#15803D]" }
  if (lower.includes("gluten") || lower.includes("glúten")) return { bg: "bg-[#F1F5F9]", text: "text-[#475569]" }
  return { bg: "bg-gray-100", text: "text-gray-700" }
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
