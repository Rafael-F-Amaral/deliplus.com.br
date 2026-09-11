import "./runtime.mjs"
import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { readFile } from "node:fs/promises"
import { renderToStaticMarkup } from "react-dom/server"

const { startCheckout } = await import("../../app/dashboard/billing/actions.ts")
const { default: BillingPage } =
  await import("../../app/dashboard/billing/page.tsx")
const { default: SuccessPage } =
  await import("../../app/dashboard/billing/success/page.tsx")
const { checkoutMessages } =
  await import("../../app/dashboard/billing/checkout-feedback.ts")
const { readBillingPageState } =
  await import("../../app/dashboard/billing/billing-state.ts")
const render = async (page) => renderToStaticMarkup(await page())
const form = (plan) => {
  const data = new FormData()
  if (plan !== undefined) data.append("planCode", plan)
  return data
}
let state
beforeEach(() => {
  state = globalThis.__billingUiTest = {
    auth: {
      userId: "user_test",
      orgId: "org_test",
      orgSlug: "pizzaria-teste",
      has: ({ role }) => role === "org:admin",
    },
    onboarding: {
      status: "organization_provisioned",
      organizationId: "10000000-0000-0000-0000-000000000001",
    },
    entitlement: { entitled: false, reason: "no_entitlement" },
    checkout: {
      status: "checkout_ready",
      checkoutUrl: "https://checkout.stripe.com/c/pay/synthetic",
    },
    provisioning: {
      status: "ready",
      organization: {
        id: "10000000-0000-0000-0000-000000000001",
        clerkOrganizationId: "org_test",
      },
    },
    calls: [],
    reads: [],
    onboardingReads: [],
    provisions: [],
  }
})

for (const plan of ["essential", "multi_2", "multi_3"]) {
  test(`action: ${plan} passes only PlanCode and preserves redirect control flow`, async () => {
    await assert.rejects(
      startCheckout({ kind: "idle" }, form(plan)),
      (error) => error.redirectUrl === state.checkout.checkoutUrl
    )
    assert.deepEqual(state.calls, [[plan]])
    assert.equal(state.reads.length, 0)
  })
}
for (const plan of [
  undefined,
  "",
  "Essencial",
  "multi_4",
  "price_fake",
  " essential ",
  new Blob(["essential"]),
]) {
  test(`action: invalid input ${String(plan)} never invokes domain`, async () => {
    assert.deepEqual(await startCheckout({ kind: "idle" }, form(plan)), {
      kind: "business",
      status: "invalid_plan",
    })
    assert.equal(state.calls.length, 0)
  })
}
test("action: duplicated PlanCode and non-FormData are rejected", async () => {
  const data = form("essential")
  data.append("planCode", "multi_2")
  for (const value of [data, null, { planCode: "essential" }]) {
    assert.equal(
      (await startCheckout({ kind: "idle" }, value)).status,
      "invalid_plan"
    )
  }
  assert.equal(state.calls.length, 0)
})
test("action: forged authority and previous state never reach the domain or redirect", async () => {
  const data = form("essential")
  for (const key of [
    "organizationId",
    "stripePriceId",
    "stripeCustomerId",
    "amount",
    "currency",
    "interval",
    "quantity",
    "checkoutUrl",
    "successUrl",
  ])
    data.append(key, "https://untrusted.example/authority")
  await assert.rejects(
    startCheckout(
      { kind: "checkout_ready", checkoutUrl: "https://untrusted.example" },
      data
    ),
    (error) => error.redirectUrl === state.checkout.checkoutUrl
  )
  assert.deepEqual(state.calls, [["essential"]])
})
for (const status of Object.keys(checkoutMessages)) {
  test(`action: safe business outcome ${status}`, async () => {
    state.checkout = { status, internalId: "must-not-leak" }
    assert.deepEqual(await startCheckout({ kind: "idle" }, form("essential")), {
      kind: "business",
      status,
    })
    assert.deepEqual(state.calls, [["essential"]])
  })
}
test("action: infrastructure errors are sanitized and not a business outcome", async () => {
  state.checkoutError = new Error("Synthetic SQL/provider/private details", {
    cause: new Error("private"),
  })
  assert.deepEqual(await startCheckout({ kind: "idle" }, form("essential")), {
    kind: "error",
  })
})

