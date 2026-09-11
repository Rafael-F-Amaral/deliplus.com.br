import "../dashboard-overview/runtime.mjs"
import assert from "node:assert/strict"
import { test } from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const { default: DashboardPage } = await import("../../app/dashboard/page.tsx")
const { BillingFeedback } =
  await import("../../app/dashboard/billing-feedback.tsx")

for (const source of ["none", "trial", "paid_subscription"]) {
  for (const marker of ["billingSuccess", "billingPending", "normal"]) {
    test(`${marker} with ${source} preserves Overview authority`, async () => {
      globalThis.__dashboardUiTest = {
        overviewCalls: [],
        overviewResult: {
          status: "success",
          overview: {
            organization: { id: "tenant" },
            stores: { total: 1, active: 1 },
            entitlement:
              source === "none"
                ? { entitled: false, reason: "no_entitlement" }
                : {
                    entitled: true,
                    source,
                    planCode: "essential",
                    maxStores: 1,
                    validUntil: new Date("2026-09-25T12:00:00Z"),
                  },
          },
        },
      }
      const html = renderToStaticMarkup(
        await DashboardPage({
          searchParams: Promise.resolve({ [marker]: "1" }),
        })
      )
      if (marker === "normal")
        assert.doesNotMatch(html, /Assinatura ativada|Estamos confirmando/)
      else if (source === "paid_subscription")
        assert.match(html, /Assinatura ativada com sucesso/)
      else {
        assert.match(html, /Estamos confirmando sua assinatura/)
        assert.doesNotMatch(html, /Assinatura ativada|Plano atual|>Ativo</)
      }
      assert.deepEqual(globalThis.__dashboardUiTest.overviewCalls, [[]])
    })
  }
}

test("confirmed feedback consumes only billing markers, expires and cleans up on unmount", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const historyState = { preserved: true }
  const replacements = []
  const previousWindow = globalThis.window
  globalThis.window = {
    location: {
      href: "https://example.test/dashboard?billingSuccess=1&billingPending=1&storePublished=1#stores",
    },
    history: {
      state: historyState,
      replaceState(...args) {
        replacements.push(args)
      },
    },
  }
  t.after(() => {
    globalThis.window = previousWindow
  })
  const internals =
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
  const previous = internals.H
  let cleanup
  const updates = []
  internals.H = {
    useState: () => [true, (value) => updates.push(value)],
    useEffect(effect) {
      cleanup = effect()
    },
  }
  try {
    BillingFeedback({ confirmed: true })
  } finally {
    internals.H = previous
  }
  assert.equal(replacements[0][0], historyState)
  assert.equal(
    String(replacements[0][2]),
    "https://example.test/dashboard?storePublished=1#stores"
  )
  t.mock.timers.tick(6_000)
  assert.deepEqual(updates, [false])
  cleanup()
  t.mock.timers.tick(60_000)
  assert.equal(updates.length, 1)

  // A fresh mount that navigates away before expiry must not update state later.
  internals.H = {
    useState: () => [true, () => assert.fail("state update after unmount")],
    useEffect(effect) {
      cleanup = effect()
    },
  }
  try {
    BillingFeedback({ confirmed: true })
  } finally {
    internals.H = previous
  }
  cleanup()
  t.mock.timers.tick(60_000)
})
