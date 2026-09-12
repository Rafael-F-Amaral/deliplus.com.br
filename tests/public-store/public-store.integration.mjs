import "./runtime.mjs"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import test from "node:test"
import pg from "pg"

const { getPublicStoreBySlug } =
  await import("../../lib/stores/public-store.ts")
const { createAnonymousSupabaseClient } =
  await import("../../lib/supabase/public.ts")

test("local anonymous Data API boundary and authenticated deactivation", async (t) => {
  const runtime = JSON.parse(
    execFileSync(
      process.execPath,
      [
        fileURLToPath(
          new URL(
            "../../node_modules/supabase/dist/supabase.js",
            import.meta.url
          )
        ),
        "status",
        "--output",
        "json",
        "--log-level",
        "error",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    )
  )
  assert.ok(
    ["127.0.0.1", "localhost"].includes(new URL(runtime.API_URL).hostname)
  )
  assert.ok(
    ["127.0.0.1", "localhost"].includes(new URL(runtime.DB_URL).hostname)
  )
  process.env.NEXT_PUBLIC_SUPABASE_URL = runtime.API_URL
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    runtime.PUBLISHABLE_KEY ?? runtime.ANON_KEY
  const db = new pg.Client({ connectionString: runtime.DB_URL })
  await db.connect()
  const organizationId = randomUUID()
  const clerkOrganization = `org_public_${randomUUID()}`
  const prefix = `public-${randomUUID()}`
  try {
    await db.query(
      "insert into public.organizations(id, clerk_organization_id) values ($1, $2)",
      [organizationId, clerkOrganization]
    )
    for (const state of ["draft", "ready", "active", "inactive"]) {
      const slug = `${prefix}-${state}`
      await db.query(
        "insert into public.stores(organization_id, name, slug) values ($1, $2, $3)",
        [organizationId, "Local public Store", slug]
      )
      if (state !== "draft")
        await db.query(
          "update public.stores set status = 'ready' where slug = $1",
          [slug]
        )
      if (["active", "inactive"].includes(state))
        await db.query(
          "update public.stores set status = 'active', activated_at = now() where slug = $1",
          [slug]
        )
      if (state === "inactive")
        await db.query(
          "update public.stores set status = 'inactive' where slug = $1",
          [slug]
        )
      await t.test(`${state} through real anonymous HTTP RPC`, async () => {
        assert.deepEqual(
          await getPublicStoreBySlug(slug),
          state === "active"
            ? { status: "found", store: { name: "Local public Store", slug } }
            : { status: "not_found" }
        )
      })
    }
    await t.test("unknown slug through real anonymous HTTP RPC", async () => {
      assert.deepEqual(await getPublicStoreBySlug(`${prefix}-unknown`), {
        status: "not_found",
      })
    })
    await t.test("direct Data API Store SELECT is denied", async () => {
      const { error } = await createAnonymousSupabaseClient()
        .from("stores")
        .select("name")
      assert.equal(error?.code, "42501")
    })
    await t.test(
      "domain deactivation RPC makes next public read unavailable",
      async () => {
        const slug = `${prefix}-active`
        const storeId = (
          await db.query("select id from public.stores where slug = $1", [slug])
        ).rows[0].id
        await db.query("begin")
        try {
          await db.query("select set_config('request.jwt.claims', $1, true)", [
            JSON.stringify({
              sub: "user_public_deactivation_test",
              o: { id: clerkOrganization, rol: "admin" },
            }),
          ])
          await db.query("set local role authenticated")
          const result = await db.query(
            "select outcome from public.deactivate_store($1)",
            [storeId]
          )
          assert.equal(result.rows[0].outcome, "deactivated")
          await db.query("commit")
        } catch (error) {
          await db.query("rollback")
          throw error
        }
        assert.deepEqual(await getPublicStoreBySlug(slug), {
          status: "not_found",
        })
      }
    )
  } finally {
    await db.query("delete from public.stores where organization_id = $1", [
      organizationId,
    ])
    await db.query("delete from public.organizations where id = $1", [
      organizationId,
    ])
    await db.end()
  }
})
