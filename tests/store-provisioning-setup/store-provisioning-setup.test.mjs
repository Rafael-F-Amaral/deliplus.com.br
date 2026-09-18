import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import {
  createStoreSetupService,
  StoreSetupError,
} from "../../lib/stores/store-setup.internal.ts"
import {
  RESERVED_STORE_SLUGS,
  isStoreId,
  normalizeStoreSlug,
  validateAndNormalizeStoreName,
  validateAndNormalizeStoreSlug,
  validatePersistedStoreSlug,
} from "../../lib/stores/store-setup.rules.ts"

const organizationId = "10000000-0000-0000-0000-000000000001"
const ownStoreId = "20000000-0000-0000-0000-000000000001"
const otherStoreId = "20000000-0000-0000-0000-000000000002"

const adminAuth = {
  userId: "user_admin",
  orgId: "org_active",
  isAdmin: true,
}

const defaultStore = {
  id: ownStoreId,
  name: "Açaí Central",
  slug: "acai-central",
  status: "draft",
  activatedAt: null,
  updatedAt: "2026-08-27T12:00:00.000Z",
}

function createRepository(overrides = {}) {
  const calls = {
    organizations: [],
    lists: [],
    finds: [],
    creates: [],
    updates: [],
    ready: [],
  }
  const repository = {
    async findOrganization(clerkOrganizationId) {
      calls.organizations.push(clerkOrganizationId)
      return { status: "success", data: { id: organizationId } }
    },
    async listStores(requestedOrganizationId) {
      calls.lists.push(requestedOrganizationId)
      return { status: "success", data: [defaultStore] }
    },
    async findStore(requestedOrganizationId, storeId) {
      calls.finds.push({ organizationId: requestedOrganizationId, storeId })
      return storeId === ownStoreId
        ? { status: "success", data: defaultStore }
        : { status: "not_found" }
    },
    async createDraftStore(requestedOrganizationId, name, slug) {
      calls.creates.push({
        organizationId: requestedOrganizationId,
        name,
        slug,
      })
      return {
        status: "success",
        data: {
          ...defaultStore,
          name,
          slug,
          status: "draft",
          activatedAt: null,
        },
      }
    },
    async updateStoreSetup(
      requestedOrganizationId,
      storeId,
      expectedUpdatedAt,
      fields
    ) {
      calls.updates.push({
        organizationId: requestedOrganizationId,
        storeId,
        expectedUpdatedAt,
        fields,
      })
      return {
        status: "success",
        data: {
          ...defaultStore,
          ...fields,
          updatedAt: "2026-08-27T12:01:00.000Z",
        },
      }
    },
    async markStoreReady(requestedOrganizationId, storeId, expectedUpdatedAt) {
      calls.ready.push({
        organizationId: requestedOrganizationId,
        storeId,
        expectedUpdatedAt,
      })
      return {
        status: "success",
        data: {
          ...defaultStore,
          status: "ready",
          updatedAt: "2026-08-27T12:01:00.000Z",
        },
      }
    },
    ...overrides,
  }

  return { repository, calls }
}

function createService({ authState = adminAuth, overrides } = {}) {
  const { repository, calls } = createRepository(overrides)
  const service = createStoreSetupService({
    getAuth: async () => authState,
    repository,
    rules: {
      isStoreId,
      validateName: validateAndNormalizeStoreName,
      validateSlug: validateAndNormalizeStoreSlug,
      validatePersistedSlug: validatePersistedStoreSlug,
    },
  })

  return { service, calls }
}

function validationResult(field, code) {
  return {
    status: "validation_error",
    issue: { field, code },
  }
}

test("create and update reject every reserved slug before persistence", async (t) => {
  for (const slug of RESERVED_STORE_SLUGS) {
    await t.test(slug, async () => {
      const { service, calls } = createService()
      assert.deepEqual(
        await service.createDraftStore({ name: "Store", slug }),
        validationResult("slug", "reserved")
      )
      assert.deepEqual(
        await service.updateStoreSetup(ownStoreId, { slug }),
        validationResult("slug", "reserved")
      )
      assert.deepEqual(calls.creates, [])
      assert.deepEqual(calls.updates, [])
    })
  }
})

