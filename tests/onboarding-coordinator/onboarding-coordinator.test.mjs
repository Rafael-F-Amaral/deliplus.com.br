import "./runtime.mjs"

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { beforeEach, test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

const { provisionOrganizationForOnboarding } =
  await import("../../app/onboarding/actions.ts")
const { shouldStartAutomaticProvisioning } =
  await import("../../app/onboarding/automatic-provisioning.internal.ts")
const { readOnboardingCoordinatorState } =
  await import("../../app/onboarding/onboarding-state.ts")
const { default: OnboardingPage } =
  await import("../../app/onboarding/page.tsx")
const { default: NewStorePage } =
  await import("../../app/dashboard/stores/new/page.tsx")

const render = async (page) => renderToStaticMarkup(await page())
let state

beforeEach(() => {
  state = globalThis.__onboardingCoordinatorTest = {
    onboarding: {
      status: "organization_provisioned",
      organizationId: "10000000-0000-0000-0000-000000000001",
    },
    stores: { status: "success", stores: [] },
    provisioning: {
      status: "ready",
      organization: {
        id: "10000000-0000-0000-0000-000000000001",
        clerkOrganizationId: "org_test",
      },
    },
    onboardingReads: [],
    storeReads: [],
    provisions: [],
  }
})

test("unauthenticated requests go to sign-in and never read Stores", async () => {
  state.onboarding = { status: "unauthenticated" }

  await assert.rejects(
    OnboardingPage,
    (error) => error.redirectUrl === "/sign-in?redirect_url=%2Fonboarding"
  )
  assert.deepEqual(state.storeReads, [])
  assert.deepEqual(state.provisions, [])
})

test("no active Organization renders Clerk creation/selection with stable returns", async () => {
  state.onboarding = { status: "no_active_organization" }

  const html = await render(OnboardingPage)

  assert.match(html, /data-organization-list="true"/u)
  assert.match(html, /data-hide-personal="true"/u)
  assert.match(html, /data-after-create="\/onboarding"/u)
  assert.match(html, /data-after-select="\/onboarding"/u)
  assert.deepEqual(state.storeReads, [])
  assert.deepEqual(state.provisions, [])
})

test("an unprovisioned admin renders the automatic client coordinator without a render mutation", async () => {
  state.onboarding = {
    status: "organization_not_provisioned",
    canProvision: true,
  }

  const html = await render(OnboardingPage)

  assert.match(html, /Preparando seu espaço no Deli Plus/u)
  assert.deepEqual(state.storeReads, [])
  assert.deepEqual(state.provisions, [])
})

test("an unprovisioned member gets a safe admin-required state", async () => {
  state.onboarding = {
    status: "organization_not_provisioned",
    canProvision: false,
  }

  const html = await render(OnboardingPage)

  assert.match(html, /Aguardando um administrador/u)
  assert.doesNotMatch(html, /Preparando seu espaço no Deli Plus/u)
  assert.deepEqual(state.storeReads, [])
  assert.deepEqual(state.provisions, [])
})

test("a provisioned Organization with zero Stores goes to first-store setup", async () => {
  await assert.rejects(
    OnboardingPage,
    (error) => error.redirectUrl === "/dashboard/stores/new"
  )
  assert.deepEqual(state.storeReads, [[]])
})

test("a provisioned Organization with Stores goes to the dashboard", async () => {
  state.stores = {
    status: "success",
    stores: [{ id: "20000000-0000-0000-0000-000000000001" }],
  }

  await assert.rejects(
    OnboardingPage,
    (error) => error.redirectUrl === "/dashboard"
  )
  assert.deepEqual(state.storeReads, [[]])
})

test("a provisioned member is sent to the dashboard without gaining Store setup authority", async () => {
  state.stores = { status: "forbidden" }

  assert.deepEqual(await readOnboardingCoordinatorState(), {
    kind: "redirect",
    destination: "/dashboard",
  })
  assert.deepEqual(state.storeReads, [[]])
})

test("resolution and Store errors become a safe unavailable state", async (t) => {
  await t.test("onboarding resolver failure", async () => {
    state.onboardingError = new Error("private resolver details")
    assert.deepEqual(await readOnboardingCoordinatorState(), {
      kind: "unavailable",
    })
    assert.deepEqual(state.storeReads, [])
  })

  await t.test("Store boundary failure", async () => {
    state.storeError = new Error("private database details")
    assert.deepEqual(await readOnboardingCoordinatorState(), {
      kind: "unavailable",
    })
  })
})

test("the provisioning Action ignores browser authority and redirects only after success", async () => {
  const data = new FormData()
  data.append("organizationId", "attacker-controlled")
  data.append("clerkOrganizationId", "org_attacker")
  data.append("role", "org:admin")

  await assert.rejects(
    provisionOrganizationForOnboarding({ kind: "error" }, data),
    (error) => error.redirectUrl === "/onboarding"
  )
  assert.deepEqual(state.provisions, [[]])
})

for (const status of [
  "unauthenticated",
  "no_active_organization",
  "forbidden",
  "provisioning_failed",
]) {
  test(`the provisioning Action preserves safe business outcome ${status}`, async () => {
    state.provisioning = { status, internalDetails: "must not leak" }

    assert.deepEqual(
      await provisionOrganizationForOnboarding(
        { kind: "idle" },
        new FormData()
      ),
      { kind: "business", status }
    )
    assert.deepEqual(state.provisions, [[]])
  })
}

test("the provisioning Action sanitizes unexpected errors", async () => {
  state.provisioningError = new Error(
    "private configuration or database details"
  )

  assert.deepEqual(
    await provisionOrganizationForOnboarding({ kind: "idle" }, new FormData()),
    { kind: "error" }
  )
})

test("retry remains safe and delegates idempotency to ensureActiveOrganization", async () => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await assert.rejects(
      provisionOrganizationForOnboarding({ kind: "error" }, new FormData()),
      (error) => error.redirectUrl === "/onboarding"
    )
  }

  assert.deepEqual(state.provisions, [[], []])
})

