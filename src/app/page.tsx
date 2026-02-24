import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Compass,
  Handshake,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  currentStage,
  heroContent,
  operatingLoop,
  pillars,
  primitives,
} from "@/lib/landing-content"

const pillarIcon = {
  autonomy: Sparkles,
  interaction: Handshake,
  governance: ShieldCheck,
} as const

export default function Home() {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden">
      <div className="boa-grid pointer-events-none absolute inset-0" />
      <div className="boa-glow pointer-events-none absolute -left-40 top-[-10rem] size-[34rem] rounded-full blur-3xl" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <a
          href="https://github.com/openboa-ai/openboa"
          className="group inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="inline-flex size-2 rounded-full bg-primary" />
          <span className="font-display text-base tracking-wide">openboa</span>
        </a>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <a
              href="https://github.com/openboa-ai/openboa"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <ArrowUpRight />
            </a>
          </Button>
          <Button variant="outline" size="sm" disabled aria-disabled="true">
            Discord
            <Badge variant="secondary" className="ml-1">
              Coming soon
            </Badge>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-12 lg:px-10 lg:pb-16">
        <section className="grid gap-6 rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-sm lg:grid-cols-[1.5fr_1fr] lg:p-8">
          <div className="space-y-6">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
              {heroContent.badge}
            </Badge>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {heroContent.headline}
              <span className="mt-2 block text-primary">{heroContent.title}</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {heroContent.description}
            </p>
            <p className="text-sm font-medium tracking-wide text-foreground/90 uppercase">
              {heroContent.subline}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <a
                  href="https://github.com/openboa-ai/openboa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source
                  <ArrowRight />
                </a>
              </Button>
              <Button variant="outline" disabled aria-disabled="true">
                Join Discord
                <Badge variant="secondary" className="ml-1">
                  Coming soon
                </Badge>
              </Button>
            </div>
          </div>

          <Card className="border-border/70 bg-background/70">
            <CardHeader>
              <CardTitle className="font-display text-lg">Mission</CardTitle>
              <CardDescription>
                Build durable businesses that evolve through agents without
                losing governance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <Scale className="size-4 text-primary" />
                Business continuity over single-agent fragility
              </p>
              <p className="inline-flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                Human direction with autonomous execution loops
              </p>
              <p className="inline-flex items-center gap-2">
                <Bot className="size-4 text-primary" />
                Agent formation based on current business need
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Why openboa
            </p>
            <h2 className="font-display text-3xl tracking-tight text-balance">
              Designed for operational continuity
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillarIcon[pillar.id]

              return (
                <Card key={pillar.id} className="border-border/70 bg-card/70">
                  <CardHeader className="gap-4">
                    <div className="inline-flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="font-display text-xl">
                        {pillar.title}
                      </CardTitle>
                      <CardDescription className="text-foreground/85">
                        {pillar.summary}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {pillar.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Core building blocks
            </p>
            <h2 className="font-display text-3xl tracking-tight text-balance">
              Business as Agent runtime primitives
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {primitives.map((primitive) => (
              <Card key={primitive.name} className="border-border/70 bg-card/70">
                <CardHeader className="gap-3">
                  <CardTitle className="font-display text-lg">
                    {primitive.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {primitive.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Operating loop
            </p>
            <h2 className="font-display text-3xl tracking-tight text-balance">
              {"Observe -> Plan -> Assign -> Execute -> Report -> Review"}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {operatingLoop.map((item, index) => (
              <Card
                key={item.step}
                className="border-border/70 bg-background/65 transition-colors hover:bg-background/90"
              >
                <CardHeader className="gap-3">
                  <Badge variant="outline" className="w-fit">
                    {String(index + 1).padStart(2, "0")}
                  </Badge>
                  <CardTitle className="font-display text-xl">
                    {item.step}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.detail}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm md:grid-cols-[1.2fr_1fr] lg:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              {currentStage.title}
            </p>
            <h2 className="font-display text-3xl tracking-tight text-balance">
              Early stage. Design-first.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {currentStage.description}
            </p>
          </div>

          <Card className="border-border/70 bg-background/70">
            <CardHeader>
              <CardTitle className="font-display text-lg">Non-goals</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {currentStage.nonGoals.map((item) => (
                  <li key={item} className="inline-flex gap-2 leading-6">
                    <span aria-hidden="true">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="mx-auto mt-4 flex w-full max-w-6xl flex-col gap-3 px-6 pb-8 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:pb-12">
        <p>MIT License. Copyright (c) 2026 openboa.</p>
        <a
          href="https://github.com/openboa-ai/openboa"
          className="inline-flex w-fit items-center gap-1 rounded-md font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/openboa-ai/openboa
          <ArrowUpRight className="size-4" />
        </a>
      </footer>
    </div>
  )
}
