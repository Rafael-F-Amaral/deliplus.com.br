import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { createAdminSupabaseClient } from "../../lib/supabase/admin.ts"
import { createEnsureActiveOrganization } from "../../lib/organizations/ensure-active-organization.internal.ts"
import {
  createOrganizationProvisioningRepository,
  OrganizationProvisioningRepositoryError,
  safeOrganizationProvisioningDiagnostic,
} from "../../lib/organizations/organization-provisioning.repository.ts"

const adminAuth = {
  userId: "user_admin",
  orgId: "org_active",
  has: ({ role }) => role === "org:admin",
}

function createTestOperation(
  authState,
  ensureOrganization,
  reportProvisioningFailure
) {
  return createEnsureActiveOrganization({
    getAuth: async () => authState,
    ensureOrganization,
    reportProvisioningFailure,
  })
}

test("unauthenticated users cannot provision", async () => {
  let writes = 0
  const ensureActiveOrganization = createTestOperation(
    { ...adminAuth, userId: null },
    async () => {
      writes += 1
      throw new Error("must not be called")
    }
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
    }
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
    }
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
    }
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
    }
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
    }
  )

  const [first, second] = await Promise.all([
    ensureActiveOrganization(),
    ensureActiveOrganization(),
  ])

  assert.deepEqual(first, second)
  assert.equal(inserts, 1)
})

test("privileged database failures are converted to a safe result", async () => {
  const rawError = new Error("raw privileged database detail")
  const reported = []
  const ensureActiveOrganization = createTestOperation(
    adminAuth,
    async () => {
      throw rawError
    },
    (error) => reported.push(error)
  )

  assert.deepEqual(await ensureActiveOrganization(), {
    status: "provisioning_failed",
  })
  assert.deepEqual(reported, [rawError])
})

test("the trusted RPC result is normalized to the public Organization shape", async () => {
  const calls = []
  const repository = createOrganizationProvisioningRepository(() => ({
    rpc(name, args) {
      calls.push({ name, args })

      return {
        async single() {
          return {
            data: {
              id: "10000000-0000-4000-8000-000000000001",
              clerk_organization_id: "org_active",
            },
            error: null,
          }
        },
      }
    },
  }))

  assert.deepEqual(await repository.ensureOrganization("org_active"), {
    id: "10000000-0000-4000-8000-000000000001",
    clerkOrganizationId: "org_active",
  })
  assert.deepEqual(calls, [
    {
      name: "ensure_organization_projection",
      args: { p_clerk_organization_id: "org_active" },
    },
  ])
})

test("trusted RPC diagnostics expose only safe classification fields", async () => {
  const rawError = {
    code: "42501",
    message: "raw database detail with secret-value",
    details: "raw transport credential detail",
  }
  const repository = createOrganizationProvisioningRepository(() => ({
    rpc() {
      return {
        async single() {
          return { data: null, error: rawError }
        },
      }
    },
  }))

  await assert.rejects(repository.ensureOrganization("org_active"), (error) => {
    assert.ok(error instanceof OrganizationProvisioningRepositoryError)
    assert.equal(error.category, "database")
    assert.equal(error.stage, "trusted_rpc_result")
    assert.deepEqual(safeOrganizationProvisioningDiagnostic(error), {
      boundary: "ensure_organization_projection",
      category: "database",
      stage: "trusted_rpc_result",
      errorCode: "42501",
    })
    assert.doesNotMatch(
      JSON.stringify(safeOrganizationProvisioningDiagnostic(error)),
      /secret-value|credential detail|raw database detail/iu
    )
    return true
  })
})

test("configuration and malformed RPC responses remain distinguishable", async (t) => {
  await t.test("configuration", async () => {
    const repository = createOrganizationProvisioningRepository(() => {
      throw new Error("SUPABASE_SECRET_KEY raw value")
    })

    await assert.rejects(
      repository.ensureOrganization("org_active"),
      (error) => {
        assert.ok(error instanceof OrganizationProvisioningRepositoryError)
        assert.equal(error.category, "configuration")
        assert.equal(error.stage, "admin_client_creation")
        return true
      }
    )
  })

  await t.test("response invariant", async () => {
    const repository = createOrganizationProvisioningRepository(() => ({
      rpc() {
        return {
          async single() {
            return {
              data: {
                id: "not-a-uuid",
                clerk_organization_id: "org_other",
              },
              error: null,
            }
          },
        }
      },
    }))

    await assert.rejects(
      repository.ensureOrganization("org_active"),
      (error) => {
        assert.ok(error instanceof OrganizationProvisioningRepositoryError)
        assert.equal(error.category, "invariant")
        assert.equal(error.stage, "response_normalization")
        return true
      }
    )
  })
})

test("transport, PostgREST, and unclassified trusted RPC failures remain distinguishable", async (t) => {
  await t.test("transport", async () => {
    const repository = createOrganizationProvisioningRepository(() => ({
      rpc() {
        return {
          async single() {
            throw new Error("network detail")
          },
        }
      },
    }))

    await assert.rejects(
      repository.ensureOrganization("org_active"),
      (error) => {
        assert.ok(error instanceof OrganizationProvisioningRepositoryError)
        assert.equal(error.category, "transport")
        assert.equal(error.stage, "trusted_rpc_request")
        return true
      }
    )
  })

  for (const [label, rawError, category] of [
    ["PostgREST", { code: "PGRST202", message: "raw detail" }, "postgrest"],
    ["trusted RPC", { message: "raw detail" }, "trusted_rpc"],
  ]) {
    await t.test(label, async () => {
      const repository = createOrganizationProvisioningRepository(() => ({
        rpc() {
          return {
            async single() {
              return { data: null, error: rawError }
            },
          }
        },
      }))

      await assert.rejects(
        repository.ensureOrganization("org_active"),
        (error) => {
          assert.ok(error instanceof OrganizationProvisioningRepositoryError)
          assert.equal(error.category, category)
          assert.equal(error.stage, "trusted_rpc_result")
          return true
        }
      )
    })
  }
})

test("the admin client fails safely when its environment is missing", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousSecret = process.env.SUPABASE_SECRET_KEY

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  delete process.env.SUPABASE_SECRET_KEY

  try {
    assert.throws(
      () => createAdminSupabaseClient(),
      /Missing required Supabase admin environment variables/
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
    "utf8"
  )
  const normalSource = await readFile(
    new URL("../../lib/supabase/server.ts", import.meta.url),
    "utf8"
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

test("provisioning uses only the narrow service-role RPC", async () => {
  const facadeSource = await readFile(
    new URL(
      "../../lib/organizations/ensure-active-organization.ts",
      import.meta.url
    ),
    "utf8"
  )
  const repositorySource = await readFile(
    new URL(
      "../../lib/organizations/organization-provisioning.repository.ts",
      import.meta.url
    ),
    "utf8"
  )

  assert.match(
    facadeSource,
    /export async function ensureActiveOrganization\(\)/
  )
  assert.match(facadeSource, /await auth\(\)/)
  assert.match(repositorySource, /\.rpc\("ensure_organization_projection"/)
  assert.doesNotMatch(repositorySource, /\.from\(["']organizations["']\)/u)
  assert.doesNotMatch(repositorySource, /\.upsert\s*\(/u)
  assert.doesNotMatch(
    repositorySource,
    /billing_trial_grants|billing_customers|billing_checkout_attempts|stripe|\.from\(["']stores["']\)/iu
  )
})
