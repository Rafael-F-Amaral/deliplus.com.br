import "server-only"

import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing required Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    async accessToken() {
      return (await auth()).getToken()
    },
  })
}
