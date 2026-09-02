import "server-only"

import type { PlanCode } from "./plans"
import type { Database } from "../supabase/database.types"

export type CheckoutAttempt =
  Database["public"]["Tables"]["billing_checkout_attempts"]["Row"]
export type CustomerClaim =
  Database["public"]["Tables"]["billing_customers"]["Row"]
export type LocalSubscription = Pick<
  Database["public"]["Tables"]["billing_subscriptions"]["Row"],
  | "stripe_subscription_id"
  | "status"
  | "collection_paused"
  | "plan_code"
  | "stripe_price_id"
>
export type CheckoutConfiguration = {
  stripePriceId: string
  currency: "brl"
  recurringInterval: "month"
  recurringIntervalCount: 1
  paymentMethodConfigurationId: string
  livemode: boolean
  stripeApiVersion: "2026-07-29.dahlia"
  successUrl: string
  cancelUrl: string
}
export type CheckoutSession = {
  id: string
  status: "open" | "complete" | "expired"
  url: string | null
  subscriptionId: string | null
}
export type CheckoutSubscription = {
  id: string
  status: string
  collectionPaused: boolean
  attemptId: string | null
}
export type StripeCheckoutResult =
  | { status: "checkout_ready"; checkoutUrl: string }
  | {
      status:
        | "unauthenticated"
        | "no_active_organization"
        | "not_admin"
        | "organization_not_provisioned"
        | "invalid_plan"
        | "already_subscribed"
        | "billing_recovery_required"
        | "checkout_in_progress"
        | "checkout_processing"
    }
type Blocker = Exclude<StripeCheckoutResult["status"], "checkout_ready">
export type AttemptResult = {
  outcome:
    | "attempt"
    | "stale"
    | "already_subscribed"
    | "billing_recovery_required"
    | "checkout_in_progress"
  attempt: CheckoutAttempt | null
}
export type CheckoutRepository = {
  findOrganization: (clerkOrganizationId: string) => Promise<string | null>
  readSubscription: (
    organizationId: string
  ) => Promise<LocalSubscription | null>
  readAttempt: (organizationId: string) => Promise<CheckoutAttempt | null>
  claimCustomer: (organizationId: string) => Promise<CustomerClaim>
  finalizeCustomer: (
    claim: CustomerClaim,
    customerId: string
  ) => Promise<CustomerClaim>
  claimAttempt: (
    organizationId: string,
    customerId: string,
    plan: PlanCode,
    config: CheckoutConfiguration
  ) => Promise<AttemptResult>
  reconcile: (
    attempt: CheckoutAttempt,
    sessionId: string | null,
    state: "open" | "completed" | "recovery_required"
  ) => Promise<AttemptResult>
  endAttempt: (
    attempt: CheckoutAttempt,
    session: CheckoutSession,
    correlatedTerminal: boolean
  ) => Promise<AttemptResult>
}
export type CheckoutProvider = {
  validateCatalog: (config: CheckoutConfiguration) => Promise<void>
  createCustomer: (
    claim: CustomerClaim,
    config: CheckoutConfiguration
  ) => Promise<string>
  retrieveCustomer: (
    customerId: string,
    config: CheckoutConfiguration
  ) => Promise<boolean>
  listSubscriptions: (
    customerId: string,
    config: CheckoutConfiguration
  ) => Promise<CheckoutSubscription[]>
  createSession: (attempt: CheckoutAttempt) => Promise<CheckoutSession>
  retrieveSession: (attempt: CheckoutAttempt) => Promise<CheckoutSession | null>
}
type Dependencies = {
  getAuth: () => Promise<{
    userId: string | null
    orgId: string | null | undefined
    isAdmin: boolean
  }>
  isPlanCode: (value: unknown) => value is PlanCode
  getConfiguration: (plan: PlanCode) => CheckoutConfiguration
  repository: CheckoutRepository
  stripe: CheckoutProvider
  now: () => number
}
export class StripeCheckoutError extends Error {
  constructor() {
    // Deliberately no raw cause: provider errors can embed keys, URLs and IDs.
    super("Unable to resolve subscription Checkout")
    this.name = "StripeCheckoutError"
  }
}
const terminal = (status: string) =>
  status === "canceled" || status === "incomplete_expired"