test("unauthenticated requests stop before tenant resolution", async () => {
  const { service, calls } = createService({
    authState: { ...adminAuth, userId: null },
  })

  assert.deepEqual(await service.createDraftStore(defaultStore), {
    status: "unauthenticated",
  })
  assert.deepEqual(calls.organizations, [])
  assert.deepEqual(calls.creates, [])
})

test("requests without an active Organization stop before persistence", async () => {
  const { service, calls } = createService({
    authState: { ...adminAuth, orgId: null },
  })

  assert.deepEqual(await service.listStoresForSetup(), {
    status: "no_active_organization",
  })
  assert.deepEqual(calls.organizations, [])
})

test("Organization members cannot read or mutate Store setup", async () => {
  const { service, calls } = createService({
    authState: { ...adminAuth, isAdmin: false },
  })

  assert.deepEqual(await service.listStoresForSetup(), {
    status: "forbidden",
  })
  assert.deepEqual(
    await service.updateStoreSetup(ownStoreId, { name: "Denied" }),
    { status: "forbidden" }
  )
  assert.deepEqual(await service.markStoreReady(ownStoreId), {
    status: "forbidden",
  })
  assert.deepEqual(calls.organizations, [])
})

test("an unprovisioned active Organization returns the approved precondition", async () => {
  const { service, calls } = createService({
    overrides: {
      async findOrganization(clerkOrganizationId) {
        calls.organizations.push(clerkOrganizationId)
        return { status: "not_found" }
      },
    },
  })

  assert.deepEqual(
    await service.createDraftStore({ name: "Store", slug: "store" }),
    { status: "organization_not_provisioned" }
  )
  assert.deepEqual(calls.organizations, ["org_active"])
  assert.deepEqual(calls.creates, [])
})

test("infrastructure failures use a safe StoreSetupError", async () => {
  const cause = new Error("raw PostgREST tenant detail")
  const { service } = createService({
    overrides: {
      async findOrganization() {
        return { status: "failure", cause }
      },
    },
  })

  await assert.rejects(service.listStoresForSetup, (error) => {
    assert.ok(error instanceof StoreSetupError)
    assert.equal(error.message, "Unable to complete Store setup operation")
    assert.doesNotMatch(error.message, /raw PostgREST tenant detail/)
    assert.equal(error.cause, cause)
    return true
  })
})

test("listStoresForSetup returns only the approved DTO", async () => {
  const { service, calls } = createService()

  assert.deepEqual(await service.listStoresForSetup(), {
    status: "success",
    stores: [
      {
        id: ownStoreId,
        name: "Açaí Central",
        slug: "acai-central",
        status: "draft",
        updatedAt: "2026-08-27T12:00:00.000Z",
      },
    ],
  })
  assert.deepEqual(calls.organizations, ["org_active"])
  assert.deepEqual(calls.lists, [organizationId])
})

test("getStoreForSetup scopes the selector to the session tenant", async () => {
  const { service, calls } = createService()

  const result = await service.getStoreForSetup(ownStoreId)

  assert.equal(result.status, "success")
  assert.deepEqual(calls.finds, [{ organizationId, storeId: ownStoreId }])
})

test("missing and cross-tenant Store selectors share one safe result", async () => {
  const { service } = createService()

  assert.deepEqual(await service.getStoreForSetup(otherStoreId), {
    status: "store_unavailable",
  })
  assert.deepEqual(
    await service.getStoreForSetup("30000000-0000-0000-0000-000000000003"),
    { status: "store_unavailable" }
  )
})

test("malformed Store selectors fail safely without a Store query", async () => {
  const { service, calls } = createService()

  assert.deepEqual(await service.getStoreForSetup("not-a-uuid"), {
    status: "store_unavailable",
  })
  assert.deepEqual(calls.finds, [])
})

