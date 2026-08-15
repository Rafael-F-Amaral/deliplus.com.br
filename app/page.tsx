import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="relative flex min-h-svh items-center overflow-hidden px-6 py-16 sm:px-10 lg:px-16">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-40 size-96 rounded-full border-[4rem] border-primary/20 sm:-right-24 sm:size-[30rem]"
      />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-8">
        <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Deli Plus
        </p>

        <div className="flex max-w-3xl flex-col gap-5">
          <h1 className="text-5xl leading-[0.95] font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-7xl">
            Seu delivery, do seu jeito.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Uma plataforma para restaurantes, pizzarias, lanchonetes, açaís e
            outros estabelecimentos gerenciarem seus pedidos online em um só
            lugar.
          </p>
        </div>

        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          Acessar Dashboard
        </Link>
      </section>
    </main>
  )
}
