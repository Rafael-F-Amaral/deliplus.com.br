import "./runtime.mjs"

import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { readFile } from "node:fs/promises"
import { renderToStaticMarkup } from "react-dom/server"

const { createAndPublishStoreAction } =
  await import("../../app/dashboard/stores/new/actions.ts")
const {
  applyStoreNameChange,
  applyStoreSlugChange,
  createInitialNewStoreFields,
} = await import("../../app/dashboard/stores/new/slug-suggestion.ts")
const { mutateStoreSetupAction } =
  await import("../../app/dashboard/stores/[storeId]/setup/actions.ts")
const { default: NewStorePage } =
  await import("../../app/dashboard/stores/new/page.tsx")
const { default: StoreSetupPage } =
  await import("../../app/dashboard/stores/[storeId]/setup/page.tsx")

const storeId = "c2000000-0000-0000-0000-000000000001"
const store = {
  id: storeId,
  name: "Pizzaria do Bairro",
  slug: "pizzaria-do-bairro",
  status: "draft",
  updatedAt: "2026-09-10T12:00:00Z",
}

beforeEach(() => {
  globalThis.__storeActivationTest = {
    createResult: { status: "success", store },
    getResult: { status: "success", store },
    updateResult: { status: "success", store },
    readyResult: {
      status: "success",
      store: { ...store, status: "ready", updatedAt: "2026-09-10T12:01:00Z" },
    },
    publishResult: { status: "activated", storeId },
    listResult: { status: "success", stores: [] },
    clerkOrganizationId: "org_test",
    organization: { name: "Pizzaria do João" },
    createCalls: [],
    listCalls: [],
    getCalls: [],
    updateCalls: [],
    readyCalls: [],
    publishCalls: [],
    authCalls: [],
    clerkClientCalls: [],
    organizationCalls: [],
    revalidations: [],
  }
})

function form(fields) {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.append(name, value)
  return data
}

test("the primary first-Store flow creates, marks ready, activates, and redirects", async () => {
  const data = form({
    name: "Pizzaria do Bairro",
    slug: "pizzaria-do-bairro",
    organizationId: "org_attacker",
    planCode: "multi_3",
    maxStores: "99",
  })

  await assert.rejects(
    createAndPublishStoreAction({ kind: "idle" }, data),
    (error) => error.redirectUrl === "/dashboard?storePublished=1"
  )
  assert.deepEqual(globalThis.__storeActivationTest.createCalls, [
    [{ name: "Pizzaria do Bairro", slug: "pizzaria-do-bairro" }],
  ])
  assert.deepEqual(globalThis.__storeActivationTest.readyCalls, [[storeId]])
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [[storeId]])
  assert.deepEqual(globalThis.__storeActivationTest.updateCalls, [])
})

test("the first Store initializes name and suggested slug from the Organization name", async () => {
  const markup = renderToStaticMarkup(await NewStorePage())

  assert.match(markup, /value="Pizzaria do João"/u)
  assert.match(markup, /value="pizzaria-do-joao"/u)
  assert.deepEqual(globalThis.__storeActivationTest.listCalls, [[]])
  assert.deepEqual(globalThis.__storeActivationTest.authCalls, [[]])
  assert.deepEqual(globalThis.__storeActivationTest.clerkClientCalls, [[]])
  assert.deepEqual(globalThis.__storeActivationTest.organizationCalls, [
    [{ organizationId: "org_test" }],
  ])
})

test("the Organization name remains an editable initial Store name", () => {
  const initial = createInitialNewStoreFields("Pizzaria do João")

  assert.deepEqual(initial, {
    name: "Pizzaria do João",
    slug: "pizzaria-do-joao",
    slugEdited: false,
  })

  assert.deepEqual(applyStoreNameChange(initial, "Pizzaria da Maria"), {
    name: "Pizzaria da Maria",
    slug: "pizzaria-da-maria",
    slugEdited: false,
  })
})

