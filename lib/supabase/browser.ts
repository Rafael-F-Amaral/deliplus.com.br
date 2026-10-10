import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

let browserClient: ReturnType<typeof createClient<Database>> | null = null

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

  browserClient = createClient<Database>(url, key)
  return browserClient
}
