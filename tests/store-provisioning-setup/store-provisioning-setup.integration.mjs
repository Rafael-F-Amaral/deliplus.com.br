import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"
import test from "node:test"

import pg from "pg"

const root = new URL("../../", import.meta.url)
const unusedServerClient =
  "data:text/javascript," +
  encodeURIComponent(
    "export function createServerSupabaseClient() { throw new Error('Authenticated read client is outside this trusted-write integration test') }"
  )

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/supabase/server") {
      return { url: unusedServerClient, shortCircuit: true }
    }

    let url

    if (specifier.startsWith("@/")) {
      url = new URL(specifier.slice(2), root)
    } else if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(root.href) &&
      !context.parentURL.includes("node_modules")
    ) {
      url = new URL(specifier, context.parentURL)
    }

    if (url) {
      for (const suffix of ["", ".ts", ".mjs"]) {
        const path = fileURLToPath(url) + suffix

        if (existsSync(path)) {
          return { url: pathToFileURL(path).href, shortCircuit: true }
        }
      }
    }

    return nextResolve(specifier, context)
  },
})

const { createAdminSupabaseClient } =
  await import("../../lib/supabase/admin.ts")
const { createStoreSetupRepository } =
  await import("../../lib/stores/store-setup.repository.ts")

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
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    )
  } catch {
    throw new Error(
      "The local Supabase stack must be running for the Store setup integration test"
    )
  }

  const status = JSON.parse(output)

  if (!status.API_URL || !status.SECRET_KEY || !status.DB_URL) {
    throw new Error(
      "The local Supabase status did not provide trusted-write configuration"
    )
  }

  const databaseUrl = new URL(status.DB_URL)

  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !localHosts.has(databaseUrl.hostname)
  ) {
    throw new Error("Store setup integration tests require local PostgreSQL")
  }

  return {
    apiUrl: status.API_URL,
    databaseUrl: status.DB_URL,
    secretKey: status.SECRET_KEY,
  }
}