test("render: three cards have approved names, monthly prices, capacity and submit selectors", async () => {
  const html = await render(BillingPage)
  assert.doesNotMatch(html, /Configurar organização/u)
  assert.equal((html.match(/data-slot="card"/gu) ?? []).length, 3)
  for (const text of [
    "Essencial",
    "Duo",
    "Trio",
    "99,90",
    "189,90",
    "279,90",
    "1 Store",
    "Até 2 Stores",
    "Até 3 Stores",
    "pizzaria-teste",
  ])
    assert.ok(html.includes(text), text)
  for (const code of ["essential", "multi_2", "multi_3"])
    assert.ok(html.includes(`value="${code}"`))
  assert.equal((html.match(/\/mês/gu) ?? []).length, 3)
  assert.equal((html.match(/name="planCode"/gu) ?? []).length, 3)
  assert.doesNotMatch(
    html,
    /name="(?:organizationId|amount|currency|interval|quantity|stripePriceId)"/u
  )
  assert.equal(state.calls.length, 0)
  assert.deepEqual(state.reads, [[]])
  assert.deepEqual(state.onboardingReads, [[]])
})
test("render: valid trial presents its server-derived end date and allows Checkout", async () => {
  state.entitlement = {
    entitled: true,
    source: "trial",
    planCode: "essential",
    maxStores: 1,
    validUntil: new Date("2026-09-20T15:00:00Z"),
  }
  const html = await render(BillingPage)
  assert.match(html, /período de teste do plano Essencial/u)
  assert.match(html, /20 de setembro de 2026/u)
  assert.doesNotMatch(html, /<fieldset[^>]*disabled/u)
  assert.equal(state.calls.length, 0)
})
test("render: paid subscription blocks acquisition without a nonexistent Portal link", async () => {
  state.entitlement = {
    entitled: true,
    source: "paid_subscription",
    planCode: "multi_2",
    maxStores: 2,
  }
  const html = await render(BillingPage)
  assert.match(html, /já possui uma assinatura/u)
  assert.match(html, /<fieldset[^>]*disabled/u)
  assert.equal((html.match(/>Assinatura existente</gu) ?? []).length, 3)
  assert.doesNotMatch(html, /href="[^"]*portal/iu)
  assert.equal(state.calls.length, 0)
})
test("render: member can view billing but cannot submit", async () => {
  state.auth.has = () => false
  const html = await render(BillingPage)
  assert.match(html, /Somente um administrador/u)
  assert.match(html, /<fieldset[^>]*disabled/u)
})

for (const canProvision of [true, false]) {
  test(`render: unprovisioned ${canProvision ? "admin" : "member"} redirects to onboarding without mutation`, async () => {
    state.onboarding = { status: "organization_not_provisioned", canProvision }
    state.auth.has = () => canProvision
    await assert.rejects(
      BillingPage,
      (error) => error.redirectUrl === "/onboarding"
    )
    assert.deepEqual(state.provisions, [])
    assert.deepEqual(state.calls, [])
    assert.deepEqual(state.reads, [])
    assert.deepEqual(state.onboardingReads, [[]])
  })
}

