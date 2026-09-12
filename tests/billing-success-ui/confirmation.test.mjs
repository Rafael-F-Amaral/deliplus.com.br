import "../billing-checkout-ui/runtime.mjs"
import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const { default: SuccessPage } =
  await import("../../app/dashboard/billing/success/page.tsx")
const { PendingConfirmation } =
  await import("../../app/dashboard/billing/success/pending-confirmation.tsx")
const { RefreshStatus } =
  await import("../../app/dashboard/billing/success/refresh-status.tsx")

test("manual status refresh re-reads the current route without navigation or writes", () => {
  let refreshes = 0
  state.router = {
    refresh() {
      refreshes++
    },
  }
  const button = RefreshStatus()
  button.props.onClick()
  assert.equal(refreshes, 1)
  assert.deepEqual(state.calls, [])
  assert.deepEqual(state.provisions, [])
})

let state
beforeEach(() => {
  state = globalThis.__billingUiTest = {
    onboarding: { status: "organization_provisioned" },
    auth: { orgSlug: "tenant", has: () => true },
    entitlement: { entitled: false, reason: "no_entitlement" },
    reads: [],
    onboardingReads: [],
    calls: [],
    provisions: [],
  }
})

function mountPolling(t, router) {
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] })
  state.router = router
  const internals =
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
  const previous = internals.H
  let cleanup
  internals.H = {
    useEffect(effect) {
      cleanup = effect()
    },
  }
  try {
    PendingConfirmation()
  } finally {
    internals.H = previous
  }
  t.after(() => cleanup())
  return () => cleanup()
}

test("initial paid local entitlement redirects immediately without Checkout or writes", async () => {
  state.entitlement = { entitled: true, source: "paid_subscription" }
  await assert.rejects(
    SuccessPage,
    (e) => e.redirectUrl === "/dashboard?billingSuccess=1"
  )
  assert.deepEqual(state.calls, [])
  assert.deepEqual(state.provisions, [])
  assert.deepEqual(state.reads, [[]])
})

for (const source of ["none", "trial"]) {
  test(`${source} renders pending and never confirms payment`, async () => {
    if (source === "trial") state.entitlement = { entitled: true, source }
    const html = renderToStaticMarkup(await SuccessPage())
    assert.match(html, /Confirmando sua assinatura/)
    assert.doesNotMatch(html, /Assinatura ativada|pagamento foi concluído/i)
    assert.deepEqual(state.calls, [])
    assert.deepEqual(state.provisions, [])
  })
}

test("refresh resolves fresh local state and paid projection redirects", async (t) => {
  let refreshes = 0
  const cleanup = mountPolling(t, {
    refresh() {
      refreshes++
    },
    replace() {
      assert.fail("early timeout")
    },
  })
  await SuccessPage()
  t.mock.timers.tick(2_000)
  assert.equal(refreshes, 1)
  state.entitlement = { entitled: true, source: "paid_subscription" }
  await assert.rejects(
    SuccessPage,
    (e) => e.redirectUrl === "/dashboard?billingSuccess=1"
  )
  cleanup()
  t.mock.timers.tick(20_000)
  assert.equal(refreshes, 1)
  assert.equal(state.reads.length, 2)
})

test("polling waits two seconds, stays bounded and replaces with pending at twelve seconds", (t) => {
  let refreshes = 0
  const destinations = []
  mountPolling(t, {
    refresh() {
      refreshes++
    },
    replace(url) {
      destinations.push(url)
    },
  })
  t.mock.timers.tick(1_999)
  assert.equal(refreshes, 0)
  t.mock.timers.tick(1)
  assert.equal(refreshes, 1)
  for (let i = 0; i < 5; i++) t.mock.timers.tick(2_000)
  assert.deepEqual(destinations, ["/dashboard?billingPending=1"])
  const bounded = refreshes
  assert.ok(bounded <= 6)
  t.mock.timers.tick(60_000)
  assert.equal(refreshes, bounded)
  assert.equal(destinations.length, 1)
})

test("unmount/navigation cancels refresh and pending navigation timers", (t) => {
  const cleanup = mountPolling(t, {
    refresh() {
      assert.fail("refresh after unmount")
    },
    replace() {
      assert.fail("navigation after unmount")
    },
  })
  cleanup()
  t.mock.timers.tick(60_000)
})

for (const status of [
  "unauthenticated",
  "no_active_organization",
  "organization_not_provisioned",
]) {
  test(`${status} preserves business status and does not mount polling`, async () => {
    state.onboarding = { status, canProvision: true }
    const html = renderToStaticMarkup(await SuccessPage())
    assert.doesNotMatch(
      html,
      /direcionado automaticamente|Confirmando sua assinatura/
    )
    assert.deepEqual(state.reads, [])
    assert.deepEqual(state.provisions, [])
  })
}
