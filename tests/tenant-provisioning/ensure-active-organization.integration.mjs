import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import test from "node:test"

import pg from "pg"

import { createOrganizationProvisioningRepository } from "../../lib/organizations/organization-provisioning.repository.ts"
import { createAdminSupabaseClient } from "../../lib/supabase/admin.ts"

const supabaseCli = fileURLToPath(
  new URL("../../node_modules/supabase/dist/supabase.js", import.meta.url)
)
const localHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"])

function readLocalSupabaseRuntime() {
  let output

  try {
    output = execFileSync(
      process.execPath,
      [supabaseCli, "status", "--output", "json", "--log-level", "error"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }
    )
  } catch {
    throw new Error(
      "The local Supabase stack must be running for the tenant provisioning integration test"
    )
  }

  const status = JSON.parse(output)

  if (!status.API_URL || !status.SECRET_KEY || !status.DB_URL) {
    throw new Error(
      "The local Supabase status did not provide the required trusted-write configuration"
    )
  }

  const databaseUrl = new URL(status.DB_URL)

  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !localHosts.has(databaseUrl.hostname)
  ) {
    throw new Error(
      "Tenant provisioning integration tests require local PostgreSQL"
    )
  }

  return {
    apiUrl: status.API_URL,
    databaseUrl: status.DB_URL,
    secretKey: status.SECRET_KEY,
  }
}

test("the service-role RPC provisions idempotently and converges under concurrent local Data API calls", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousSecret = process.env.SUPABASE_SECRET_KEY
  const localRuntime = readLocalSupabaseRuntime()
  const retryClerkOrganizationId = `org_local_retry_${randomUUID().replaceAll("-", "")}`
  const concurrentClerkOrganizationId = `org_local_concurrent_${randomUUID().replaceAll("-", "")}`
  const isolatedClerkOrganizationId = `org_local_isolated_${randomUUID().replaceAll("-", "")}`
  const observer = new pg.Client({
    connectionString: localRuntime.databaseUrl,
    application_name: "tenant-provisioning-integration-observer",
    connectionTimeoutMillis: 5_000,
  })

  process.env.NEXT_PUBLIC_SUPABASE_URL = localRuntime.apiUrl
  process.env.SUPABASE_SECRET_KEY = localRuntime.secretKey

  await observer.connect()

  const repository = createOrganizationProvisioningRepository(
    createAdminSupabaseClient
  )
  const clerkOrganizationIds = [
    retryClerkOrganizationId,
    concurrentClerkOrganizationId,
    isolatedClerkOrganizationId,
  ]

  try {
    await observer.query(
      `insert into public.organizations (clerk_organization_id)
       values ($1)`,
      [isolatedClerkOrganizationId]
    )
    const isolatedBefore = await observer.query(
      `select id, created_at, updated_at
       from public.organizations
       where clerk_organization_id = $1`,
      [isolatedClerkOrganizationId]
    )

    const first = await repository.ensureOrganization(retryClerkOrganizationId)
    const retry = await repository.ensureOrganization(retryClerkOrganizationId)

    assert.deepEqual(retry, first)

    const [concurrentA, concurrentB] = await Promise.all([
      repository.ensureOrganization(concurrentClerkOrganizationId),
      repository.ensureOrganization(concurrentClerkOrganizationId),
    ])

    assert.deepEqual(concurrentB, concurrentA)

    const stored = await observer.query(
      `select id, clerk_organization_id
       from public.organizations
       where clerk_organization_id = any($1::text[])
       order by clerk_organization_id`,
      [[retryClerkOrganizationId, concurrentClerkOrganizationId]]
    )

    assert.equal(stored.rowCount, 2)
    assert.deepEqual(
      stored.rows.map((row) => row.clerk_organization_id),
      [concurrentClerkOrganizationId, retryClerkOrganizationId].sort()
    )
    assert.equal(
      stored.rows.filter(
        (row) => row.clerk_organization_id === concurrentClerkOrganizationId
      ).length,
      1
    )
    assert.equal(
      stored.rows.find(
        (row) => row.clerk_organization_id === retryClerkOrganizationId
      )?.id,
      first.id
    )
    assert.equal(
      stored.rows.find(
        (row) => row.clerk_organization_id === concurrentClerkOrganizationId
      )?.id,
      concurrentA.id
    )

    const isolatedAfter = await observer.query(
      `select id, created_at, updated_at
       from public.organizations
       where clerk_organization_id = $1`,
      [isolatedClerkOrganizationId]
    )

    assert.deepEqual(isolatedAfter.rows, isolatedBefore.rows)

    const sideEffects = await observer.query(
      `select
         (select count(*) from public.stores
          where organization_id = any($1::uuid[]))::integer as stores,
         (select count(*) from public.billing_trial_grants
          where organization_id = any($1::uuid[]))::integer as trial_grants,
         (select count(*) from public.billing_customers
          where organization_id = any($1::uuid[]))::integer as billing_customers,
         (select count(*) from public.billing_checkout_attempts
          where organization_id = any($1::uuid[]))::integer as checkout_attempts`,
      [[first.id, concurrentA.id]]
    )

    assert.deepEqual(sideEffects.rows[0], {
      stores: 0,
      trial_grants: 0,
      billing_customers: 0,
      checkout_attempts: 0,
    })
  } finally {
    await observer.query(
      `delete from public.organizations
       where clerk_organization_id = any($1::text[])`,
      [clerkOrganizationIds]
    )
    await observer.end()

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
