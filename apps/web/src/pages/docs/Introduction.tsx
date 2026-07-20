import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';

export function DocsIntroduction() {
  return (
    <DocsPage
      eyebrow="Getting started"
      title="Introduction"
      lede="mobills is a command-line tool for running a shared mobile bill. Model your account and its lines once, then keep everyone's share tracked — and synced to Splitwise — from your terminal."
    >
      <P>
        If you own the family plan, you know the ritual: the bill lands, you
        open a spreadsheet, you do the math, you chase people. mobills replaces
        that with a small, scriptable CLI backed by a real database (Convex) and
        real authentication (Clerk).
      </P>
      <H2>How it works</H2>
      <P>
        Everything hangs off two concepts. An <Code>account</Code> represents a
        mobile plan you track — its name, carrier account number and plan. A{' '}
        <Code>member</Code> is a line on that account — a person with a line
        type and optionally a Splitwise id used to automate settling up.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills account create --name "Family Plan" --plan "Magenta MAX"
✓ Created account fam_plan_01

$ mobills member add --account fam_plan_01 --name "Priya" --line-type additional
✓ Added Priya`}
      />
      <H2>What you'll need</H2>
      <P>
        Node.js 20+, pnpm, and access to the project's Convex deployment and
        Clerk application. The next two pages cover installing the CLI and
        wiring up authentication.
      </P>
      <Callout>
        mobills is under active development — commands and flags may change
        before a stable release.
      </Callout>
      <PagerNav next={{ to: '/docs/installation', label: 'Installation' }} />
    </DocsPage>
  );
}
