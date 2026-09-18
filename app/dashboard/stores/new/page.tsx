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
    <main className="flex min-h-svh items-center px-6 py-16 sm:px-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Deli Plus · Configuração inicial
        </p>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Crie sua primeira loja</h1>
            </CardTitle>
            <CardDescription>
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
              className={buttonVariants({ variant: "outline" })}
            >
              Fazer isso depois
            </Link>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
