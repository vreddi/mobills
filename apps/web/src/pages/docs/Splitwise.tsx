import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, OptionsTable, P, PagerNav } from '@/pages/docs/primitives';

export function DocsSplitwise() {
  return (
    <DocsPage
      eyebrow="Integrations"
      title="Splitwise"
      lede="mobills' first integration posts a whole bill cycle to Splitwise as one shared expense — you pay it, everyone else owes their computed share back to you."
    >
      <H2>What it does</H2>
      <P>
        Once your members are linked to their Splitwise accounts, running{' '}
        <Code>mobills bill post</Code> turns a saved bill into a single Splitwise
        expense: <strong>you are recorded as the payer</strong> for the full
        amount, and every member owes exactly the share the bill computed for
        them. The expense total always equals the bill total, so you are
        reimbursed for everything you're owed — no manual expense entry, no
        rounding drift.
      </P>
      <Callout>
        Because you're the payer, you must be a member on the bill with your own
        Splitwise id. Every other member on the bill needs one too — a bill
        can't be posted while anyone is missing an id.
      </Callout>

      <H2>Connect Splitwise</H2>
      <P>
        Connect your Splitwise account once with{' '}
        <Code>integration splitwise setup</Code>. It prompts for a personal API
        key (create one at{' '}
        <a
          href="https://secure.splitwise.com/apps"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          secure.splitwise.com/apps
        </a>
        ) and stores it <strong>encrypted in the mobills backend</strong> — the
        key never touches this machine, and every Splitwise call runs
        server-side.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills integration splitwise setup
? Splitwise personal API key: ************************
✓ Connected as Vishrut Reddi (id 18440)

$ mobills integration splitwise status
✓ Connected as Vishrut Reddi (id 18440, you@example.com)`}
      />
      <P>
        Other integration commands help you find the ids you'll attach to
        members and manage the connection:
      </P>
      <OptionsTable
        rows={[
          { flag: 'integration list', description: 'Show configured integrations and their connection status.' },
          { flag: 'integration splitwise groups', description: "List the connected user's Splitwise groups (with ids)." },
          { flag: 'integration splitwise friends', description: "List the connected user's Splitwise friends (with ids)." },
          { flag: 'integration splitwise whoami', description: 'Show the connected Splitwise user.' },
          { flag: 'integration splitwise remove', description: 'Disconnect and delete the stored credential.' },
        ]}
      />

      <H2>Group or individual settling</H2>
      <P>
        Splitwise supports two ways of posting a shared expense, and mobills
        models both. Pick whichever matches how your group already settles:
      </P>
      <P>
        <strong>Group settling</strong> — the bill is posted into a Splitwise
        group everyone belongs to. Give each member a{' '}
        <Code>--splitwise-group-id</Code> alongside their user id; mobills posts
        into that shared group. <strong>Individual settling</strong> — each
        person owes you 1:1 as a friend expense, outside any group. Set only the
        user id and leave the group id unset.
      </P>

      <H2>Link members to Splitwise</H2>
      <P>
        Find each person's numeric Splitwise user id (from{' '}
        <Code>integration splitwise groups</Code>/<Code>friends</Code>, or the
        Splitwise friend URL) and attach it when adding the member — or later
        with <Code>member edit</Code>:
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member add --account fam_plan_01 --name "Priya" \\
    --line-type additional --splitwise-id 18442 --splitwise-group-id 30741
✓ Added Priya · additional line · splitwise:18442 · group:30741`}
      />
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

      <H2>Post a bill</H2>
      <P>
        Preview the split with <Code>--dry-run</Code> first, then post it.
        mobills posts into the members' shared group when they have one, or as a
        friend-to-friend expense otherwise — override with <Code>--group</Code>{' '}
        or <Code>--individual</Code>.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills bill post --bill bill_jul26_00 --dry-run
  Jul 2026 0 — 262.43 USD
  Posting to Splitwise group 30741

  Member     Splitwise id   Owes
  Vish       18440          43.34
  Priya      18442          43.34
  …
  Dry run — nothing was posted to Splitwise.

$ mobills bill post --bill bill_jul26_00
✓ Posted to Splitwise: expense 99213 (262.43 USD, group 30741).`}
      />
      <P>
        A bill records its posting, so <Code>bill list</Code> and{' '}
        <Code>bill show</Code> mark it as posted and mobills won't post the same
        bill to Splitwise twice.
      </P>

      <Callout>
        The Splitwise API key lives encrypted in the mobills backend — the CLI
        never sees or stores it. More integrations are on the roadmap; suggest
        one on{' '}
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