const known = (status: string) =>
  [
    "active",
    "past_due",
    "unpaid",
    "paused",
    "trialing",
    "incomplete",
    "canceled",
    "incomplete_expired",
  ].includes(status)
const recovery = (): StripeCheckoutResult => ({
  status: "billing_recovery_required",
})

export function parseCheckoutAttempt(value: unknown): CheckoutAttempt {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new StripeCheckoutError()
  const row = value as Record<string, unknown>
  const keys = [
    "id",
    "organization_id",
    "plan_code",
    "stripe_price_id",
    "stripe_customer_id",
    "stripe_idempotency_key",
    "stripe_checkout_session_id",
    "state",
    "expires_at",
    "success_url",
    "cancel_url",
    "payment_method_configuration_id",
    "integration_identifier",
    "payload_version",
    "stripe_api_version",
    "livemode",
    "revision",
    "created_at",
    "updated_at",
    "ended_at",
  ]
  if (
    Object.keys(row).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(row, k))
  )
    throw new StripeCheckoutError()
  for (const key of ["id", "organization_id"]) {
    if (
      typeof row[key] !== "string" ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu.test(row[key])
    )
      throw new StripeCheckoutError()
  }
  for (const [key, pattern] of Object.entries({
    stripe_price_id: /^price_[A-Za-z0-9]+$/u,
    stripe_customer_id: /^cus_[A-Za-z0-9]+$/u,
    payment_method_configuration_id: /^pmc_[A-Za-z0-9]+$/u,
    integration_identifier: /^deliplus-checkout-[a-z]{8}$/u,
    stripe_api_version: /^\d{4}-\d{2}-\d{2}\.[a-z]+$/u,
  })) {
    if (typeof row[key] !== "string" || !pattern.test(row[key]))
      throw new StripeCheckoutError()
  }
  if (
    !["essential", "multi_2", "multi_3"].includes(String(row.plan_code)) ||
    !["creating", "open", "completed", "recovery_required", "ended"].includes(
      String(row.state)
    ) ||
    typeof row.livemode !== "boolean" ||
    !Number.isSafeInteger(row.revision) ||
    Number(row.revision) < 0 ||
    !Number.isSafeInteger(row.payload_version) ||
    Number(row.payload_version) < 1 ||
    row.stripe_idempotency_key !== `deli-plus:checkout:v1:${row.id}`
  )
    throw new StripeCheckoutError()
  for (const key of ["created_at", "updated_at", "expires_at"]) {
    if (typeof row[key] !== "string" || !Number.isFinite(Date.parse(row[key])))
      throw new StripeCheckoutError()
  }
  if (
    Date.parse(row.expires_at as string) <=
      Date.parse(row.created_at as string) ||
    Date.parse(row.expires_at as string) % 1000 !== 0
  )
    throw new StripeCheckoutError()
  const hasSession =
    typeof row.stripe_checkout_session_id === "string" &&
    /^cs_[A-Za-z0-9_]+$/u.test(row.stripe_checkout_session_id)
  if (
    (!hasSession && row.stripe_checkout_session_id !== null) ||
    (row.state === "creating" && hasSession) ||
    (["open", "completed", "ended"].includes(String(row.state)) &&
      !hasSession) ||
    (row.state === "ended") !== (row.ended_at !== null) ||
    (row.ended_at !== null &&
      (typeof row.ended_at !== "string" ||
        !Number.isFinite(Date.parse(row.ended_at))))
  )
    throw new StripeCheckoutError()
  let origin: string | undefined
  for (const [key, path] of [
    ["success_url", "/dashboard/billing/success"],
    ["cancel_url", "/dashboard/billing"],
  ]) {
    if (typeof row[key] !== "string") throw new StripeCheckoutError()
    const url = new URL(row[key])
    if (
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && url.hostname === "localhost")) ||
      url.username ||
      url.password ||
      url.pathname !== path ||
      url.search ||
      url.hash ||
      (origin && origin !== url.origin)
    )
      throw new StripeCheckoutError()
    origin = url.origin
  }
  return value as CheckoutAttempt
}

