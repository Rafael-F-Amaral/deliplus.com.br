import { registerHooks } from "node:module"
import { existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = new URL("../../", import.meta.url)
const serverOnly = `data:text/javascript,${encodeURIComponent("export {}")}`
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only")
      return { url: serverOnly, shortCircuit: true }
    if (specifier.startsWith(".") && context.parentURL?.startsWith(root.href)) {
      const url = new URL(specifier, context.parentURL)
      for (const suffix of ["", ".ts", ".mjs"]) {
        const path = fileURLToPath(url) + suffix
        if (existsSync(path))
          return { url: pathToFileURL(path).href, shortCircuit: true }
      }
    }
    return nextResolve(specifier, context)
  },
})
