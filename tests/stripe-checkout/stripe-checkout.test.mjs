import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { fixture, config, subscription, organizationId } from "./fixtures.mjs"
import {
  StripeCheckoutError,
  parseCheckoutAttempt,
  parseCheckoutAttemptResult,
} from "../../lib/billing/subscription-checkout.internal.ts"

for (const [status, auth] of [
  ["unauthenticated", { userId: null }],
  ["no_active_organization", { orgId: null }],
  ["not_admin", { isAdmin: false }],
]) {
  test(`domain: ${status} stops before data/provider access`, async () => {
    const f = fixture()
    Object.assign(f.state.auth, auth)
    assert.deepEqual(await f.run("essential"), { status })
    assert.equal(f.state.calls.length, 0)
    assert.equal(f.stripe.state.calls.length, 0)
  })
}
test("domain: missing Organization is not provisioned implicitly", async () => {
  const f = fixture()
  f.state.organizationId = null
  assert.deepEqual(await f.run("essential"), {
    status: "organization_not_provisioned",
  })
  assert.equal(f.stripe.state.calls.length, 0)
})
for (const value of [
  null,
  undefined,
  {},
  ["essential"],
  "Essencial",
  "multi_4",
  "price_other",
  1,
]) {
  test(`domain: malformed plan ${JSON.stringify(value)} has no authority`, async () => {
    const f = fixture()
    assert.deepEqual(await f.run(value), { status: "invalid_plan" })
    assert.equal(f.state.calls.length, 0)
  })
}
for (const plan of ["essential", "multi_2", "multi_3"]) {
  test(`domain: ${plan} creates and persists one canonical Session before URL`, async () => {
    const f = fixture()
    const result = await f.run(plan, {
      organizationId: "other",
      price: "price_other",
      amount: 1,
      quantity: 8,
      currency: "usd",
      interval: "year",
    })
    assert.equal(result.status, "checkout_ready")
    assert.deepEqual(Object.keys(result).sort(), ["checkoutUrl", "status"])
    assert.equal(f.state.customer.provisioning_status, "ready")
    assert.ok(f.state.attempt.stripe_checkout_session_id)
    assert.equal(f.state.attempt.stripe_price_id, config(plan).stripePriceId)
    assert.equal(f.state.customer.organization_id, organizationId)
    assert.deepEqual(f.state.calls[0], ["findOrganization", "org_test"])
  })
}
test("domain: same plan retry reuses Customer and Session with no second create", async () => {
  const f = fixture()
  const first = await f.run("essential")
  const snapshot = structuredClone(f.state.attempt)
  assert.deepEqual(await f.run("essential"), first)
  assert.deepEqual(f.state.attempt, snapshot)
  assert.equal(f.stripe.state.customers.size, 1)
  assert.equal(f.stripe.state.sessions.size, 1)
  assert.equal(
    f.stripe.state.calls.filter((c) => c.name === "checkout.sessions.create")
      .length,
    1
  )
})
test("domain: different plan never replaces ongoing intent or returns wrong URL", async () => {
  const f = fixture()
  await f.run("essential")
  assert.deepEqual(await f.run("multi_2"), { status: "checkout_in_progress" })
  assert.equal(f.stripe.state.sessions.size, 1)
})
test("domain: two simultaneous tabs converge on one intent and provider operation", async () => {
  const f = fixture()
  const result = await Promise.all([f.run("essential"), f.run("essential")])
  assert.deepEqual(result[0], result[1])
  assert.equal(f.stripe.state.customers.size, 1)
  assert.equal(f.stripe.state.sessions.size, 1)
})
for (const point of ["customers.create", "checkout.sessions.create"]) {
  test(`domain: lost ${point} response replays identical persisted operation`, async () => {
    const f = fixture()
    f.stripe.state.loss = point
    await assert.rejects(f.run("essential"), StripeCheckoutError)
    const result = await f.run("essential")
    assert.equal(result.status, "checkout_ready")
    assert.equal(f.stripe.state.customers.size, 1)
    assert.equal(f.stripe.state.sessions.size, 1)
    const calls = f.stripe.state.calls.filter((c) => c.name === point)
    assert.equal(calls.length, 2)
    assert.deepEqual(calls[0].params, calls[1].params)
    assert.equal(
      calls[0].options.idempotencyKey,
      calls[1].options.idempotencyKey
    )
  })
}
for (const failure of ["finalize", "attach"]) {
  test(`domain: ${failure} failure withholds URL and retries same external object`, async () => {
    const f = fixture()
    f.state.failure = failure
    await assert.rejects(f.run("essential"), StripeCheckoutError)
    if (failure === "finalize") assert.equal(f.stripe.state.sessions.size, 0)
    f.state.failure = null
    assert.equal((await f.run("essential")).status, "checkout_ready")
    assert.equal(f.stripe.state.customers.size, 1)
    assert.equal(f.stripe.state.sessions.size, 1)
  })
}
test("domain: pending Customer with known ID is recovered without creation", async () => {
  const f = fixture()
  await f.run("essential")
  f.state.customer.provisioning_status = "pending"
  const count = f.stripe.state.calls.filter(
    (c) => c.name === "customers.create"
  ).length
  await f.run("essential")
  assert.equal(
    f.stripe.state.calls.filter((c) => c.name === "customers.create").length,
    count
  )
})
test("domain: unresolved old Customer remains reserved after retention cutoff", async () => {
  const f = fixture()
  await f.repository.claimCustomer(organizationId)
  f.state.customer.created_at = new Date(
    Date.now() - 24 * 3600_000
  ).toISOString()
  const key = f.state.customer.creation_idempotency_key
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })
  assert.equal(f.stripe.state.customers.size, 0)
  assert.equal(f.state.customer.creation_idempotency_key, key)
})
test("domain: deleted canonical Customer is never replaced", async () => {
  const f = fixture()
  await f.run("essential")
  f.stripe.state.customers.get("cus_checkout").deleted = true
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })
  assert.equal(f.stripe.state.customers.size, 1)
})
for (const status of [
  "active",
  "past_due",
  "unpaid",
  "paused",
  "trialing",
  "incomplete",
]) {
  test(`domain: existing ${status} subscription cannot create a fresh acquisition`, async () => {
    const f = fixture()
    await f.run("essential")
    const attempt = f.state.attempt
    f.state.subscription = {
      stripe_subscription_id: "sub_checkout",
      status,
      collection_paused: false,
      plan_code: "essential",
      stripe_price_id: config().stripePriceId,
    }
    f.stripe.state.subscriptions = [subscription(status)]
    if (status === "incomplete")
      f.stripe.state.sessions.get(
        attempt.stripe_checkout_session_id
      ).subscription = "sub_checkout"
    assert.equal(
      (await f.run("essential")).status,
      status === "active"
        ? "already_subscribed"
        : status === "incomplete"
          ? "checkout_ready"
          : "billing_recovery_required"
    )
    assert.equal(f.stripe.state.sessions.size, 1)
  })
}
test("domain: complete Session with webhook lag is processing, not paid access", async () => {
  const f = fixture()
  await f.run("essential")
  Object.assign(
    f.stripe.state.sessions.get(f.state.attempt.stripe_checkout_session_id),
    { status: "complete", subscription: "sub_checkout", url: null }
  )
  f.stripe.state.subscriptions = [
    subscription("active", {
      metadata: { checkout_attempt_id: f.state.attempt.id },
    }),
  ]
  assert.deepEqual(await f.run("essential"), { status: "checkout_processing" })
  assert.equal(f.stripe.state.sessions.size, 1)
})
for (const state of ["multiple", "unknown", "unrelated", "collection_paused"]) {
  test(`domain: ${state} external subscriptions fail closed`, async () => {
    const f = fixture()
    await f.run("essential")
    f.stripe.state.subscriptions =
      state === "multiple"
        ? [
            subscription("active"),
            subscription("incomplete", { id: "sub_second" }),
          ]
        : [
            subscription(
              state === "unknown" ? "future_status" : "active",
              state === "collection_paused"
                ? { pause_collection: { behavior: "void" } }
                : {}
            ),
          ]
    assert.deepEqual(await f.run("essential"), {
      status: "billing_recovery_required",
    })
  })
}
for (const status of ["canceled", "incomplete_expired"]) {
  test(`domain: completed ${status} subscription safely closes before replacement`, async () => {
    const f = fixture()
    await f.run("essential")
    const old = f.state.attempt.id
    Object.assign(
      f.stripe.state.sessions.get(f.state.attempt.stripe_checkout_session_id),
      { status: "complete", subscription: "sub_checkout", url: null }
    )
    f.stripe.state.subscriptions = [subscription(status)]
    assert.equal((await f.run("essential")).status, "checkout_ready")
    assert.equal(f.state.ended.length, 1)
    assert.notEqual(f.state.attempt.id, old)
  })
}
test("domain: provider-confirmed expiration and clear subscriptions permit replacement", async () => {
  const f = fixture()
  await f.run("essential")
  Object.assign(
    f.stripe.state.sessions.get(f.state.attempt.stripe_checkout_session_id),
    { status: "expired", url: null }
  )
  assert.equal((await f.run("essential")).status, "checkout_ready")
  assert.equal(f.state.ended.length, 1)
})
test("domain: a different plan may acquire only after verified terminal closure", async () => {
  const f = fixture()
  await f.run("essential")
  Object.assign(
    f.stripe.state.sessions.get(f.state.attempt.stripe_checkout_session_id),
    { status: "expired", url: null }
  )
  assert.equal((await f.run("multi_2")).status, "checkout_ready")
  assert.equal(f.state.ended.length, 1)
  assert.equal(f.state.attempt.plan_code, "multi_2")
})
test("domain: Preview origin changes reuse the original frozen URLs", async () => {
  const f = fixture()
  f.stripe.state.loss = "checkout.sessions.create"
  await assert.rejects(f.run("essential"))
  f.dependencies.getConfiguration = (plan) => ({
    ...config(plan),
    successUrl: "https://preview.example/dashboard/billing/success",
    cancelUrl: "https://preview.example/dashboard/billing",
  })
  assert.equal((await f.run("essential")).status, "checkout_ready")
  const calls = f.stripe.state.calls.filter(
    (c) => c.name === "checkout.sessions.create"
  )
  assert.deepEqual(calls[0].params, calls[1].params)
})
test("domain: stale local nonterminal projection remains a blocker", async () => {
  const f = fixture()
  await f.run("essential")
  f.state.subscription = {
    stripe_subscription_id: "sub_checkout",
    status: "past_due",
    collection_paused: false,
    plan_code: "essential",
    stripe_price_id: config().stripePriceId,
  }
  f.stripe.state.subscriptions = [subscription("canceled")]
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })
  assert.equal(f.stripe.state.sessions.size, 1)
})
test("domain: cancel-at-period-end active subscription remains subscribed", async () => {
  const f = fixture()
  await f.run("essential")
  f.state.subscription = {
    stripe_subscription_id: "sub_checkout",
    status: "active",
    collection_paused: false,
    plan_code: "essential",
    stripe_price_id: config().stripePriceId,
  }
  f.stripe.state.subscriptions = [
    subscription("active", { cancel_at_period_end: true }),
  ]
  assert.deepEqual(await f.run("essential"), { status: "already_subscribed" })
})
test("domain: incomplete without correlated payable Session requires recovery", async () => {
  const f = fixture()
  await f.run("essential")
  f.state.subscription = {
    stripe_subscription_id: "sub_checkout",
    status: "incomplete",
    collection_paused: false,
    plan_code: "essential",
    stripe_price_id: config().stripePriceId,
  }
  f.stripe.state.subscriptions = [subscription("incomplete")]
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })
})
test("domain: Clerk lookup failure is a sanitized error before repository access", async () => {
  const f = fixture()
  f.dependencies.getAuth = async () => {
    throw new Error("synthetic auth details")
  }
  await assert.rejects(f.run("essential"), StripeCheckoutError)
  assert.equal(f.state.calls.length, 0)
})
test("domain: unknown Session after expiration never releases reservation", async () => {
  const f = fixture()
  f.stripe.state.loss = "checkout.sessions.create"
  await assert.rejects(f.run("essential"))
  const id = f.state.attempt.id
  f.state.clockOffset = 3600_000
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })
  assert.equal(f.state.attempt.id, id)
  assert.equal(f.state.ended.length, 0)
})
test("domain: stale attachment returns no URL", async () => {
  const f = fixture()
  f.state.failure = "stale"
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })
})
test("domain: config drift preserves reservation and fails closed", async () => {
  const f = fixture()
  await f.run("essential")
  f.state.attempt.stripe_api_version = "2025-01-01.old"
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })
  assert.equal(f.stripe.state.sessions.size, 1)
})
test("domain: actual provider errors remain sanitized errors", async () => {
  const f = fixture()
  f.stripe.state.fail = "prices.retrieve"
  await assert.rejects(
    f.run("essential"),
    (error) =>
      error instanceof StripeCheckoutError &&
      error.message === "Unable to resolve subscription Checkout" &&
      error.cause === undefined
  )
})
test("domain: malformed RPC fields, state and URLs fail closed", async () => {
  const f = fixture()
  await f.run("essential")
  assert.deepEqual(parseCheckoutAttempt(f.state.attempt), f.state.attempt)
  for (const patch of [
    { extra: true },
    { state: "unknown" },
    { revision: -1 },
    { stripe_idempotency_key: "new" },
    { success_url: "https://evil.example/path" },
    { organization_id: "other" },
  ]) {
    assert.throws(() => parseCheckoutAttempt({ ...f.state.attempt, ...patch }))
  }
  for (const value of [
    null,
    [],
    { outcome: "other", attempt: null },
    { outcome: "attempt", attempt: null },
    { outcome: "attempt", attempt: f.state.attempt, extra: true },
  ])
    assert.throws(() => parseCheckoutAttemptResult(value))
})
test("domain: facade/repository boundaries contain no Store/trial/projection mutation or public endpoint", async () => {
  const base = new URL("../../lib/billing/", import.meta.url)
  const facade = await readFile(
    new URL("subscription-checkout.ts", base),
    "utf8"
  )
  const internal = await readFile(
    new URL("subscription-checkout.internal.ts", base),
    "utf8"
  )
  const repository = await readFile(
    new URL("subscription-checkout.repository.ts", base),
    "utf8"
  )
  assert.match(facade, /await auth\(\)/)
  assert.match(facade, /org:admin/)
  assert.match(repository, /createServerSupabaseClient\(\)/)
  assert.match(repository, /eq\("clerk_organization_id", clerkOrganizationId\)/)
  assert.doesNotMatch(
    facade + internal,
    /supabase\/admin|ensureActiveOrganization|\.from\("stores"\)|billing_trial_grants|apply_stripe_subscription_projection|use server/
  )
  assert.doesNotMatch(
    repository,
    /\.insert\(|\.update\(|\.delete\(|billing_trial_grants|\.from\("stores"\)/
  )
  assert.match(repository, /createAdminSupabaseClient/)
})