test("a custom slug is not overwritten by later Store name edits", () => {
  const initial = createInitialNewStoreFields("Pizzaria do João")
  const edited = applyStoreSlugChange(initial, "pizza-do-bairro")

  assert.equal(edited.slug, "pizza-do-bairro")
  assert.equal(edited.slugEdited, true)

  assert.deepEqual(applyStoreNameChange(edited, "Novo nome da pizzaria"), {
    name: "Novo nome da pizzaria",
    slug: "pizza-do-bairro",
    slugEdited: true,
  })
})

test("an Organization with an existing Store receives no Organization-name default", async () => {
  globalThis.__storeActivationTest.listResult = {
    status: "success",
    stores: [store],
  }

  const markup = renderToStaticMarkup(await NewStorePage())

  assert.match(markup, /name="name" value=""/u)
  assert.match(markup, /name="slug" value=""/u)
  assert.deepEqual(globalThis.__storeActivationTest.listCalls, [[]])
  assert.deepEqual(globalThis.__storeActivationTest.authCalls, [])
  assert.deepEqual(globalThis.__storeActivationTest.clerkClientCalls, [])
  assert.deepEqual(globalThis.__storeActivationTest.organizationCalls, [])
})

test("a missing Organization name safely leaves the first-Store form empty", async () => {
  globalThis.__storeActivationTest.organization = { name: "   " }

  const markup = renderToStaticMarkup(await NewStorePage())

  assert.match(markup, /name="name" value=""/u)
  assert.match(markup, /name="slug" value=""/u)
  assert.match(markup, /Criar e publicar minha loja/u)
})

test("ready failure preserves the draft and retry never creates a duplicate Store", async () => {
  globalThis.__storeActivationTest.readyResult = { status: "setup_changed" }

  const firstResult = await createAndPublishStoreAction(
    { kind: "idle" },
    form({ name: store.name, slug: store.slug })
  )

  assert.deepEqual(firstResult, {
    kind: "business",
    status: "setup_changed",
    recovery: { storeId, stage: "draft" },
  })
  assert.equal(globalThis.__storeActivationTest.createCalls.length, 1)
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [])

  globalThis.__storeActivationTest.readyResult = {
    status: "success",
    store: { ...store, status: "ready" },
  }

  await assert.rejects(
    createAndPublishStoreAction(firstResult, new FormData()),
    (error) => error.redirectUrl === "/dashboard?storePublished=1"
  )
  assert.equal(globalThis.__storeActivationTest.createCalls.length, 1)
  assert.deepEqual(globalThis.__storeActivationTest.readyCalls, [
    [storeId],
    [storeId],
  ])
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [[storeId]])
})

test("activation failure preserves ready state and retry resumes at publication", async () => {
  globalThis.__storeActivationTest.publishResult = {
    status: "capacity_reached",
  }

  const firstResult = await createAndPublishStoreAction(
    { kind: "idle" },
    form({ name: store.name, slug: store.slug })
  )

  assert.deepEqual(firstResult, {
    kind: "business",
    status: "capacity_reached",
    recovery: { storeId, stage: "ready" },
  })

  globalThis.__storeActivationTest.publishResult = {
    status: "already_active",
    storeId,
  }

  await assert.rejects(
    createAndPublishStoreAction(firstResult, new FormData()),
    (error) => error.redirectUrl === "/dashboard?storePublished=1"
  )
  assert.equal(globalThis.__storeActivationTest.createCalls.length, 1)
  assert.equal(globalThis.__storeActivationTest.readyCalls.length, 1)
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [
    [storeId],
    [storeId],
  ])
})

test("subscription-required preserves the ready Store for setup and Billing recovery", async () => {
  globalThis.__storeActivationTest.publishResult = {
    status: "subscription_required",
  }

  assert.deepEqual(
    await createAndPublishStoreAction(
      { kind: "idle" },
      form({ name: store.name, slug: store.slug })
    ),
    {
      kind: "business",
      status: "subscription_required",
      recovery: { storeId, stage: "ready" },
    }
  )
})