test(
  "the Secret API Key persists Store setup only through narrow local RPCs",
  { timeout: 30_000 },
  async () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const previousSecret = process.env.SUPABASE_SECRET_KEY
    const runtime = readLocalSupabaseRuntime()
    const organizationId = randomUUID()
    const clerkOrganizationId = `org_store_setup_${randomUUID().replaceAll("-", "")}`
    const clerkUserId = `user_store_setup_${randomUUID().replaceAll("-", "")}`
    const slugPrefix = `store-${randomUUID().replaceAll("-", "").slice(0, 12)}`
    const observer = new pg.Client({
      connectionString: runtime.databaseUrl,
      application_name: "store-setup-trusted-write-integration",
      connectionTimeoutMillis: 5_000,
    })

    process.env.NEXT_PUBLIC_SUPABASE_URL = runtime.apiUrl
    process.env.SUPABASE_SECRET_KEY = runtime.secretKey

    await observer.connect()

    const repository = createStoreSetupRepository()

    try {
      await observer.query(
        `insert into public.organizations (id, clerk_organization_id)
         values ($1::uuid, $2)`,
        [organizationId, clerkOrganizationId]
      )

      const directRead = await createAdminSupabaseClient()
        .from("stores")
        .select("id")
        .eq("organization_id", organizationId)

      assert.equal(directRead.status, 403)
      assert.equal(directRead.error?.code, "42501")

      const created = await repository.createDraftStore(
        organizationId,
        "Loja inicial",
        `${slugPrefix}-initial`
      )

      assert.equal(created.status, "success")

      if (created.status !== "success") {
        throw new Error("Trusted draft creation did not return a Store")
      }

      assert.deepEqual(
        {
          name: created.data.name,
          slug: created.data.slug,
          status: created.data.status,
          activatedAt: created.data.activatedAt,
        },
        {
          name: "Loja inicial",
          slug: `${slugPrefix}-initial`,
          status: "draft",
          activatedAt: null,
        }
      )

      const updated = await repository.updateStoreSetup(
        organizationId,
        created.data.id,
        created.data.updatedAt,
        { name: "Loja atualizada", slug: `${slugPrefix}-updated` }
      )

      assert.equal(updated.status, "success")

      if (updated.status !== "success") {
        throw new Error("Trusted Store setup update did not return a Store")
      }

      const ready = await repository.markStoreReady(
        organizationId,
        updated.data.id,
        updated.data.updatedAt
      )

      assert.equal(ready.status, "success")

      if (ready.status !== "success") {
        throw new Error("Trusted Store readiness did not return a Store")
      }

      assert.equal(ready.data.status, "ready")

      const beforeActivation = await observer.query(
        `select
           (select count(*) from public.billing_trial_grants
            where organization_id = $1::uuid)::integer as trial_grants,
           (select count(*) from public.billing_customers
            where organization_id = $1::uuid)::integer as billing_customers,
           (select count(*) from public.billing_subscriptions
            where organization_id = $1::uuid)::integer as subscriptions,
           (select count(*) from public.billing_checkout_attempts
            where organization_id = $1::uuid)::integer as checkout_attempts`,
        [organizationId]
      )

      assert.deepEqual(beforeActivation.rows[0], {
        trial_grants: 0,
        billing_customers: 0,
        subscriptions: 0,
        checkout_attempts: 0,
      })

      const concurrentSlug = `${slugPrefix}-concurrent`
      const concurrentCreates = await Promise.all([
        repository.createDraftStore(
          organizationId,
          "Concorrente A",
          concurrentSlug
        ),
        repository.createDraftStore(
          organizationId,
          "Concorrente B",
          concurrentSlug
        ),
      ])

      assert.deepEqual(
        concurrentCreates.map((result) => result.status).sort(),
        ["slug_unavailable", "success"]
      )

      const concurrentStore = concurrentCreates.find(
        (result) => result.status === "success"
      )

      assert.ok(concurrentStore && concurrentStore.status === "success")

      const concurrentUpdates = await Promise.all([
        repository.updateStoreSetup(
          organizationId,
          concurrentStore.data.id,
          concurrentStore.data.updatedAt,
          { name: "Concorrente atualizada A" }
        ),
        repository.updateStoreSetup(
          organizationId,
          concurrentStore.data.id,
          concurrentStore.data.updatedAt,
          { name: "Concorrente atualizada B" }
        ),
      ])

      assert.deepEqual(
        concurrentUpdates.map((result) => result.status).sort(),
        ["setup_changed", "success"]
      )

      await observer.query("begin")
      await observer.query(
        "select pg_catalog.set_config('request.jwt.claims', $1, true)",
        [
          JSON.stringify({
            sub: clerkUserId,
            o: { id: clerkOrganizationId, rol: "admin" },
          }),
        ]
      )
      await observer.query("set local role authenticated")
      const activation = await observer.query(
        `select outcome
         from public.activate_first_store_with_initial_trial($1::uuid)`,
        [ready.data.id]
      )
      await observer.query("commit")

      assert.equal(activation.rows[0]?.outcome, "activated")

      const persisted = await observer.query(
        `select name, slug, status, activated_at
         from public.stores
         where id = $1::uuid`,
        [ready.data.id]
      )

      assert.equal(persisted.rows[0]?.name, "Loja atualizada")
      assert.equal(persisted.rows[0]?.slug, `${slugPrefix}-updated`)
      assert.equal(persisted.rows[0]?.status, "active")
      assert.ok(persisted.rows[0]?.activated_at instanceof Date)
    } finally {
      await observer.query("rollback")
      await observer.query(
        `delete from public.billing_trial_grants
         where organization_id = $1::uuid`,
        [organizationId]
      )
      await observer.query(
        `delete from public.stores
         where organization_id = $1::uuid`,
        [organizationId]
      )
      await observer.query(
        `delete from public.organizations
         where id = $1::uuid`,
        [organizationId]
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
  }
)
