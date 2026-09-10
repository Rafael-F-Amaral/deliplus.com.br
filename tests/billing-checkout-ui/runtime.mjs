// Test-only TS/TSX loader using the already installed TypeScript compiler.
// Exercise actual Actions/pages/components, substituting only external boundaries.
import { registerHooks } from "node:module"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"

const root = new URL("../../", import.meta.url)
const moduleUrl = (source) =>
  `data:text/javascript,${encodeURIComponent(source)}`
const mocks = new Map([
  ["server-only", moduleUrl("export {}")],
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
    "@clerk/nextjs/server",
    moduleUrl(
      `export async function auth() { const s = globalThis.__billingUiTest; if(s.authError) throw s.authError; return s.auth }`
    ),
  ],
  [
    "@/lib/billing/subscription-checkout",
    moduleUrl(
      `export async function createSubscriptionCheckoutSession(...args) { const s = globalThis.__billingUiTest; s.calls.push(args); if(s.checkoutError) throw s.checkoutError; return s.checkout }`
    ),
  ],
  [
    "@/lib/billing/organization-entitlement",
    moduleUrl(`
    export class OrganizationEntitlementPreconditionError extends Error { constructor(code) { super("precondition"); this.code = code } }
    export async function resolveOrganizationEntitlement(...args) { const s = globalThis.__billingUiTest; s.reads.push(args); if(s.entitlementError) throw s.entitlementError; return s.entitlement }
  `),
  ],
  [
    "@/lib/onboarding/resolve-onboarding-state",
    moduleUrl(
      `export async function resolveOnboardingState(...args) { const s = globalThis.__billingUiTest; s.onboardingReads.push(args); if(s.onboardingError) throw s.onboardingError; return s.onboarding }`
    ),
  ],
  [
    "@/lib/organizations/ensure-active-organization",
    moduleUrl(
      `export async function ensureActiveOrganization(...args) { const s = globalThis.__billingUiTest; s.provisions.push(args); if(s.provisioningError) throw s.provisioningError; return s.provisioning }`
    ),
  ],
])

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (mocks.has(specifier))
      return { url: mocks.get(specifier), shortCircuit: true }
    let url
    if (specifier.startsWith("@/")) url = new URL(specifier.slice(2), root)
    else if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(root.href) &&
      !context.parentURL.includes("node_modules")
    )
      url = new URL(specifier, context.parentURL)
    if (url) {
      for (const suffix of ["", ".ts", ".tsx", ".mjs"]) {
        const path = fileURLToPath(url) + suffix
        if (existsSync(path))
          return { url: pathToFileURL(path).href, shortCircuit: true }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root.href) && !url.includes("node_modules")) {
      if (/\/lib\/(stripe|supabase)\//u.test(url))
        throw new Error("UI test crossed a forbidden infrastructure boundary")
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
  throw new Error("Network is forbidden in billing UI tests")
}
