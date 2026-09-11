import "./runtime.mjs"

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { beforeEach, test } from "node:test"

import ReactDOMServer from "react-dom/server"

const { renderToStaticMarkup } = ReactDOMServer

const { default: DashboardPage } = await import("../../app/dashboard/page.tsx")
const { formatStoreLimit, formatTrialValidUntil, getTrialDaysRemaining } =
  await import("../../app/dashboard/dashboard-presentation.ts")

const organization = { id: "d1000000-0000-0000-0000-000000000001" }

function success(entitlement, { total = 1, active = 1 } = {}) {
  return {
    status: "success",
    overview: {
      organization,
      entitlement,
      stores: { scope: "accessible", total, active },
    },
  }
}

beforeEach(() => {
  globalThis.__dashboardUiTest = {
    overviewCalls: [],
    overviewResult: success({
      entitled: true,
      source: "paid_subscription",
      planCode: "essential",
      maxStores: 1,
    }),
  }
})

async function renderDashboard(searchParams = {}) {
  return renderToStaticMarkup(
    await DashboardPage({ searchParams: Promise.resolve(searchParams) })
  )
}

test("the exact post-publish marker shows transient success feedback", async () => {
  const successMarkup = await renderDashboard({ storePublished: "1" })
  const ordinaryMarkup = await renderDashboard()
  const untrustedMarkup = await renderDashboard({ storePublished: ["1"] })

  assert.match(successMarkup, /Loja publicada com sucesso\./)
  assert.doesNotMatch(ordinaryMarkup, /Loja publicada com sucesso\./)
  assert.doesNotMatch(untrustedMarkup, /Loja publicada com sucesso\./)
})

test("the success marker does not create or override dashboard state", async () => {
  globalThis.__dashboardUiTest.overviewResult = success(
    { entitled: false, reason: "no_entitlement" },
    { total: 0, active: 0 }
  )

  const markup = await renderDashboard({ storePublished: "1" })

  assert.match(markup, /Loja publicada com sucesso\./)
  assert.match(markup, /Nenhum plano está ativo no momento\./)
  assert.doesNotMatch(markup, /Plano atual|Teste Essencial|dias restantes/)
})

for (const [planCode, maxStores, label] of [
  ["essential", 1, "Essencial"],
  ["multi_2", 2, "Duo"],
  ["multi_3", 3, "Trio"],
]) {
  test(`paid ${label} renders paid state without trial copy`, async () => {
    globalThis.__dashboardUiTest.overviewResult = success({
      entitled: true,
      source: "paid_subscription",
      planCode,
      maxStores,
    })

    const markup = await renderDashboard()

    assert.match(markup, /Plano atual/)
    assert.match(markup, new RegExp(`>${label}<`))
    assert.match(markup, /Status/)
    assert.match(markup, />Ativo</)
    assert.match(markup, /Lojas ativas/)
    assert.match(markup, new RegExp(formatStoreLimit(maxStores)))
    assert.doesNotMatch(markup, /Teste|dias? restantes?|Válido até/)
  })
}

test("trial renders authoritative date, remaining days, active Stores, and Billing CTA", async () => {
  const validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
  globalThis.__dashboardUiTest.overviewResult = success({
    entitled: true,
    source: "trial",
    planCode: "essential",
    maxStores: 1,
    validUntil,
  })

  const markup = await renderDashboard()

  assert.match(markup, /Teste Essencial/)
  assert.match(markup, /15 dias restantes/)
  assert.match(markup, /Válido até/)
  assert.match(markup, new RegExp(formatTrialValidUntil(validUntil)))
  assert.match(markup, /Lojas ativas/)
  assert.match(markup, /href="\/dashboard\/billing"/)
  assert.match(markup, /Assinar agora/)
  assert.doesNotMatch(markup, /Plano atual/)
})

test("trial remaining days round partial days up and clamp expiration to zero", () => {
  const now = new Date("2026-09-11T12:00:00.000Z")

  assert.equal(
    getTrialDaysRemaining(new Date("2026-09-26T12:00:00.000Z"), now),
    15
  )
  assert.equal(
    getTrialDaysRemaining(new Date("2026-09-11T12:00:00.001Z"), now),
    1
  )
  assert.equal(
    getTrialDaysRemaining(new Date("2026-09-11T12:00:00.000Z"), now),
    0
  )
  assert.equal(
    getTrialDaysRemaining(new Date("2026-09-10T12:00:00.000Z"), now),
    0
  )
})

test("no entitlement and zero Stores directs setup without starting a trial", async () => {
  globalThis.__dashboardUiTest.overviewResult = success(
    { entitled: false, reason: "no_entitlement" },
    { total: 0, active: 0 }
  )

  const markup = await renderDashboard()

  assert.match(
    markup,
    /Configure e publique sua primeira loja para iniciar seus 15 dias grátis\./
  )
  assert.match(markup, /href="\/dashboard\/stores\/new"/)
  assert.match(markup, /Configurar primeira loja/)
  assert.doesNotMatch(markup, /dias restantes|Válido até|Assinar agora/)
})

test("accessible Store count is not presented as Organization capacity consumption", async () => {
  globalThis.__dashboardUiTest.overviewResult = success(
    {
      entitled: true,
      source: "paid_subscription",
      planCode: "multi_3",
      maxStores: 3,
    },
    { total: 1, active: 1 }
  )

  const markup = await renderDashboard()

  assert.match(markup, /Lojas ativas/)
  assert.match(markup, /Até 3 Stores/)
  assert.doesNotMatch(markup, /1 de 3|utilizad[ao]s?|disponíveis|restantes/iu)
})

test("dashboard calls only the zero-argument Overview boundary", async () => {
  await renderDashboard({ organizationId: "org_attacker", planCode: "multi_3" })

  assert.deepEqual(globalThis.__dashboardUiTest.overviewCalls, [[]])

  const source = await readFile(
    new URL("../../app/dashboard/page.tsx", import.meta.url),
    "utf8"
  )

  assert.match(source, /getDashboardOverview\(\)/)
  assert.doesNotMatch(source, /resolveOrganizationEntitlement|supabase|Stripe/)
  assert.doesNotMatch(source, /billing_trial_grants|billing_subscriptions/)
  assert.doesNotMatch(source, /\.from\s*\(|\.rpc\s*\(/)
})

test("dashboard routes unresolved identity states through existing onboarding paths", async (t) => {
  for (const [result, destination] of [
    [{ status: "unauthenticated" }, "/sign-in?redirect_url=%2Fdashboard"],
    [{ status: "no_active_organization" }, "/onboarding"],
    [
      { status: "organization_not_provisioned", canProvision: true },
      "/onboarding",
    ],
  ]) {
    await t.test(result.status, async () => {
      globalThis.__dashboardUiTest.overviewResult = result

      await assert.rejects(
        renderDashboard(),
        (error) => error.redirectUrl === destination
      )
    })
  }
})

test("unexpected Overview failures render safe unavailable feedback", async () => {
  globalThis.__dashboardUiTest.overviewError = new Error(
    "raw database and tenant detail"
  )

  const markup = await renderDashboard()

  assert.match(markup, /Status indisponível/)
  assert.doesNotMatch(markup, /raw database|tenant detail/)
})
