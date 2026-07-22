import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, OptionsTable, P, PagerNav } from '@/pages/docs/primitives';

export function DocsBillCommands() {
  return (
    <DocsPage
      eyebrow="CLI reference"
      title="mobills bill"
      lede="Divide a cycle's charges fairly across members, confirm the breakdown, save it, and post it to Splitwise."
    >
      <P>
        A bill takes the shared plan cost and each member's individual charges
        and splits them into exactly what every person owes. The shared{' '}
        <Code>Base + Base Tax</Code> pool is divided equally across everyone;
        individual tax, contract/plan/equipment, and extra usage are charged only
        to the member they belong to.
      </P>
      <Callout>
        T-Mobile has no public API for statement data, so you supply the numbers
        — either from a JSON file (great for automation) or through interactive
        prompts. Every bill shows a full breakdown for you to confirm before it
        is saved.
      </Callout>

      <H2>bill create</H2>
      <P>
        Compute the division, print the breakdown, and save the bill after you
        confirm. Pass <Code>--from-file</Code> for a scripted run, or omit the
        inputs to be prompted line by line.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills bill create --account fam_plan_01 --label "Jan 2025 0" \\
    --base 310 --from-file jan-2025.json

  Jan 2025 0 — 392.71 USD across 9 members

  Member     Base    Indi-Tax   Contract/Plan/Equip   Extra   Total    %
  Vish       34.44                                             34.44    8.77%
  Bhavesh    34.45              12.50                  24.04   70.99   18.08%
  Anjali     34.44              41.67                          76.11   19.38%
  …
  All       310.00                                            392.71  100.00%

? Create this bill? (Y/n)
✓ Created bill: bill_jan25_00`}
      />
      <OptionsTable
        rows={[
          { flag: '--account <accountId>', description: 'Account id (prompts a picker when omitted).' },
          { flag: '--label <label>', description: 'Bill label / cadence, e.g. "Jan 2025 0".' },
          { flag: '--base <amount>', description: 'Shared base + base tax pool, split equally across members.' },
          { flag: '--currency <code>', description: 'ISO currency code (defaults to USD).' },
          { flag: '--from-file <path>', description: 'Load the base pool and per-member charges from a JSON file.' },
          { flag: '--exclude <matcher>', description: 'Member (id / phone / name) to leave off this bill; repeatable.' },
          { flag: '--yes', description: 'Skip the confirmation prompt (required for non-interactive runs).' },
        ]}
      />
      <P>
        The <Code>--from-file</Code> JSON assigns individual charges to members
        by id, phone, or name. Members you don't list still get an equal base
        share — only their extras are optional. All amounts are in dollars.
      </P>
      <CodeBlock
        label="jan-2025.json"
        code={`{
  "label": "Jan 2025 0",
  "basePool": 310,
  "currencyCode": "USD",
  "charges": [
    { "member": "+12178196510", "contractPlanEquipment": 12.5, "extra": 24.04 },
    { "member": "Anjali Shahi", "contractPlanEquipment": 41.67 },
    { "member": "Amba Gupta", "extra": 0.25 },
    { "member": "Habiba", "extra": 4.25 }
  ],
  "exclude": []
}`}
      />

      <H2>bill list</H2>
      <P>List every bill on an account, with its total and posted status.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills bill list --account fam_plan_01
  ID              LABEL        TOTAL         MEMBERS   POSTED             CREATED
  bill_jan25_00   Jan 2025 0   392.71 USD    9         splitwise #99213   1/8/2025
  bill_feb25_00   Feb 2025 0   364.17 USD    9         not posted         2/8/2025`}
      />

      <H2>bill show</H2>
      <P>Show a single bill's full per-member breakdown and posting history.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills bill show --bill bill_jan25_00`}
      />
      <OptionsTable
        rows={[
          { flag: '--bill <billId>', required: true, description: 'Bill id (from bill list).' },
        ]}
      />

      <H2>bill post</H2>
      <P>
        Post the bill to Splitwise as one shared expense — you are recorded as
        the payer and everyone else owes their computed share. The expense total
        always equals the bill total, so you're reimbursed for exactly what
        you're owed. mobills posts to the members' shared Splitwise group when
        they have one, or as a friend-to-friend expense otherwise.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills bill post --bill bill_jan25_00 --dry-run
  Jan 2025 0 — 392.71 USD
  Posting to Splitwise group 30741

  Member     Splitwise id   Owes
  Vish       18440          34.44
  Bhavesh    18441          70.99
  …
  Dry run — nothing was posted to Splitwise.

$ mobills bill post --bill bill_jan25_00
✓ Posted to Splitwise: expense 99213 (392.71 USD, group 30741).`}
      />
      <OptionsTable
        rows={[
          { flag: '--bill <billId>', required: true, description: 'Bill id (from bill list).' },
          { flag: '--group <id>', description: 'Splitwise group id to post into (overrides the inferred group).' },
          { flag: '--individual', description: 'Post as a friend-to-friend expense with no group.' },
          { flag: '--dry-run', description: 'Preview the Splitwise split without posting.' },
          { flag: '--yes', description: 'Skip the confirmation prompt.' },
        ]}
      />
      <Callout>
        Every member on the bill needs a <Code>--splitwise-id</Code> and you must
        be a member yourself (with the Splitwise id of your connected account) so
        you can be the payer. Link members with{' '}
        <Code>mobills member edit --splitwise-id &lt;id&gt;</Code>.
      </Callout>

      <PagerNav
        prev={{ to: '/docs/commands/member', label: 'mobills member' }}
        next={{ to: '/docs/integrations/splitwise', label: 'Splitwise integration' }}
      />
    </DocsPage>
  );
}
