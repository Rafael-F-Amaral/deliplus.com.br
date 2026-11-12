import { auth, clerkClient } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { listStoresForSetup } from "@/lib/stores/store-setup"
import { cn } from "@/lib/utils"

import { NewStoreForm } from "./new-store-form"

export const metadata: Metadata = { title: "Primeira loja | Deli Plus" }

export const dynamic = "force-dynamic"

async function readFirstStoreInitialName() {
  try {
    const storesResult = await listStoresForSetup()

    if (storesResult.status !== "success" || storesResult.stores.length !== 0) {
      return ""
    }

    const { orgId } = await auth()

    if (!orgId) return ""

    const client = await clerkClient()
    const organization = await client.organizations.getOrganization({
      organizationId: orgId,
    })

    return organization.name.trim()
  } catch {
    return ""
  }
}

export default async function NewStorePage() {
  const initialName = await readFirstStoreInitialName()

  return (
    <main className="flex min-h-dvh items-center px-4 py-10 pb-24 lg:pb-12 sm:px-6">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#B4482D] dark:text-[#FF7D4F] uppercase">
          Deli Plus · Configuração inicial
        </p>
        <Card className="bg-white dark:bg-[#1B241E] border-[#E9E4D4] dark:border-[#2A382E] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1F2E22] dark:text-[#F2EFE9]">
              <h1>Crie sua primeira loja</h1>
            </CardTitle>
            <CardDescription className="text-[#525B4E] dark:text-[#9CA79E]">
              Informe o nome e o endereço da vitrine. Nós cuidamos da preparação
              e publicação em um único passo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewStoreForm initialName={initialName} />
          </CardContent>
          <CardFooter className="flex-wrap gap-3">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "dark:border-[#2A382E] dark:bg-[#25332A] dark:text-[#F2EFE9] dark:hover:bg-[#2E3F34]"
              )}
            >
              Fazer isso depois
            </Link>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