export function parseCheckoutAttemptResult(value: unknown): AttemptResult {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !("outcome" in value) ||
    !("attempt" in value) ||
    ![
      "attempt",
      "stale",
      "already_subscribed",
      "billing_recovery_required",
      "checkout_in_progress",
    ].includes(String(value.outcome))
  )
    throw new StripeCheckoutError()
  if (
    (value.outcome === "attempt" ||
      value.outcome === "stale" ||
      value.outcome === "checkout_in_progress") &&
    value.attempt === null
  )
    throw new StripeCheckoutError()
  return {
    outcome: value.outcome as AttemptResult["outcome"],
    attempt:
      value.attempt === null ? null : parseCheckoutAttempt(value.attempt),
  }
}

// Checkout eligibility is NOT entitlement: a local trial is never queried here.
export function subscriptionBlocker(
  local: LocalSubscription | null,
  subscriptions: CheckoutSubscription[],
  attempt: CheckoutAttempt | null,
  session: CheckoutSession | null
): Blocker | null {
  if (
    local &&
    (!known(local.status) ||
      typeof local.collection_paused !== "boolean" ||
      !/^sub_[A-Za-z0-9]+$/u.test(local.stripe_subscription_id) ||
      !["essential", "multi_2", "multi_3"].includes(local.plan_code) ||
      !/^price_[A-Za-z0-9]+$/u.test(local.stripe_price_id))
  ) {
    throw new StripeCheckoutError()
  }
  const current = subscriptions.filter((s) => !terminal(s.status))
  if (subscriptions.some((s) => !known(s.status)) || current.length > 1)
    return "billing_recovery_required"
  const external = current[0]
  if (
    (local && !terminal(local.status) && local.collection_paused) ||
    external?.collectionPaused
  )
    return "billing_recovery_required"
  if (
    local &&
    external &&
    !terminal(local.status) &&
    local.stripe_subscription_id !== external.id
  )
    return "billing_recovery_required"
  for (const status of [local?.status, external?.status]) {
    if (status && ["past_due", "unpaid", "paused", "trialing"].includes(status))
      return "billing_recovery_required"
  }
  const correlated =
    external &&
    attempt &&
    (session?.subscriptionId === external.id ||
      external.attemptId === attempt.id)
  if (external && !correlated && external.id !== local?.stripe_subscription_id)
    return "billing_recovery_required"
  if (local?.status === "active") return "already_subscribed"
  if (external?.status === "active")
    return correlated && session?.status === "complete"
      ? "checkout_processing"
      : "already_subscribed"
  if (local?.status === "incomplete" || external?.status === "incomplete") {
    const id = external?.id ?? local?.stripe_subscription_id
    if (session && session.subscriptionId === id) {
      if (session.status === "complete") return "checkout_processing"
      if (session.status === "open") return null
    }
    return "billing_recovery_required"
  }
  return null
}

function compatible(attempt: CheckoutAttempt, config: CheckoutConfiguration) {
  // Origin may change between Preview deployments: the trusted persisted URL wins.
  return (
    attempt.payload_version === 1 &&
    attempt.stripe_api_version === config.stripeApiVersion &&
    attempt.livemode === config.livemode &&
    attempt.stripe_price_id === config.stripePriceId &&
    attempt.payment_method_configuration_id ===
      config.paymentMethodConfigurationId
  )
}