test("member rejection stops the first-Store flow before readiness and activation", async () => {
  globalThis.__storeActivationTest.createResult = { status: "forbidden" }

  assert.deepEqual(
    await createAndPublishStoreAction(
      { kind: "idle" },
      form({ name: store.name, slug: store.slug })
    ),
    { kind: "business", status: "forbidden" }
  )
  assert.equal(globalThis.__storeActivationTest.createCalls.length, 1)
  assert.deepEqual(globalThis.__storeActivationTest.readyCalls, [])
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [])
})

test("unexpected activation failure remains safe and retry reuses the ready Store", async () => {
  globalThis.__storeActivationTest.publishError = new Error(
    "raw SQL and tenant detail"
  )

  const firstResult = await createAndPublishStoreAction(
    { kind: "idle" },
    form({ name: store.name, slug: store.slug })
  )

  assert.deepEqual(firstResult, {
    kind: "error",
    recovery: { storeId, stage: "ready" },
  })

  globalThis.__storeActivationTest.publishError = undefined
  await assert.rejects(
    createAndPublishStoreAction(firstResult, new FormData()),
    (error) => error.redirectUrl === "/dashboard?storePublished=1"
  )
  assert.equal(globalThis.__storeActivationTest.createCalls.length, 1)
  assert.equal(globalThis.__storeActivationTest.readyCalls.length, 1)
  assert.equal(globalThis.__storeActivationTest.publishCalls.length, 2)
})

test("save uses only updateStoreSetup and keeps readiness explicit", async () => {
  const result = await mutateStoreSetupAction(
    { kind: "idle" },
    form({
      storeId,
      intent: "save",
      name: "Novo nome",
      slug: "novo-endereco",
      status: "active",
      entitlement: "paid",
    })
  )

  assert.equal(result.kind, "store")
  assert.equal(result.status, "saved")
  assert.deepEqual(globalThis.__storeActivationTest.updateCalls, [
    [storeId, { name: "Novo nome", slug: "novo-endereco" }],
  ])
  assert.deepEqual(globalThis.__storeActivationTest.readyCalls, [])
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [])
})

test("ready intent calls only markStoreReady with the Store selector", async () => {
  const result = await mutateStoreSetupAction(
    { kind: "idle" },
    form({
      storeId,
      intent: "ready",
      name: "Forged unsaved name",
      planCode: "essential",
    })
  )

  assert.equal(result.kind, "store")
  assert.equal(result.status, "ready")
  assert.deepEqual(globalThis.__storeActivationTest.readyCalls, [[storeId]])
  assert.deepEqual(globalThis.__storeActivationTest.updateCalls, [])
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [])
})

test("publish calls only the activation coordinator and redirects with presentation feedback", async () => {
  await assert.rejects(
    mutateStoreSetupAction(
      { kind: "idle" },
      form({
        storeId,
        intent: "publish",
        organizationId: "org_attacker",
        entitlementSource: "trial",
        trialEligible: "true",
      })
    ),
    (error) => error.redirectUrl === "/dashboard?storePublished=1"
  )

  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [[storeId]])
  assert.deepEqual(globalThis.__storeActivationTest.updateCalls, [])
  assert.deepEqual(globalThis.__storeActivationTest.readyCalls, [])
})

test("subscription-required remains a business result for Billing recovery", async () => {
  globalThis.__storeActivationTest.publishResult = {
    status: "subscription_required",
  }

  assert.deepEqual(
    await mutateStoreSetupAction(
      { kind: "idle" },
      form({ storeId, intent: "publish" })
    ),
    { kind: "business", status: "subscription_required" }
  )
})

