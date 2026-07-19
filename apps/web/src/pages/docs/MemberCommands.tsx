import { CodeBlock } from '@/components/site/CodeBlock';
import { Code, DocsPage, H2, OptionsTable, P, PagerNav } from '@/pages/docs/primitives';

export function DocsMemberCommands() {
  return (
    <DocsPage
      eyebrow="CLI reference"
      title="mobills member"
      lede="Manage the people on an account. Each member is a line on the plan with a monthly share — and optionally a Splitwise id for automated settling."
    >
      <H2>member add</H2>
      <P>Add a member (a line) to an account.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member add --account fam_plan_01 --name "Priya" \\
    --email priya@example.com --line-type additional \\
    --monthly-share 35 --splitwise-id 18442
✓ Added Priya · additional line · $35.00/mo · splitwise:18442`}
      />
      <OptionsTable
        rows={[
          { flag: '--account <accountId>', required: true, description: 'Account id to add the member to.' },
          { flag: '--name <name>', required: true, description: 'Member name.' },
          { flag: '--email <email>', description: 'Member email.' },
          { flag: '--phone <phone>', description: 'Member phone number.' },
          { flag: '--line-type <type>', description: "Line type: 'primary' or 'additional'." },
          { flag: '--monthly-share <amount>', description: 'Monthly share amount, in dollars.' },
          { flag: '--splitwise-id <id>', description: 'Splitwise user id used by the Splitwise integration.' },
        ]}
      />
      <H2>member list</H2>
      <P>List every member on an account, with line type and share.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member list --account fam_plan_01
  NAME     LINE         SHARE      SPLITWISE
  Vish     primary      $45.00     —
  Priya    additional   $35.00     18442
  Rohan    additional   $35.00     20917`}
      />
      <P>
        Members with a <Code>--splitwise-id</Code> are picked up automatically
        by the Splitwise integration when the bill is split.
      </P>
      <PagerNav
        prev={{ to: '/docs/commands/account', label: 'mobills account' }}
        next={{ to: '/docs/integrations/splitwise', label: 'Splitwise integration' }}
      />
    </DocsPage>
  );
}
