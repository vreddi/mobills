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
      <H2>Group or individual settling</H2>
      <P>
        Splitwise supports two ways of posting a shared expense, and mobills
        models both. Pick whichever matches how your group already settles:
      </P>
      <P>
        <strong>Group settling</strong> — the bill is posted into a Splitwise
        group everyone belongs to (the way many groups already handle rent or
        trips). Give each member a <Code>--splitwise-group-id</Code> alongside
        their user id. <strong>Individual settling</strong> — each person's
        share is charged 1:1 as a friend expense, outside any group. Set only
        the user id and leave the group id unset.
      </P>
      <H2>Link members to Splitwise</H2>
      <P>
        Find each person's numeric Splitwise user id (visible in the Splitwise
        friend URL) and attach it when adding the member — or later with{' '}
        <Code>member edit</Code>:
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member add --account fam_plan_01 --name "Priya" \\
    --line-type additional --splitwise-id 18442 --splitwise-group-id 30741
✓ Added Priya · additional line · splitwise:18442 · group:30741

$ mobills member edit --member mem_priya_01 --clear-splitwise-group-id
✓ Updated member · now settling individually`}
      />
      <P>
        Members without a <Code>--splitwise-id</Code> are simply skipped by the
        integration — useful for lines you don't charge, like your own.
      </P>
      <Callout>
        Don't want to hunt down ids by hand? The{' '}
        <Code>link-splitwise-members</Code>{' '}
        <a
          href="/docs/skills"
          className="text-primary underline-offset-4 hover:underline"
        >
          agent skill
        </a>{' '}
        finds your Splitwise group, matches members by email and name, and
        applies the mapping for you.
      </Callout>
      <H2>Verify the mapping</H2>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member list --account fam_plan_01
  NAME     LINE         SPLITWISE   GROUP
  Vish     primary      —           —
  Priya    additional   18442       30741`}
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
      <PagerNav
        prev={{ to: '/docs/commands/bill', label: 'mobills bill' }}
        next={{ to: '/docs/skills', label: 'Agent skills' }}
      />
    </DocsPage>
  );
}