test("createDraftStore derives tenant and persists only normalized business fields", async () => {
  const { service, calls } = createService()
  const result = await service.createDraftStore({
    name: "  Açaí Central  ",
    slug: "  Açaí__Central / Loja  ",
    organizationId: "attacker-organization",
    status: "active",
    activatedAt: "2026-08-27T00:00:00.000Z",
  })

  assert.equal(result.status, "success")
  assert.deepEqual(calls.creates, [
    {
      organizationId,
      name: "Açaí Central",
      slug: "acai-central-loja",
    },
  ])
  assert.equal(result.store.status, "draft")
  assert.equal(Object.hasOwn(result.store, "activatedAt"), false)
})

test("Store name validation trims meaningful text and rejects blank values", () => {
  assert.deepEqual(validateAndNormalizeStoreName("  Loja Central  "), {
    valid: true,
    value: "Loja Central",
  })
  assert.deepEqual(validateAndNormalizeStoreName("   "), {
    valid: false,
    issue: { field: "name", code: "required" },
  })
  assert.deepEqual(validateAndNormalizeStoreName(null), {
    valid: false,
    issue: { field: "name", code: "invalid_type" },
  })
})

test("createDraftStore returns field-safe name validation", async () => {
  const { service, calls } = createService()

  assert.deepEqual(
    await service.createDraftStore({ name: "   ", slug: "valid-slug" }),
    validationResult("name", "required")
  )
  assert.deepEqual(calls.creates, [])
})

test("slug normalization handles accents, separators, punctuation, and hyphens", () => {
  assert.equal(
    normalizeStoreSlug("  Açaí__Central / Café---Loja!  "),
    "acai-central-cafe-loja"
  )
  assert.deepEqual(validateAndNormalizeStoreSlug(" São João | Unidade 2 "), {
    valid: true,
    value: "sao-joao-unidade-2",
  })
})

test("short, long, and invalid slug values are rejected", () => {
  assert.deepEqual(validateAndNormalizeStoreSlug("ab"), {
    valid: false,
    issue: { field: "slug", code: "too_short" },
  })
  assert.deepEqual(validateAndNormalizeStoreSlug("a".repeat(64)), {
    valid: false,
    issue: { field: "slug", code: "too_long" },
  })
  assert.deepEqual(validateAndNormalizeStoreSlug(null), {
    valid: false,
    issue: { field: "slug", code: "invalid_type" },
  })
})

test("every reserved Store slug is rejected by the shared helper", async (t) => {
  for (const slug of RESERVED_STORE_SLUGS) {
    await t.test(slug, () => {
      assert.deepEqual(validateAndNormalizeStoreSlug(slug), {
        valid: false,
        issue: { field: "slug", code: "reserved" },
      })
    })
  }
})

test("duplicate slug maps to a non-disclosing safe result", async () => {
  const { service } = createService({
    overrides: {
      async createDraftStore() {
        return { status: "slug_unavailable" }
      },
    },
  })

  assert.deepEqual(
    await service.createDraftStore({ name: "Store", slug: "duplicate" }),
    { status: "slug_unavailable" }
  )
})

test("database failures never become validation or conflict results", async () => {
  const cause = new Error("raw insert failure")
  const { service } = createService({
    overrides: {
      async createDraftStore() {
        return { status: "failure", cause }
      },
    },
  })

  await assert.rejects(
    service.createDraftStore({ name: "Store", slug: "valid-store" }),
    (error) => error instanceof StoreSetupError && error.cause === cause
  )
})

test("updateStoreSetup writes only changed allow-listed fields", async () => {
  const readyStore = { ...defaultStore, status: "ready" }
  const { service, calls } = createService({
    overrides: {
      async findStore(requestedOrganizationId, storeId) {
        calls.finds.push({
          organizationId: requestedOrganizationId,
          storeId,
        })
        return { status: "success", data: readyStore }
      },
    },
  })

  await service.updateStoreSetup(ownStoreId, {
    name: "  Nova Loja  ",
    status: "active",
    organizationId: "attacker-organization",
    activatedAt: "2026-08-27T00:00:00.000Z",
  })

  assert.deepEqual(calls.updates, [
    {
      organizationId,
      storeId: ownStoreId,
      expectedUpdatedAt: defaultStore.updatedAt,
      fields: { name: "Nova Loja" },
    },
  ])
})

