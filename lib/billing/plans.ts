export const PLAN_CODES = ["essential", "multi_2", "multi_3"] as const

export type PlanCode = (typeof PLAN_CODES)[number]

const planDefinitions = {
  essential: {
    code: "essential",
    maxStores: 1,
  },
  multi_2: {
    code: "multi_2",
    maxStores: 2,
  },
  multi_3: {
    code: "multi_3",
    maxStores: 3,
  },
} as const satisfies Record<
  PlanCode,
  {
    code: PlanCode
    maxStores: number
  }
>

export type PlanDefinition = (typeof planDefinitions)[PlanCode]

export type StripePriceEnvironment = {
  STRIPE_PRICE_ESSENTIAL?: string
  STRIPE_PRICE_MULTI_2?: string
  STRIPE_PRICE_MULTI_3?: string
}

type StripePriceEnvironmentName = keyof StripePriceEnvironment

const stripePriceEnvironmentNameByPlan = {
  essential: "STRIPE_PRICE_ESSENTIAL",
  multi_2: "STRIPE_PRICE_MULTI_2",
  multi_3: "STRIPE_PRICE_MULTI_3",
} as const satisfies Record<PlanCode, StripePriceEnvironmentName>

export class UnsupportedPlanCodeError extends Error {
  constructor() {
    super("Unsupported billing plan")
    this.name = "UnsupportedPlanCodeError"
  }
}

export class PlanPriceConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlanPriceConfigurationError"
  }
}

export function isPlanCode(value: unknown): value is PlanCode {
  return typeof value === "string" && Object.hasOwn(planDefinitions, value)
}

export function parsePlanCode(value: unknown): PlanCode {
  if (!isPlanCode(value)) {
    throw new UnsupportedPlanCodeError()
  }

  return value
}

export function getPlanDefinition(value: unknown): PlanDefinition {
  return planDefinitions[parsePlanCode(value)]
}

export function resolveStripePriceIdFromEnvironment(
  planCode: unknown,
  environment: StripePriceEnvironment
) {
  const plan = getPlanDefinition(planCode)
  const environmentName = stripePriceEnvironmentNameByPlan[plan.code]
  const stripePriceId = environment[environmentName]

  if (!stripePriceId) {
    throw new PlanPriceConfigurationError(
      `Missing required Stripe server configuration: ${environmentName}`
    )
  }

  if (
    stripePriceId !== stripePriceId.trim() ||
    !/^price_[A-Za-z0-9]+$/u.test(stripePriceId)
  ) {
    throw new PlanPriceConfigurationError(
      `Invalid Stripe server configuration: ${environmentName}`
    )
  }

  return stripePriceId
}
