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

export const metadata: Metadata = { title: "Primeira loja | Deli Plus" }

export default function NewStorePage() {
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
              Seu espaço no Deli Plus está pronto para receber o primeiro
              estabelecimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A criação e a configuração da loja continuam em uma etapa
              separada. Nenhum período de teste começa apenas por chegar a esta
              página.
            </p>
          </CardContent>
          <CardFooter className="flex-wrap gap-3">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline" })}
            >
              Voltar ao dashboard
            </Link>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
