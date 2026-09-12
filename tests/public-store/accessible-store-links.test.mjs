import "./runtime.mjs"
import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import pg from "pg"

const { createListAccessibleStoreLinks, AccessibleStoreLinksError } =
  await import("../../lib/stores/accessible-store-links.internal.ts")

test("missing identity or Organization stops before Store reads", async () => {
  for (const status of [
    "unauthenticated",
    "no_active_organization",
    "organization_not_provisioned",
  ]) {
    const read = createListAccessibleStoreLinks({
      resolveOnboardingState: async () => ({ status }),
      readStores: async () => {
        throw new Error("must not read")
      },
    })
    assert.deepEqual(await read(), { status })
  }
})

test("Store link DTO is allowlisted and infrastructure failures remain distinct", async () => {
  const state = {
    status: "organization_provisioned",
    organizationId: "internal",
  }
  const read = (result) =>
    createListAccessibleStoreLinks({
      resolveOnboardingState: async () => state,
      readStores: async (id) => {
        assert.equal(id, "internal")
        return result
      },
    })
  assert.deepEqual(
    await read({
      data: [{ name: "Store", slug: "store-a", id: "secret" }],
      error: null,
    })(),
    {
      status: "success",
      stores: [{ name: "Store", slug: "store-a" }],
    }
  )
  for (const result of [
    { data: null, error: new Error("private") },
    { data: [{ name: "Store", slug: "//evil" }], error: null },
  ]) {
    await assert.rejects(read(result), AccessibleStoreLinksError)
  }
})

test("authenticated adapter uses only normal RLS reads with active and tenant filters", async () => {
  const source = await readFile(
    new URL("../../lib/stores/accessible-store-links.ts", import.meta.url),
    "utf8"
  )
  assert.match(source, /createServerSupabaseClient/)
  assert.match(source, /resolveOnboardingState/)
  assert.match(source, /\.select\("name, slug"\)/)
  assert.match(source, /\.eq\("organization_id", organizationId\)/)
  assert.match(source, /\.eq\("status", "active"\)/)
  assert.doesNotMatch(
    source,
    /admin|service_role|\.rpc\(|stripe|billing|supabase\/public/
  )
})

test("real local RLS limits admin/member links and excludes every unavailable state", async () => {
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  })
  await db.connect()
  await db.query("begin")
  try {
    const org = randomUUID(),
      otherOrg = randomUUID(),
      clerkOrg = `org_${randomUUID()}`,
      user = `user_${randomUUID()}`
    await db.query(
      "insert into public.organizations(id, clerk_organization_id) values ($1, $2), ($3, $4)",
      [org, clerkOrg, otherOrg, `org_${randomUUID()}`]
    )
    const active = []
    for (const [index, status] of [
      "active",
      "active",
      "draft",
      "ready",
      "inactive",
      "active",
    ].entries()) {
      const id = randomUUID(),
        slug = `link-${randomUUID()}`,
        tenant = index === 5 ? otherOrg : org
      await db.query(
        "insert into public.stores(id, organization_id, name, slug) values ($1,$2,$3,$4)",
        [id, tenant, `Store ${index}`, slug]
      )
      if (status !== "draft")
        await db.query("update public.stores set status='ready' where id=$1", [
          id,
        ])
      if (["active", "inactive"].includes(status))
        await db.query(
          "update public.stores set status='active', activated_at=now() where id=$1",
          [id]
        )
      if (status === "inactive")
        await db.query(
          "update public.stores set status='inactive' where id=$1",
          [id]
        )
      if (index < 2) active.push({ id, name: `Store ${index}`, slug })
    }
    await db.query(
      "insert into public.store_memberships(organization_id,store_id,clerk_user_id) values ($1,$2,$3)",
      [org, active[0].id, user]
    )
    for (const role of ["admin", "member"]) {
      await db.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({ sub: user, o: { id: clerkOrg, rol: role } }),
      ])
      await db.query("set local role authenticated")
      const list = createListAccessibleStoreLinks({
        resolveOnboardingState: async () => ({
          status: "organization_provisioned",
          organizationId: org,
        }),
        readStores: async (id) => ({
          data: (
            await db.query(
              "select name, slug from public.stores where organization_id=$1 and status='active' order by name",
              [id]
            )
          ).rows,
          error: null,
        }),
      })
      assert.deepEqual(await list(), {
        status: "success",
        stores: active
          .slice(0, role === "admin" ? 2 : 1)
          .map(({ name, slug }) => ({ name, slug })),
      })
      await db.query("reset role")
    }
  } finally {
    await db.query("rollback")
    await db.end()
  }
})
