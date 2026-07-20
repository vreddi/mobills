import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';

export function DocsSplitwise() {
  return (
    <DocsPage
      eyebrow="Integrations"
      title="Splitwise"
      lede="mobills' first integration automates adding each friend or family member's share of the mobile bill as a Splitwise transaction — no manual expense entry."
    >
      <H2>What it does</H2>
      <P>
        Once your members are linked to their Splitwise accounts, mobills can
        turn a bill cycle into individual Splitwise expenses: each person's
        share of that cycle's bill, charged from you to them, itemized against
        the plan.
        Your group settles up in Splitwise the way they already do for rent and
        dinners.
      </P>
      <H2>Link members to Splitwise</H2>
      <P>
        Find each person's numeric Splitwise user id (visible in the Splitwise
        friend URL) and attach it when adding — or re-adding — the member:
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member add --account fam_plan_01 --name "Priya" \\
    --line-type additional --splitwise-id 18442
✓ Added Priya · additional line · splitwise:18442`}
      />
      <P>
        Members without a <Code>--splitwise-id</Code> are simply skipped by the
        integration — useful for lines you don't charge, like your own.
      </P>
      <H2>Verify the mapping</H2>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member list --account fam_plan_01
  NAME     LINE         SPLITWISE
  Vish     primary      —
  Priya    additional   18442`}
      />
      <Callout>
        More integrations are on the roadmap. Have a service your group settles
        up with? Suggest it on{' '}
        <a
          href="https://github.com/vreddi/mobills/issues"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          GitHub issues
        </a>
        .
      </Callout>
      <PagerNav prev={{ to: '/docs/commands/member', label: 'mobills member' }} />
    </DocsPage>
  );
}
