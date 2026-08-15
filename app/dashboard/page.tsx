import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <main className="flex min-h-svh items-center px-6 py-16 sm:px-10 lg:px-16">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Deli Plus
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Dashboard
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Em breve, este será o painel para gerenciar o seu estabelecimento.
          </p>
        </div>

        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Voltar para Home
        </Link>
      </section>
    </main>
  )
}