test("the client auto-submits only once from its initial state", () => {
  assert.equal(shouldStartAutomaticProvisioning(false, { kind: "idle" }), true)
  assert.equal(shouldStartAutomaticProvisioning(true, { kind: "idle" }), false)
  assert.equal(
    shouldStartAutomaticProvisioning(false, {
      kind: "business",
      status: "provisioning_failed",
    }),
    false
  )
  assert.equal(
    shouldStartAutomaticProvisioning(false, { kind: "error" }),
    false
  )
})

test("auth entry points and signed-in navigation converge on /onboarding", async () => {
  const [home, signIn, signUp] = await Promise.all([
    readFile(new URL("../../app/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../../app/sign-in/[[...sign-in]]/page.tsx", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../../app/sign-up/[[...sign-up]]/page.tsx", import.meta.url),
      "utf8"
    ),
  ])

  assert.match(signUp, /<SignUp forceRedirectUrl="\/onboarding" \/>/u)
  assert.match(signIn, /<SignIn fallbackRedirectUrl="\/onboarding" \/>/u)
  assert.match(home, /<SignUpButton forceRedirectUrl="\/onboarding">/u)
  assert.match(home, /<SignInButton fallbackRedirectUrl="\/onboarding">/u)
  assert.match(home, /<Link href="\/onboarding"/u)
  assert.match(home, /afterCreateOrganizationUrl="\/onboarding"/u)
  assert.match(home, /afterSelectOrganizationUrl="\/onboarding"/u)
})

test("coordinator boundaries prohibit GET mutations, direct data access, and trial activation", async () => {
  const [page, coordinatorState, action, client] = await Promise.all([
    readFile(new URL("../../app/onboarding/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../../app/onboarding/onboarding-state.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../../app/onboarding/actions.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL(
        "../../app/onboarding/automatic-provisioning.tsx",
        import.meta.url
      ),
      "utf8"
    ),
  ])

  assert.doesNotMatch(
    page,
    /ensureActiveOrganization|createAdminSupabaseClient/u
  )
  assert.doesNotMatch(coordinatorState, /ensureActiveOrganization|\.from\(/u)
  assert.match(coordinatorState, /await listStoresForSetup\(\)/u)
  assert.match(action, /await ensureActiveOrganization\(\)/u)
  assert.doesNotMatch(
    action,
    /formData\.get|\.from\(|\.rpc\(|SUPABASE_SECRET_KEY/u
  )
  assert.doesNotMatch(
    `${page}\n${coordinatorState}\n${action}\n${client}`,
    /activateFirstStoreWithInitialTrial|activateStoreWithinEntitlement|stripe/iu
  )
  assert.match(client, /const attempted = useRef\(false\)/u)
  assert.match(client, /attempted\.current = true/u)
})

test("the first-Store destination is presentational and does not start a trial", async () => {
  const html = await render(NewStorePage)
  const source = await readFile(
    new URL("../../app/dashboard/stores/new/page.tsx", import.meta.url),
    "utf8"
  )

  assert.match(html, /Crie sua primeira loja/u)
  assert.match(html, /Nenhum período de teste começa/u)
  assert.doesNotMatch(
    source,
    /use server|activateFirstStoreWithInitialTrial|\.from\(/u
  )
})