test("optimistic concurrency returns setup_changed", async () => {
  const { service } = createService({
    overrides: {
      async updateStoreSetup() {
        return { status: "setup_changed" }
      },
    },
  })

  assert.deepEqual(
    await service.updateStoreSetup(ownStoreId, { name: "Changed" }),
    { status: "setup_changed" }
  )
})

test("a material ready Store change returns it to draft", async () => {
  const readyStore = { ...defaultStore, status: "ready" }
  const { service } = createService({
    overrides: {
      async findStore() {
        return { status: "success", data: readyStore }
      },
      async updateStoreSetup(
        requestedOrganizationId,
        storeId,
        expectedUpdatedAt,
        fields
      ) {
        return {
          status: "success",
          data: { ...readyStore, ...fields, status: "draft" },
        }
      },
    },
  })

  const result = await service.updateStoreSetup(ownStoreId, {
    slug: "new-store-slug",
  })

  assert.equal(result.status, "success")
  assert.equal(result.store.status, "draft")
  assert.equal(result.store.slug, "new-store-slug")
})

test("an identical canonical save preserves ready without a write", async () => {
  const readyStore = { ...defaultStore, status: "ready" }
  const { service, calls } = createService({
    overrides: {
      async findStore() {
        return { status: "success", data: readyStore }
      },
    },
  })

  const result = await service.updateStoreSetup(ownStoreId, {
    name: "  Açaí Central  ",
    slug: " Açaí Central ",
    status: "active",
  })

  assert.equal(result.status, "success")
  assert.equal(result.store.status, "ready")
  assert.deepEqual(calls.updates, [])
})

test("active and inactive Stores are unavailable to setup updates", async (t) => {
  for (const status of ["active", "inactive"]) {
    await t.test(status, async () => {
      const { service, calls } = createService({
        overrides: {
          async findStore() {
            return {
              status: "success",
              data: {
                ...defaultStore,
                status,
                activatedAt: "2026-08-27T10:00:00.000Z",
              },
            }
          },
        },
      })

      assert.deepEqual(
        await service.updateStoreSetup(ownStoreId, { name: "Denied" }),
        { status: "store_unavailable" }
      )
      assert.deepEqual(calls.updates, [])
    })
  }
})

test("update duplicate slug uses the same safe conflict result", async () => {
  const { service } = createService({
    overrides: {
      async updateStoreSetup() {
        return { status: "slug_unavailable" }
      },
    },
  })

  assert.deepEqual(
    await service.updateStoreSetup(ownStoreId, { slug: "other-store" }),
    { status: "slug_unavailable" }
  )
})

test("markStoreReady validates persisted facts and transitions draft", async () => {
  const { service, calls } = createService()

  const result = await service.markStoreReady(ownStoreId)

  assert.equal(result.status, "success")
  assert.equal(result.store.status, "ready")
  assert.deepEqual(calls.ready, [
    {
      organizationId,
      storeId: ownStoreId,
      expectedUpdatedAt: defaultStore.updatedAt,
    },
  ])
})

test("markStoreReady is idempotent for an already-valid ready Store", async () => {
  const { service, calls } = createService({
    overrides: {
      async findStore() {
        return {
          status: "success",
          data: { ...defaultStore, status: "ready" },
        }
      },
    },
  })

  const result = await service.markStoreReady(ownStoreId)

  assert.equal(result.status, "success")
  assert.equal(result.store.status, "ready")
  assert.deepEqual(calls.ready, [])
})

test("markStoreReady rejects invalid persisted name and reserved slug", async (t) => {
  await t.test("blank name", async () => {
    const { service } = createService({
      overrides: {
        async findStore() {
          return {
            status: "success",
            data: { ...defaultStore, name: "   " },
          }
        },
      },
    })

    assert.deepEqual(
      await service.markStoreReady(ownStoreId),
      validationResult("name", "required")
    )
  })

  await t.test("reserved slug", async () => {
    const { service } = createService({
      overrides: {
        async findStore() {
          return {
            status: "success",
            data: { ...defaultStore, slug: "dashboard" },
          }
        },
      },
    })

    assert.deepEqual(
      await service.markStoreReady(ownStoreId),
      validationResult("slug", "reserved")
    )
  })

  await t.test("non-canonical slug", async () => {
    const { service } = createService({
      overrides: {
        async findStore() {
          return {
            status: "success",
            data: { ...defaultStore, slug: "Invalid Slug" },
          }
        },
      },
    })

    assert.deepEqual(
      await service.markStoreReady(ownStoreId),
      validationResult("slug", "invalid_format")
    )
  })
})

