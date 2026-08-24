import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { createAdminSupabaseClient } from "../../lib/supabase/admin.ts"
import { createEnsureActiveOrganization } from "../../lib/organizations/ensure-active-organization.internal.ts"

const adminAuth = {
  userId: "user_admin",
  orgId: "org_active",
  has: ({ role }) => role === "org:admin",
}

function createTestOperation(authState, ensureOrganization) {
  return createEnsureActiveOrganization({
    getAuth: async () => authState,
    ensureOrganization,
  })
}

test("unauthenticated users cannot provision", async () => {
  let writes = 0
  const ensureActiveOrganization = createTestOperation(
    { ...adminAuth, userId: null },
    async () => {
      writes += 1
      throw new Error("must not be called")
    },
  )

  assert.deepEqual(await ensureActiveOrganization(), {
    status: "unauthenticated",
  })
  assert.equal(writes, 0)
})

test("users without an active Organization cannot provision", async () => {
  let writes = 0
  const ensureActiveOrganization = createTestOperation(
    { ...adminAuth, orgId: null },
    async () => {
      writes += 1
      throw new Error("must not be called")
    },
  )

  assert.deepEqual(await ensureActiveOrganization(), {
    status: "no_active_organization",
  })
  assert.equal(writes, 0)
})

test("Organization members cannot provision", async () => {
  let writes = 0
  const ensureActiveOrganization = createTestOperation(
    { ...adminAuth, has: () => false },
    async () => {
      writes += 1
      throw new Error("must not be called")
    },
  )

  assert.deepEqual(await ensureActiveOrganization(), { status: "forbidden" })
  assert.equal(writes, 0)
})

test("Organization admins provision the verified active tenant", async () => {
  const requestedOrganizationIds = []
  const ensureActiveOrganization = createTestOperation(
    adminAuth,
    async (clerkOrganizationId) => {
      requestedOrganizationIds.push(clerkOrganizationId)

      return {
        id: "10000000-0000-0000-0000-000000000001",
        clerkOrganizationId,
      }
    },
  )

  assert.deepEqual(await ensureActiveOrganization(), {
    status: "ready",
    organization: {
      id: "10000000-0000-0000-0000-000000000001",
      clerkOrganizationId: "org_active",
    },
  })
  assert.deepEqual(requestedOrganizationIds, ["org_active"])
})

test("retries return the same Organization", async () => {
  const existingOrganization = {
    id: "10000000-0000-0000-0000-000000000001",
    clerkOrganizationId: "org_active",
  }
  let inserts = 0
  let storedOrganization

  const ensureActiveOrganization = createTestOperation(
    adminAuth,
    async (clerkOrganizationId) => {
      if (!storedOrganization) {
        inserts += 1
        storedOrganization = {
          ...existingOrganization,
          clerkOrganizationId,
        }
      }

      return storedOrganization
    },
  )

  const first = await ensureActiveOrganization()
  const retry = await ensureActiveOrganization()

  assert.deepEqual(first, retry)
  assert.equal(inserts, 1)
})

test("concurrent calls converge to the same Organization", async () => {
  let storedOrganization
  let inserts = 0
  const ensureActiveOrganization = createTestOperation(
    adminAuth,
    async (clerkOrganizationId) => {
      await Promise.resolve()

      if (!storedOrganization) {
        inserts += 1
        storedOrganization = {
          id: "10000000-0000-0000-0000-000000000001",
          clerkOrganizationId,
        }
      }

      return storedOrganization
    },
  )

  const [first, second] = await Promise.all([
    ensureActiveOrganization(),
    ensureActiveOrganization(),
  ])

  assert.deepEqual(first, second)
  assert.equal(inserts, 1)
})

test("privileged database failures are converted to a safe result", async () => {
  const ensureActiveOrganization = createTestOperation(adminAuth, async () => {
    throw new Error("raw privileged database detail")
  })

  assert.deepEqual(await ensureActiveOrganization(), {
    status: "provisioning_failed",
  })
})

test("the admin client fails safely when its environment is missing", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousSecret = process.env.SUPABASE_SECRET_KEY

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  delete process.env.SUPABASE_SECRET_KEY

  try {
    assert.throws(
      () => createAdminSupabaseClient(),
      /Missing required Supabase admin environment variables/,
    )
  } finally {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    }

    if (previousSecret === undefined) {
      delete process.env.SUPABASE_SECRET_KEY
    } else {
      process.env.SUPABASE_SECRET_KEY = previousSecret
    }
  }
})

test("the privileged and normal client boundaries remain structurally separate", async () => {
  const adminSource = await readFile(
    new URL("../../lib/supabase/admin.ts", import.meta.url),
    "utf8",
  )
  const normalSource = await readFile(
    new URL("../../lib/supabase/server.ts", import.meta.url),
    "utf8",
  )

  assert.match(adminSource, /import "server-only"/)
  assert.match(adminSource, /process\.env\.SUPABASE_SECRET_KEY/)
  assert.doesNotMatch(adminSource, /export\s+.*SUPABASE_SECRET_KEY/)
  assert.doesNotMatch(adminSource, /accessToken\s*\(/)
  assert.match(adminSource, /autoRefreshToken:\s*false/)
  assert.match(adminSource, /persistSession:\s*false/)
  assert.match(adminSource, /detectSessionInUrl:\s*false/)

  assert.match(normalSource, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/)
  assert.match(normalSource, /accessToken\s*\(/)
  assert.doesNotMatch(normalSource, /SUPABASE_SECRET_KEY/)
})

test("provisioning uses conflict-ignore before selecting the verified tenant", async () => {
  const source = await readFile(
    new URL(
      "../../lib/organizations/ensure-active-organization.ts",
      import.meta.url,
    ),
    "utf8",
  )

  assert.match(source, /export async function ensureActiveOrganization\(\)/)
  assert.match(source, /await auth\(\)/)
  assert.match(source, /onConflict:\s*"clerk_organization_id"/)
  assert.match(source, /ignoreDuplicates:\s*true/)
  assert.doesNotMatch(source, /\.update\s*\(/)
  assert.ok(source.indexOf(".upsert(") < source.indexOf(".select("))
})
