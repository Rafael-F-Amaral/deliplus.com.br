// Test-only TS/TSX loader for the Dashboard Server Component. It replaces
// only framework/request boundaries and the approved Dashboard Overview API.
import { existsSync, readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

import ts from "typescript"

const root = new URL("../../", import.meta.url)
const moduleUrl = (source) =>
  `data:text/javascript,${encodeURIComponent(source)}`

const mocks = new Map([
  ["server-only", moduleUrl("export {}")],
  [
    "next/navigation",
    moduleUrl(`
      export function redirect(url) { throw Object.assign(new Error("Redirect control flow"), { redirectUrl: url }) }
    `),
  ],
  [
    "next/link",
    moduleUrl(
      `import React from ${JSON.stringify(import.meta.resolve("react"))}; export default function Link({children, ...props}) { return React.createElement("a", props, children) }`
    ),
  ],
  [
    "@/lib/dashboard/dashboard-overview",
    moduleUrl(`
      export async function getDashboardOverview(...args) {
        const state = globalThis.__dashboardUiTest
        state.overviewCalls.push(args)
        if (state.overviewError) throw state.overviewError
        return state.overviewResult
      }
    `),
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
        throw new Error("Dashboard UI test crossed an infrastructure boundary")
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
  throw new Error("Network is forbidden in Dashboard UI tests")
}