test("markStoreReady rejects activated and operational Stores", async (t) => {
  for (const store of [
    {
      ...defaultStore,
      status: "ready",
      activatedAt: "2026-08-27T10:00:00.000Z",
    },
    {
      ...defaultStore,
      status: "active",
      activatedAt: "2026-08-27T10:00:00.000Z",
    },
  ]) {
    await t.test(`${store.status}:${store.activatedAt}`, async () => {
      const { service, calls } = createService({
        overrides: {
          async findStore() {
            return { status: "success", data: store }
          },
        },
      })

      assert.deepEqual(await service.markStoreReady(ownStoreId), {
        status: "store_unavailable",
      })
      assert.deepEqual(calls.ready, [])
    })
  }
})

test("markStoreReady reports a concurrent persisted change", async () => {
  const { service } = createService({
    overrides: {
      async markStoreReady() {
        return { status: "setup_changed" }
      },
    },
  })

  assert.deepEqual(await service.markStoreReady(ownStoreId), {
    status: "setup_changed",
  })
})

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return collectSourceFiles(absolutePath)
      }

      return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : []
    })
  )

  return nested.flat()
}

test("Store domain boundaries are server-only and contain no billing or activation work", async () => {
  const publicSource = await readFile(
    new URL("../../lib/stores/store-setup.ts", import.meta.url),
    "utf8"
  )
  const internalSource = await readFile(
    new URL("../../lib/stores/store-setup.internal.ts", import.meta.url),
    "utf8"
  )
  const repositorySource = await readFile(
    new URL("../../lib/stores/store-setup.repository.ts", import.meta.url),
    "utf8"
  )
  const combined = `${publicSource}\n${internalSource}\n${repositorySource}`

  assert.match(publicSource, /^import "server-only"/)
  assert.match(internalSource, /^import "server-only"/)
  assert.match(repositorySource, /^import "server-only"/)
  assert.match(publicSource, /await auth\(\)/)
  assert.match(repositorySource, /createServerSupabaseClient\(\)/)
  assert.match(repositorySource, /createAdminSupabaseClient\(\)/)
  assert.doesNotMatch(combined, /resolveOrganizationEntitlement/)
  assert.doesNotMatch(combined, /billing_trial_grants/)
  assert.doesNotMatch(combined, /@\/lib\/stripe/)
  assert.doesNotMatch(combined, /\.delete\s*\(/)
  assert.doesNotMatch(combined, /status:\s*["']active["']/)
})

test("repository writes use only narrow trusted Store setup RPCs", async () => {
  const source = await readFile(
    new URL("../../lib/stores/store-setup.repository.ts", import.meta.url),
    "utf8"
  )

  assert.match(source, /\.rpc\("create_store_draft"/)
  assert.match(source, /\.rpc\("update_store_setup"/)
  assert.match(source, /\.rpc\("mark_store_ready"/)
  assert.doesNotMatch(source, /\.from\("stores"\)\s*\.insert/s)
  assert.doesNotMatch(source, /\.from\("stores"\)\s*\.update/s)
  assert.doesNotMatch(source, /export.*createAdminSupabaseClient/)
})

test("app and components do not import privileged Store infrastructure", async () => {
  const roots = [
    fileURLToPath(new URL("../../app", import.meta.url)),
    fileURLToPath(new URL("../../components", import.meta.url)),
  ]

  for (const root of roots) {
    const files = await collectSourceFiles(root)

    for (const file of files) {
      const source = await readFile(file, "utf8")
      assert.doesNotMatch(source, /lib\/supabase\/admin/)
      assert.doesNotMatch(source, /store-setup\.repository/)
    }
  }
})
