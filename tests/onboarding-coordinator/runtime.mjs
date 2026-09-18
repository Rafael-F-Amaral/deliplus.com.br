// Test-only TS/TSX loader using the already installed TypeScript compiler.
// Exercise the actual coordinator while substituting only request boundaries.
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
      export async function auth(...args) { const s = globalThis.__onboardingCoordinatorTest; s.clerkAuthReads.push(args); return { orgId: s.clerkOrganizationId } }
      export async function clerkClient(...args) {
        const s = globalThis.__onboardingCoordinatorTest
        s.clerkClientReads.push(args)
        return {
          organizations: {
            async getOrganization(...organizationArgs) {
              s.clerkOrganizationReads.push(organizationArgs)
              return s.clerkOrganization
            },
          },
        }
      }
    `),
  ],
  [
    "next/navigation",
    moduleUrl(
      `export function redirect(url) { throw Object.assign(new Error("Redirect control flow"), { redirectUrl: url }) }`
    ),
  ],
  [
    "next/link",
    moduleUrl(
      `import React from ${JSON.stringify(import.meta.resolve("react"))}; export default function Link({children, ...props}) { return React.createElement("a", props, children) }`
    ),
  ],
  [
    "@clerk/nextjs",
    moduleUrl(
      `import React from ${JSON.stringify(import.meta.resolve("react"))}; export function OrganizationList(props) { return React.createElement("div", { "data-organization-list": "true", "data-hide-personal": String(props.hidePersonal), "data-after-create": props.afterCreateOrganizationUrl, "data-after-select": props.afterSelectOrganizationUrl }) }`
    ),
  ],
  [
    "@/lib/onboarding/resolve-onboarding-state",
    moduleUrl(
      `export async function resolveOnboardingState(...args) { const s = globalThis.__onboardingCoordinatorTest; s.onboardingReads.push(args); if (s.onboardingError) throw s.onboardingError; return s.onboarding }`
    ),
  ],
  [
    "@/lib/stores/store-setup",
    moduleUrl(
      `
        export async function listStoresForSetup(...args) { const s = globalThis.__onboardingCoordinatorTest; s.storeReads.push(args); if (s.storeError) throw s.storeError; return s.stores }
        export async function createDraftStore(...args) { const s = globalThis.__onboardingCoordinatorTest; s.createCalls.push(args); return s.createResult }
        export async function markStoreReady(...args) { const s = globalThis.__onboardingCoordinatorTest; s.readyCalls?.push(args); return s.readyResult }
      `
    ),
  ],
  [
    "@/lib/stores/activate-store-for-current-organization",
    moduleUrl(
      `export async function activateStoreForCurrentOrganization(...args) { const s = globalThis.__onboardingCoordinatorTest; s.publishCalls?.push(args); return s.publishResult }`
    ),
  ],
  [
    "@/lib/organizations/ensure-active-organization",
    moduleUrl(
      `export async function ensureActiveOrganization(...args) { const s = globalThis.__onboardingCoordinatorTest; s.provisions.push(args); if (s.provisioningError) throw s.provisioningError; return s.provisioning }`
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
          "Coordinator test crossed a forbidden infrastructure boundary"
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
  throw new Error("Network is forbidden in onboarding coordinator tests")
}
