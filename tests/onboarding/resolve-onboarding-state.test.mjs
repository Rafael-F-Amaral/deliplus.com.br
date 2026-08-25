import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  createResolveOnboardingState,
  OnboardingStateResolutionError,
} from "../../lib/onboarding/resolve-onboarding-state.internal.ts"

const activeOrganizationId = "10000000-0000-0000-0000-000000000001"

const adminAuth = {
  userId: "user_admin",
  orgId: "org_active",
  has: ({ role }) => role === "org:admin",
}

const memberAuth = {
  userId: "user_member",
  orgId: "org_active",
  has: () => false,
}

function createTestResolver(authState, findOrganization) {
  return createResolveOnboardingState({
    getAuth: async () => authState,
    findOrganization,
  })
}

test("unauthenticated requests do not query Supabase", async () => {
  let reads = 0
  const resolveOnboardingState = createTestResolver(
    { ...adminAuth, userId: null },
    async () => {
      reads += 1
      throw new Error("must not be called")
    }
  )

  assert.deepEqual(await resolveOnboardingState(), {
    status: "unauthenticated",
  })
  assert.equal(reads, 0)
})

test("requests without an active Organization do not query Supabase", async () => {
  let reads = 0
  const resolveOnboardingState = createTestResolver(
    { ...adminAuth, orgId: null },
    async () => {
      reads += 1
      throw new Error("must not be called")
    }
  )

  assert.deepEqual(await resolveOnboardingState(), {
    status: "no_active_organization",
  })
  assert.equal(reads, 0)
})

test("an admin can provision when the active Organization is missing", async () => {
  const requestedOrganizationIds = []
  const resolveOnboardingState = createTestResolver(
    adminAuth,
    async (clerkOrganizationId) => {
      requestedOrganizationIds.push(clerkOrganizationId)
      return { data: null, error: null }
    }
  )

  assert.deepEqual(await resolveOnboardingState(), {
    status: "organization_not_provisioned",
    canProvision: true,
  })
  assert.deepEqual(requestedOrganizationIds, ["org_active"])
})

test("a member cannot provision when the active Organization is missing", async () => {
  const resolveOnboardingState = createTestResolver(memberAuth, async () => ({
    data: null,
    error: null,
  }))

  assert.deepEqual(await resolveOnboardingState(), {
    status: "organization_not_provisioned",
    canProvision: false,
  })
})

test("an existing Organization resolves for admins and members", async (t) => {
  for (const [role, authState] of [
    ["admin", adminAuth],
    ["member", memberAuth],
  ]) {
    await t.test(role, async () => {
      const resolveOnboardingState = createTestResolver(
        authState,
        async () => ({
          data: { id: activeOrganizationId },
          error: null,
        })
      )

      assert.deepEqual(await resolveOnboardingState(), {
        status: "organization_provisioned",
        organizationId: activeOrganizationId,
      })
    })
  }
})

test("Supabase errors become a safe resolution error", async () => {
  const databaseError = new Error("raw PostgREST database detail")
  const resolveOnboardingState = createTestResolver(adminAuth, async () => ({
    data: null,
    error: databaseError,
  }))

  await assert.rejects(resolveOnboardingState, (error) => {
    assert.ok(error instanceof OnboardingStateResolutionError)
    assert.equal(error.name, "OnboardingStateResolutionError")
    assert.equal(error.message, "Unable to resolve onboarding state")
    assert.doesNotMatch(error.message, /raw PostgREST database detail/)
    assert.equal(error.cause, databaseError)
    return true
  })
})

test("thrown lookup failures become a safe resolution error", async () => {
  const databaseError = new Error("raw network detail")
  const resolveOnboardingState = createTestResolver(adminAuth, async () => {
    throw databaseError
  })

  await assert.rejects(resolveOnboardingState, (error) => {
    assert.ok(error instanceof OnboardingStateResolutionError)
    assert.equal(error.message, "Unable to resolve onboarding state")
    assert.equal(error.cause, databaseError)
    return true
  })
})

test("callers cannot choose the tenant through an argument", async () => {
  const requestedOrganizationIds = []
  const resolveOnboardingState = createTestResolver(
    adminAuth,
    async (clerkOrganizationId) => {
      requestedOrganizationIds.push(clerkOrganizationId)
      return { data: null, error: null }
    }
  )

  assert.equal(resolveOnboardingState.length, 0)
  await resolveOnboardingState("org_attacker_controlled")
  assert.deepEqual(requestedOrganizationIds, ["org_active"])
})

test("the public resolver preserves the approved read-only boundaries", async () => {
  const source = await readFile(
    new URL(
      "../../lib/onboarding/resolve-onboarding-state.ts",
      import.meta.url
    ),
    "utf8"
  )

  assert.match(source, /import "server-only"/)
  assert.match(source, /await auth\(\)/)
  assert.match(source, /createServerSupabaseClient\(\)/)
  assert.match(source, /\.from\("organizations"\)/)
  assert.match(source, /\.select\("id"\)/)
  assert.match(source, /\.eq\("clerk_organization_id", clerkOrganizationId\)/)
  assert.match(source, /\.maybeSingle\(\)/)
  assert.match(source, /export async function resolveOnboardingState\(\)/)

  assert.doesNotMatch(source, /supabase\/admin/)
  assert.doesNotMatch(source, /SUPABASE_SECRET_KEY/)
  assert.doesNotMatch(source, /\.(insert|upsert|update|delete|rpc)\s*\(/)
  assert.doesNotMatch(
    source,
    /\.from\(["'](stores|store_memberships|subscriptions|billing)/
  )
  assert.doesNotMatch(source, /["']use server["']/)
})
