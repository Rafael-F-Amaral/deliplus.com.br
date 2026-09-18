import type { PlanCode } from "@/lib/billing/plans"

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const planLabels = {
  essential: "Essencial",
  multi_2: "Duo",
  multi_3: "Trio",
} as const satisfies Record<PlanCode, string>

const trialDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "America/Sao_Paulo",
})

export function getPlanLabel(planCode: PlanCode) {
  return planLabels[planCode]
}

export function getTrialDaysRemaining(validUntil: Date, now = new Date()) {
  const remainingMilliseconds = validUntil.getTime() - now.getTime()

  if (!Number.isFinite(remainingMilliseconds)) return 0

  return Math.max(0, Math.ceil(remainingMilliseconds / MILLISECONDS_PER_DAY))
}

export function formatTrialValidUntil(validUntil: Date) {
  return trialDateFormatter.format(validUntil)
}

export function formatStoreLimit(maxStores: number) {
  return maxStores === 1 ? "Até 1 Store" : `Até ${maxStores} Stores`
}
