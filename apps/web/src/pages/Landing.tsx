import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  Receipt,
  RefreshCw,
  TerminalSquare,
  Users,
} from 'lucide-react';
import { Button } from '@/components/motion/button/base';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { TextReveal } from '@/components/motion/text-reveal';
import { TiltCard } from '@/components/motion/tilt-card';
import { CopyButton } from '@/components/site/CopyButton';
import { Footer } from '@/components/site/Footer';
import { Nav } from '@/components/site/Nav';
import { Terminal } from '@/components/site/Terminal';

const INSTALL_COMMAND = 'pnpm add -g @mobills/cli';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <TerminalDemo />
      <Features />
      <Integrations />
      <DocsCallout />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft blurple glow behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-20rem] h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-24 text-center sm:pt-32">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-splitwise" />
          now syncing with Splitwise
        </span>
        <TextReveal
          as="h1"
          text={['One bill. Many lines.', 'Zero spreadsheets.']}
          className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
        />
        <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          mobills is a developer-friendly CLI for tracking a shared mobile bill.
          Model your account, split lines across friends and family, and push
          each person&apos;s share straight to Splitwise.
        </p>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-border bg-card py-1.5 pl-4 pr-1.5">
          <code className="font-mono text-sm text-foreground">
            <span className="select-none text-primary">$ </span>
            {INSTALL_COMMAND}
          </code>
          <CopyButton text={INSTALL_COMMAND} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/docs">
            <Button variant="primary" size="lg" className="rounded-lg">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="https://github.com/vreddi/mobills" target="_blank" rel="noreferrer">
            <Button variant="outline" size="lg" className="rounded-lg">
              View on GitHub
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function TerminalDemo() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-24">
      <ScrollReveal>
        <Terminal>
          <Cmd>mobills account create --name "Family Plan" --plan "Magenta MAX"</Cmd>
          <Ok>Created account fam_plan_01</Ok>
          <Blank />
          <Cmd>
            mobills member add --account fam_plan_01 --name "Priya" \
          </Cmd>
          <Out>
            {'    '}--line-type additional --monthly-share 35 --splitwise-id 18442
          </Out>
          <Ok>Added Priya · additional line · $35.00/mo · splitwise:18442</Ok>
          <Blank />
          <Cmd>mobills member list --account fam_plan_01</Cmd>
          <Out>{'  NAME     LINE         SHARE      SPLITWISE'}</Out>
          <Out>{'  Vish     primary      $45.00     —'}</Out>
          <Out>{'  Priya    additional   $35.00     18442'}</Out>
          <Out>{'  Rohan    additional   $35.00     20917'}</Out>
        </Terminal>
      </ScrollReveal>
    </section>
  );
}

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <span className="select-none text-primary">$ </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function Ok({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[#28c840]">✓ </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function Out({ children }: { children: React.ReactNode }) {
  return <div className="whitespace-pre text-muted-foreground">{children}</div>;
}

function Blank() {
  return <div>&nbsp;</div>;
}

const FEATURES = [
  {
    icon: Receipt,
    title: 'Model the whole bill',
    body: 'Accounts, plans and per-line monthly shares live in one place — the source of truth for who owes what each cycle.',
  },
  {
    icon: Users,
    title: 'Friends & family lines',
    body: 'Add primary and additional lines with names, emails and phone numbers. Everyone on the plan is one command away.',
  },
  {
    icon: RefreshCw,
    title: 'Splitwise, automated',
    body: 'Link members to their Splitwise ids and their share of the bill becomes an expense — no manual entry.',
  },
  {
    icon: KeyRound,
    title: 'Real auth, real backend',
    body: 'Backed by Convex with Clerk authentication. Your data is scoped to you, synced live, and never in a spreadsheet.',
  },
];

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <ScrollReveal>
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Built for the person who runs the plan
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          You keep the family plan alive. mobills keeps the ledger straight.
        </p>
      </ScrollReveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 0.06}>
            <div className="h-full rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function Integrations() {
  return (
    <section id="integrations" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
      <ScrollReveal>
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Integrations
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          mobills meets your group where the money already moves.
        </p>
      </ScrollReveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <ScrollReveal className="sm:col-span-2">
          <TiltCard max={6} className="h-full border border-splitwise/30 bg-card">
            <div className="flex h-full flex-col p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-splitwise/15 font-bold text-splitwise">
                  S
                </span>
                <div>
                  <h3 className="font-semibold">Splitwise</h3>
                  <span className="font-mono text-xs text-splitwise">live</span>
                </div>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                The only integration you need on bill day. Map each member to a
                Splitwise user once, and mobills automates adding their share of
                the mobile bill as a transaction with your friends and family —
                itemized, on time, every cycle.
              </p>
              <Link to="/docs/integrations/splitwise" className="mt-auto pt-6">
                <Button variant="outline" size="sm" className="rounded-lg">
                  Read the Splitwise guide
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </TiltCard>
        </ScrollReveal>
        <ScrollReveal delay={0.08}>
          <div className="flex h-full flex-col items-start justify-between rounded-2xl border border-dashed border-border p-8">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground">
                ?
              </span>
              <h3 className="mt-4 font-semibold text-muted-foreground">Your integration</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground/70">
                More integrations are on the roadmap. Tell us where your group
                settles up.
              </p>
            </div>
            <a
              href="https://github.com/vreddi/mobills/issues"
              target="_blank"
              rel="noreferrer"
              className="pt-6 text-sm text-primary transition-colors hover:text-primary/80"
            >
              Suggest one →
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function DocsCallout() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-12 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative">
            <TerminalSquare className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Five minutes to your first synced bill
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Install the CLI, authenticate with Clerk, create your account and
              add your members. The docs walk through every step.
            </p>
            <Link to="/docs" className="mt-6 inline-block">
              <Button variant="primary" size="lg" className="rounded-lg">
                <BookOpen className="h-4 w-4" />
                Open the docs
              </Button>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