export function createSubscriptionCheckout(deps: Dependencies) {
  const repo = deps.repository
  return async function createSubscriptionCheckoutSession(
    planCode: PlanCode
  ): Promise<StripeCheckoutResult> {
    try {
      const auth = await deps.getAuth()
      if (!auth.userId) return { status: "unauthenticated" }
      if (!auth.orgId) return { status: "no_active_organization" }
      if (!auth.isAdmin) return { status: "not_admin" }
      if (!deps.isPlanCode(planCode)) return { status: "invalid_plan" }
      const organizationId = await repo.findOrganization(auth.orgId)
      if (organizationId === null)
        return { status: "organization_not_provisioned" }
      if (
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu.test(organizationId)
      )
        throw new StripeCheckoutError()
      const config = deps.getConfiguration(planCode)
      let local = await repo.readSubscription(organizationId)
      subscriptionBlocker(local, [], null, null) // Validate local invariants before external creation.
      await deps.stripe.validateCatalog(config)
      let customer = await repo.claimCustomer(organizationId)
      if (
        customer.organization_id !== organizationId ||
        !["pending", "ready"].includes(customer.provisioning_status) ||
        !Number.isFinite(Date.parse(customer.created_at)) ||
        (customer.provisioning_status === "ready" &&
          !customer.stripe_customer_id)
      )
        throw new StripeCheckoutError()
      let customerId = customer.stripe_customer_id
      if (customerId) {
        if (!(await deps.stripe.retrieveCustomer(customerId, config)))
          return recovery()
      } else {
        const age = deps.now() - Date.parse(customer.created_at)
        // Two-minute margin covers bounded SDK retries/clock skew; never rotate keys.
        if (
          age < 0 ||
          age >= 23 * 3600_000 - 120_000 ||
          !/^deli-plus:customer:v1:[0-9a-f-]{36}$/u.test(
            customer.creation_idempotency_key
          )
        )
          return recovery()
        customerId = await deps.stripe.createCustomer(customer, config)
      }
      if (customer.provisioning_status === "pending")
        customer = await repo.finalizeCustomer(customer, customerId)
      if (
        customer.provisioning_status !== "ready" ||
        customer.stripe_customer_id !== customerId ||
        customer.organization_id !== organizationId
      )
        throw new StripeCheckoutError()

      // At most one safe closure + replacement per invocation. No unbounded retries.
      for (let pass = 0; pass < 2; pass++) {
        let attempt = await repo.readAttempt(organizationId)
        let session = attempt?.stripe_checkout_session_id
          ? await deps.stripe.retrieveSession(attempt)
          : null
        let subscriptions = await deps.stripe.listSubscriptions(
          customerId,
          config
        )
        local = await repo.readSubscription(organizationId)
        let blocker = subscriptionBlocker(
          local,
          subscriptions,
          attempt,
          session
        )
        if (blocker) return { status: blocker }
        if (attempt && attempt.plan_code !== planCode) {
          // An ongoing intent cannot be switched. A provider-confirmed terminal
          // intent can be closed, then a different plan can acquire a fresh key.
          const correlated = subscriptions.find(
            (s) => s.id === session?.subscriptionId
          )
          const terminalSession =
            session &&
            (session.status === "expired" ||
              (session.status === "complete" &&
                correlated &&
                terminal(correlated.status)))
          if (
            !session ||
            !terminalSession ||
            (session?.subscriptionId &&
              (!correlated || !terminal(correlated.status)))
          )
            return { status: "checkout_in_progress" }
          const stored = await repo.reconcile(
            attempt,
            session.id,
            session.status === "expired" ? "recovery_required" : "completed"
          )
          if (stored.outcome !== "attempt" || !stored.attempt) return recovery()
          attempt = stored.attempt
          session = await deps.stripe.retrieveSession(attempt)
          subscriptions = await deps.stripe.listSubscriptions(
            customerId,
            config
          )
          local = await repo.readSubscription(organizationId)
          blocker = subscriptionBlocker(local, subscriptions, attempt, session)
          if (blocker) return { status: blocker }
          const confirmed = subscriptions.find(
            (s) => s.id === session?.subscriptionId
          )
          const confirmedTerminal = Boolean(
            confirmed && terminal(confirmed.status)
          )
          if (
            !session ||
            session.status === "open" ||
            (session.subscriptionId && !confirmedTerminal) ||
            (session.status === "complete" && !confirmedTerminal)
          )
            return recovery()
          const closed = await repo.endAttempt(
            attempt,
            session,
            confirmedTerminal
          )
          if (closed.outcome !== "attempt" || closed.attempt?.state !== "ended")
            return recovery()
          continue
        }
        if (attempt && !compatible(attempt, config)) return recovery()

        const claimed = await repo.claimAttempt(
          organizationId,
          customerId,
          planCode,
          config
        )
        if (claimed.outcome !== "attempt") {
          if (claimed.outcome === "stale") return recovery()
          return { status: claimed.outcome }
        }
        const previous = attempt
        attempt = claimed.attempt
        if (
          !attempt ||
          attempt.organization_id !== organizationId ||
          attempt.stripe_customer_id !== customerId ||
          attempt.plan_code !== planCode
        )
          throw new StripeCheckoutError()
        if (!compatible(attempt, config)) return recovery()
        // A competing claimant may have persisted a Session since the earlier read.
        if (attempt.stripe_checkout_session_id)
          session = await deps.stripe.retrieveSession(attempt)
        else if (previous?.stripe_checkout_session_id) return recovery()
        subscriptions = await deps.stripe.listSubscriptions(customerId, config)
        local = await repo.readSubscription(organizationId)
        blocker = subscriptionBlocker(local, subscriptions, attempt, session)
        if (blocker) return { status: blocker }

        if (!session && !attempt.stripe_checkout_session_id) {
          const remaining = Date.parse(attempt.expires_at) - deps.now()
          // Stripe requires >=30m on create. An old no-ID result is indeterminate:
          // do not mutate expires_at to bypass that requirement.
          if (remaining < 32 * 60_000 || attempt.state !== "creating") {
            await repo.reconcile(attempt, null, "recovery_required")
            return recovery()
          }
          session = await deps.stripe.createSession(attempt)
        }
        if (!session) return recovery()
        const desired =
          session.status === "open"
            ? "open"
            : session.status === "complete"
              ? "completed"
              : "recovery_required"
        const persisted = await repo.reconcile(attempt, session.id, desired)
        if (
          persisted.outcome !== "attempt" ||
          !persisted.attempt ||
          persisted.attempt.state !== desired ||
          persisted.attempt.stripe_checkout_session_id !== session.id
        )
          return recovery()
        attempt = persisted.attempt
        // Reread provider and local guards after persistence; never return a stale URL.
        session = await deps.stripe.retrieveSession(attempt)
        if (!session) return recovery()
        subscriptions = await deps.stripe.listSubscriptions(customerId, config)
        local = await repo.readSubscription(organizationId)
        blocker = subscriptionBlocker(local, subscriptions, attempt, session)
        if (blocker) return { status: blocker }
        if (session.status === "open") {
          if (
            attempt.state !== "open" ||
            !session.url ||
            Date.parse(attempt.expires_at) <= deps.now()
          )
            return recovery()
          return { status: "checkout_ready", checkoutUrl: session.url }
        }
        const correlated = subscriptions.find(
          (s) => s.id === session?.subscriptionId
        )
        const correlatedTerminal = Boolean(
          correlated && terminal(correlated.status)
        )
        if (session.status === "complete" && !correlatedTerminal)
          return { status: "checkout_processing" }
        // Expired with an unexplained subscription cannot release the reservation.
        if (session.subscriptionId && !correlatedTerminal) return recovery()
        const ended = await repo.endAttempt(
          attempt,
          session,
          correlatedTerminal
        )
        if (ended.outcome !== "attempt" || ended.attempt?.state !== "ended")
          return recovery()
      }
      return recovery()
    } catch {
      throw new StripeCheckoutError()
    }
  }
}