test("invalid and duplicated mutation selectors never invoke a domain operation", async () => {
  const data = form({ storeId, intent: "publish" })
  data.append("intent", "save")

  assert.deepEqual(await mutateStoreSetupAction({ kind: "idle" }, data), {
    kind: "business",
    status: "invalid_input",
  })
  assert.deepEqual(globalThis.__storeActivationTest.publishCalls, [])
})

test("the new route renders one primary action while setup remains explicit recovery", async () => {
  const newMarkup = renderToStaticMarkup(await NewStorePage())
  const setupMarkup = renderToStaticMarkup(
    await StoreSetupPage({ params: Promise.resolve({ storeId }) })
  )

  assert.match(newMarkup, /Nome da loja/)
  assert.match(newMarkup, /Endereço público/)
  assert.match(newMarkup, /Criar e publicar minha loja/)
  assert.doesNotMatch(newMarkup, /Marcar como pronta|Publicar loja/)
  assert.match(setupMarkup, /Salvar alterações/)
  assert.match(setupMarkup, /Marcar como pronta/)
  assert.match(setupMarkup, /Publicar loja/)
  assert.deepEqual(globalThis.__storeActivationTest.getCalls, [[storeId]])
})

test("frontend imports only public Store boundaries and never chooses trial versus paid", async () => {
  const files = [
    "../../app/dashboard/stores/new/actions.ts",
    "../../app/dashboard/stores/new/new-store-form.tsx",
    "../../app/dashboard/stores/new/page.tsx",
    "../../app/dashboard/stores/[storeId]/setup/actions.ts",
    "../../app/dashboard/stores/[storeId]/setup/store-setup-form.tsx",
    "../../app/dashboard/stores/[storeId]/setup/page.tsx",
  ]
  const combined = (
    await Promise.all(
      files.map((file) => readFile(new URL(file, import.meta.url), "utf8"))
    )
  ).join("\n")

  assert.match(combined, /createDraftStore/)
  assert.match(combined, /updateStoreSetup/)
  assert.match(combined, /markStoreReady/)
  assert.match(combined, /activateStoreForCurrentOrganization/)
  assert.match(combined, /href="\/dashboard\/billing"/)
  assert.doesNotMatch(combined, /activateFirstStoreWithInitialTrial/)
  assert.doesNotMatch(combined, /activateStoreWithinEntitlement/)
  assert.doesNotMatch(combined, /resolveOrganizationEntitlement/)
  assert.doesNotMatch(combined, /supabase\/admin|createAdminSupabaseClient/)
  assert.doesNotMatch(combined, /@\/lib\/stripe|getStripe/)

  const newStoreAction = await readFile(
    new URL("../../app/dashboard/stores/new/actions.ts", import.meta.url),
    "utf8"
  )
  assert.doesNotMatch(newStoreAction, /updateStoreSetup/)
})

test("Store forms keep submitted fields controlled across safe failures", async () => {
  const newStoreForm = await readFile(
    new URL(
      "../../app/dashboard/stores/new/new-store-form.tsx",
      import.meta.url
    ),
    "utf8"
  )
  const setupForm = await readFile(
    new URL(
      "../../app/dashboard/stores/[storeId]/setup/store-setup-form.tsx",
      import.meta.url
    ),
    "utf8"
  )

  assert.match(newStoreForm, /value=\{fields\.name\}/)
  assert.match(newStoreForm, /value=\{fields\.slug\}/)
  assert.match(newStoreForm, /applyStoreNameChange/)
  assert.match(newStoreForm, /applyStoreSlugChange/)
  assert.match(newStoreForm, /disabled=\{fieldsLocked\}/)

  assert.match(setupForm, /value=\{name\}/)
  assert.match(setupForm, /value=\{slug\}/)
  assert.match(
    setupForm,
    /onChange=\{\(event\) => setName\(event\.target\.value\)\}/
  )
  assert.match(
    setupForm,
    /onChange=\{\(event\) => setSlug\(event\.target\.value\)\}/
  )
})