for (const kind of [
  "unauthenticated",
  "no_active_organization",
  "unavailable",
]) {
  test(`render: ${kind} is distinct and does not expose infrastructure`, async () => {
    if (kind === "unavailable")
      state.onboardingError = new Error("sensitive PostgREST")
    else state.onboarding = { status: kind }
    const html = await render(BillingPage)
    assert.ok(
      html.includes(
        kind === "unavailable" ? "Status indisponível" : checkoutMessages[kind]
      )
    )
    assert.match(html, /<fieldset[^>]*disabled/u)
    assert.doesNotMatch(html, /sensitive|PostgREST/u)
    assert.equal(state.reads.length, 0)
  })
}
test("read: auth failure becomes status unavailable, never absence", async () => {
  state.authError = new Error("synthetic auth failure")
  assert.deepEqual(await readBillingPageState(), { kind: "unavailable" })
  assert.equal(state.reads.length, 0)
  assert.deepEqual(state.onboardingReads, [[]])
})
test("read: each request resolves fresh context without browser tenant authority", async () => {
  assert.equal(
    (await readBillingPageState()).organizationName,
    "pizzaria-teste"
  )
  state.auth.orgSlug = "outra-operacao"
  assert.equal(
    (await readBillingPageState()).organizationName,
    "outra-operacao"
  )
  assert.deepEqual(state.reads, [[], []])
  assert.deepEqual(state.onboardingReads, [[], []])
})
for (const source of ["none", "trial", "paid_subscription"]) {
  test(`success render: ${source} uses only local entitlement, never navigation as payment proof`, async () => {
    if (source !== "none")
      state.entitlement = {
        entitled: true,
        source,
        planCode: "essential",
        maxStores: 1,
        validUntil: new Date("2026-09-20T15:00:00Z"),
      }
    if (source === "paid_subscription") {
      await assert.rejects(
        SuccessPage,
        (error) => error.redirectUrl === "/dashboard?billingSuccess=1"
      )
    } else {
      const html = await render(SuccessPage)
      assert.doesNotMatch(html, /Assinatura confirmada|Pagamento recebido/u)
      assert.match(html, /Confirmando sua assinatura/u)
      assert.match(html, /direcionado automaticamente/u)
      assert.doesNotMatch(html, /Atualizar status/u)
      if (source === "trial")
        assert.match(html, /não é uma confirmação da assinatura paga/u)
    }
    assert.equal(state.calls.length, 0)
    assert.deepEqual(state.reads, [[]])
    assert.deepEqual(state.onboardingReads, [[]])
  })
}
test("success render: provisioning stays outside the payment-return surface", async () => {
  state.onboarding = {
    status: "organization_not_provisioned",
    canProvision: true,
  }

  const html = await render(SuccessPage)

  assert.doesNotMatch(html, />Configurar organização</u)
  assert.equal(state.provisions.length, 0)
  assert.equal(state.calls.length, 0)
})
test("success render: resolver failure is unavailable, not processing or confirmed", async () => {
  state.entitlementError = new Error("Synthetic DB secret")
  const html = await render(SuccessPage)
  assert.match(html, /Status indisponível/u)
  assert.doesNotMatch(
    html,
    /Estamos confirmando|Assinatura confirmada|Synthetic DB secret/u
  )
})
test("source boundaries: only Action invokes Checkout; no DB, provider or timer logic in UI", async () => {
  const root = new URL("../../app/dashboard/billing/", import.meta.url)
  const names = [
    "actions.ts",
    "page.tsx",
    "success/page.tsx",
    "billing-state.ts",
    "billing-status.tsx",
    "checkout-feedback.ts",
    "checkout-form.tsx",
  ]
  for (const name of names) {
    const source = await readFile(new URL(name, root), "utf8")
    assert.doesNotMatch(
      source,
      /lib\/stripe|supabase|\.rpc\(|\.from\(|setInterval|setTimeout|session_id|window\.location|process\.env/u,
      name
    )
    assert.doesNotMatch(
      source,
      /ensureActiveOrganization|OrganizationProvisioningForm|Configurar organização/u,
      name
    )
    if (name !== "actions.ts")
      assert.doesNotMatch(source, /createSubscriptionCheckoutSession\(/u, name)
  }
  const action = await readFile(new URL("actions.ts", root), "utf8")
  assert.match(action, /^"use server"/u)
  const formSource = await readFile(new URL("checkout-form.tsx", root), "utf8")
  assert.match(formSource, /useActionState/u)
  assert.match(formSource, /useFormStatus/u)
  assert.match(formSource, /disabled=\{disabled \|\| pending/u)
  assert.match(formSource, /aria-live="polite"/u)
})
