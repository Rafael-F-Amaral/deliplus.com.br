import "./runtime.mjs"
import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { readdir, readFile } from "node:fs/promises"
import ReactDOMServer from "react-dom/server"

const { getPublicStoreBySlug, PublicStoreReadError } =
  await import("../../lib/stores/public-store.ts")
const {
  default: Page,
  dynamic,
  metadata,
} = await import("../../app/[storeSlug]/page.tsx")
const { validatePersistedStoreSlug } =
  await import("../../lib/stores/store-setup.rules.ts")
let rows, calls, failed
beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-test-key"
  rows = [{ name: "Pizzaria <João>", slug: "pizzaria-joao" }]
  calls = []
  failed = false
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    return new Response(
      JSON.stringify(
        failed ? { message: "private database detail", code: "XX000" } : rows
      ),
      {
        status: failed ? 500 : 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})

test("active Store uses real anonymous client/repository without Clerk or Organization", async () => {
  assert.deepEqual(await getPublicStoreBySlug("pizzaria-joao"), {
    status: "found",
    store: rows[0],
  })
  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /\/rest\/v1\/rpc\/get_public_store_by_slug$/)
  assert.equal(calls[0].init.cache, "no-store")
  assert.deepEqual(JSON.parse(calls[0].init.body), { p_slug: "pizzaria-joao" })
  const headers = new Headers(calls[0].init.headers)
  assert.equal(headers.get("apikey"), "public-test-key")
  assert.equal(headers.get("authorization"), "Bearer public-test-key")
})

for (const state of ["nonexistent", "draft", "ready", "inactive"]) {
  test(`${state} RPC absence becomes not_found and route notFound`, async () => {
    // PostgreSQL tests prove lifecycle filtering; the application sees only [] in every case.
    rows = []
    assert.deepEqual(await getPublicStoreBySlug("pizzaria-joao"), {
      status: "not_found",
    })
    await assert.rejects(
      Page({ params: Promise.resolve({ storeSlug: "pizzaria-joao" }) }),
      { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }
    )
  })
}

test("invalid and reserved public input is unavailable without network", async () => {
  for (const slug of [
    null,
    undefined,
    3,
    "",
    "aa",
    "a".repeat(64),
    "PIZZARIA-JOAO",
    "pizzaria/joao",
    "pizzaria-joao' OR true",
    "dashboard",
    "onboarding",
    "_next",
    "__clerk",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
    ".well-known",
  ]) {
    assert.deepEqual(await getPublicStoreBySlug(slug), { status: "not_found" })
  }
  assert.equal(calls.length, 0)
})

test("infrastructure errors stay distinct from not_found with sanitized message", async () => {
  failed = true
  await assert.rejects(
    getPublicStoreBySlug("pizzaria-joao"),
    (error) =>
      error instanceof PublicStoreReadError &&
      error.message === "Unable to read public Store"
  )
  await assert.rejects(
    Page({ params: Promise.resolve({ storeSlug: "pizzaria-joao" }) }),
    PublicStoreReadError
  )
})

test("configuration and transport failures are domain errors", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  await assert.rejects(
    getPublicStoreBySlug("pizzaria-joao"),
    PublicStoreReadError
  )
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-test-key"
  globalThis.fetch = async () => {
    throw new Error("connection refused")
  }
  await assert.rejects(
    getPublicStoreBySlug("pizzaria-joao"),
    PublicStoreReadError
  )
})

test("unexpected RPC data fails closed instead of silently selecting a Store", async () => {
  for (const value of [
    null,
    {},
    [rows[0], rows[0]],
    [{ name: "", slug: "pizzaria-joao" }],
    [{ name: "Other", slug: "other-store" }],
  ]) {
    rows = value
    await assert.rejects(
      getPublicStoreBySlug("pizzaria-joao"),
      PublicStoreReadError
    )
  }
})

test("DTO and rendered route expose only public facts and escape Store name", async () => {
  rows[0].organization_id = "private-tenant"
  rows[0].id = "private-store"
  rows[0].activated_at = "private-timestamp"
  assert.deepEqual(
    Object.keys((await getPublicStoreBySlug("pizzaria-joao")).store).sort(),
    ["name", "slug"]
  )
  const html = ReactDOMServer.renderToStaticMarkup(
    await Page({ params: Promise.resolve({ storeSlug: "pizzaria-joao" }) })
  )
  assert.match(html, /Pizzaria &lt;João&gt;/)
  assert.match(html, /Loja publicada no Deli Plus\./)
  assert.doesNotMatch(html, /private-|organization|activated_at/)
  assert.equal(dynamic, "force-dynamic")
  assert.deepEqual(metadata.robots, { index: false, follow: false })
})

test("every actual top-level static route is rejected as a Store slug", async () => {
  const entries = await readdir(new URL("../../app/", import.meta.url), {
    withFileTypes: true,
  })
  for (const entry of entries.filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith("[")
  )) {
    assert.equal(
      validatePersistedStoreSlug(entry.name).valid,
      false,
      entry.name
    )
  }
  const proxy = await readFile(
    new URL("../../proxy.ts", import.meta.url),
    "utf8"
  )
  assert.match(proxy, /clerkMiddleware\(\)/)
  assert.doesNotMatch(proxy, /auth\.protect|redirectToSignIn/)
})
