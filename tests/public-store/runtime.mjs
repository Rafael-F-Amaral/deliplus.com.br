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
    moduleUrl(
      'export function notFound() { throw Object.assign(new Error("Not found"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }) }'
    ),
  ],
])

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.includes("clerk") ||
      /\/lib\/(billing|stripe|onboarding)\//.test(specifier)
    ) {
      throw new Error("Public Store must not depend on auth or billing")
    }
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
    if (
      url.startsWith(root.href) &&
      !url.includes("node_modules") &&
      /\.tsx?$/.test(url)
    ) {
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          fileName: fileURLToPath(url),
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
          },
        }).outputText,
      }
    }
    return nextLoad(url, context)
  },
})
