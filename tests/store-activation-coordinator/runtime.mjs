// Test-only TS/TSX loader. It exercises the actual coordinator and UI adapters
// while replacing only request/framework boundaries.
import { registerHooks } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"

const root = new URL("../../", import.meta.url)
const moduleUrl = (source) =>
  `data:text/javascript,${encodeURIComponent(source)}`

const mocks = new Map([
  ["server-only", moduleUrl("export {}")],
  [
    "@clerk/nextjs/server",
    moduleUrl(`
      export async function auth(...args) { const s = globalThis.__storeActivationTest; s.authCalls.push(args); return { orgId: s.clerkOrganizationId } }
      export async function clerkClient(...args) {
        const s = globalThis.__storeActivationTest
        s.clerkClientCalls.push(args)
        if (s.clerkClientError) throw s.clerkClientError
        return {
          organizations: {
            async getOrganization(...organizationArgs) {
              s.organizationCalls.push(organizationArgs)
              if (s.organizationError) throw s.organizationError
              return s.organization
            },
          },
        }
      }
    `),
  ],
  [
    "next/navigation",
    moduleUrl(`
      export function redirect(url) { throw Object.assign(new Error("Redirect control flow"), { redirectUrl: url }) }
      export function notFound() { throw Object.assign(new Error("Not found control flow"), { notFound: true }) }
    `),
  ],
  [
    "next/cache",
    moduleUrl(
      `export function revalidatePath(path) { globalThis.__storeActivationTest.revalidations.push(path) }`
    ),
  ],
  [
    "next/link",
    moduleUrl(
      `import React from ${JSON.stringify(import.meta.resolve("react"))}; export default function Link({children, ...props}) { return React.createElement("a", props, children) }`
    ),
  ],
  [
    "@/lib/stores/store-setup",
    moduleUrl(`
      export async function listStoresForSetup(...args) { const s = globalThis.__storeActivationTest; s.listCalls.push(args); if (s.listError) throw s.listError; return s.listResult }
      export async function createDraftStore(...args) { const s = globalThis.__storeActivationTest; s.createCalls.push(args); if (s.createError) throw s.createError; return s.createResult }
      export async function getStoreForSetup(...args) { const s = globalThis.__storeActivationTest; s.getCalls.push(args); if (s.getError) throw s.getError; return s.getResult }
      export async function updateStoreSetup(...args) { const s = globalThis.__storeActivationTest; s.updateCalls.push(args); if (s.updateError) throw s.updateError; return s.updateResult }
      export async function markStoreReady(...args) { const s = globalThis.__storeActivationTest; s.readyCalls.push(args); if (s.readyError) throw s.readyError; return s.readyResult }
    `),
  ],
  [
    "@/lib/stores/activate-store-for-current-organization",
    moduleUrl(
      `export async function activateStoreForCurrentOrganization(...args) { const s = globalThis.__storeActivationTest; s.publishCalls.push(args); if (s.publishError) throw s.publishError; return s.publishResult }`
    ),
  ],
])

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (mocks.has(specifier)) {
      return { url: mocks.get(specifier), shortCircuit: true }
    }

    let url
    if (specifier.startsWith("@/")) url = new URL(specifier.slice(2), root)
    else if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(root.href) &&
      !context.parentURL.includes("node_modules")
    ) {
      url = new URL(specifier, context.parentURL)
    }

    if (url) {
      for (const suffix of ["", ".ts", ".tsx", ".mjs"]) {
        const path = fileURLToPath(url) + suffix
        if (existsSync(path)) {
          return { url: pathToFileURL(path).href, shortCircuit: true }
        }
      }
    }

    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root.href) && !url.includes("node_modules")) {
      if (/\/lib\/(stripe|supabase)\//u.test(url)) {
        throw new Error(
          "Store activation test crossed an infrastructure boundary"
        )
      }

      if (/\.tsx?$/u.test(url)) {
        const source = readFileSync(new URL(url), "utf8")
        return {
          format: "module",
          shortCircuit: true,
          source: ts.transpileModule(source, {
            fileName: fileURLToPath(url),
            compilerOptions: {
              module: ts.ModuleKind.ESNext,
              target: ts.ScriptTarget.ES2022,
              jsx: ts.JsxEmit.ReactJSX,
            },
          }).outputText,
        }
      }
    }

    return nextLoad(url, context)
  },
})

globalThis.fetch = async () => {
  throw new Error("Network is forbidden in Store activation tests")
}
