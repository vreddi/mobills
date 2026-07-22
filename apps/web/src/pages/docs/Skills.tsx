import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';

export function DocsSkills() {
  return (
    <DocsPage
      eyebrow="Automation"
      title="Agent skills"
      lede="Playbooks that let an AI coding agent drive the mobills CLI for you — importing your plan's lines and wiring up Splitwise, instead of running commands by hand."
    >
      <P>
        Skills live in the repo under <Code>.claude/skills/</Code> and are
        picked up automatically by agents like Claude Code. Each skill is a
        step-by-step playbook the agent follows using the same{' '}
        <Code>mobills</Code> commands you'd type yourself — with guardrails:
        the agent never handles your carrier or Splitwise credentials, and it
        always shows you what it's about to change before touching your data.
      </P>
      <P>
        Invoke one by asking in plain language ("import my T-Mobile lines") or
        by name (<Code>/import-tmobile-lines</Code>).
      </P>

      <H2>import-tmobile-lines</H2>
      <P>
        T-Mobile has no public consumer API, so this skill pulls your plan's
        lines from a browser session where you're already signed in to
        t-mobile.com — or from a bill PDF you download — and adds each line as
        a member with <Code>mobills member add</Code>. Existing members are
        skipped by phone number, and nothing is added until you confirm the
        extracted list.
      </P>
      <CodeBlock
        label="Claude Code"
        code={`> import my T-Mobile lines into mobills

✓ Found 4 lines on your T-Mobile plan
✓ 1 skipped (already a member) · 3 to add — confirm?
✓ Added Priya, Rohan, Anaya to fam_plan_01`}
      />

      <H2>import-tmobile-bill</H2>
      <P>
        Turns a T-Mobile <em>summary</em> bill PDF into a mobills bill. It reads
        the per-line summary table, splits the shared plan cost equally, assigns
        each line's equipment and one-time charges to its member, and shows the
        full division for you to confirm before running{' '}
        <Code>mobills bill create</Code>. The detailed PDF isn't needed, and no
        T-Mobile login is ever involved.
      </P>
      <CodeBlock
        label="Claude Code"
        code={`> create a bill from this T-Mobile PDF

✓ Parsed 6 lines · plans $260.00 · one-time $2.43 → $262.43
✓ Base split $43.33-43.34/line · (470) 263-6588 +$2.43 — confirm?
✓ Created bill "Jul 2026 0" (262.43 USD)`}
      />

      <H2>link-splitwise-members</H2>
      <P>
        Finds the right Splitwise group for your plan, matches each member to
        their Splitwise user id (email first, then name — ambiguous matches
        are always asked, never guessed), and applies the mapping with{' '}
        <Code>mobills member edit</Code>. You choose how your group settles:
        in a shared Splitwise group (sets a group id on every member) or
        individually as 1:1 friend expenses.
      </P>
      <CodeBlock
        label="Claude Code"
        code={`> link my members to splitwise

✓ Found group "Phone bill" (4 people) — use it?
✓ Matched 3 of 3 members by email — confirm mapping?
✓ Updated Priya, Rohan, Anaya · group settling via 30741`}
      />

      <Callout>
        Skills require an agent with access to this repo and a signed-in{' '}
        <Code>mobills</Code> CLI. Your T-Mobile login and{' '}
        <Code>SPLITWISE_API_KEY</Code> are never shared with the agent — sign-in
        happens in your browser, and the key stays in <Code>.env</Code>.
      </Callout>
      <PagerNav
        prev={{ to: '/docs/integrations/splitwise', label: 'Splitwise integration' }}
      />
    </DocsPage>
  );
}
