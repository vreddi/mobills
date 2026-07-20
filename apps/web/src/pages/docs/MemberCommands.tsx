import { CodeBlock } from '@/components/site/CodeBlock';
import { Code, DocsPage, H2, OptionsTable, P, PagerNav } from '@/pages/docs/primitives';

export function DocsMemberCommands() {
  return (
    <DocsPage
      eyebrow="CLI reference"
      title="mobills member"
      lede="Manage the people on an account. Each member is a line on the plan — optionally with a Splitwise id for automated settling."
    >
      <H2>member add</H2>
      <P>Add a member (a line) to an account.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member add --account fam_plan_01 --name "Priya" \\
    --email priya@example.com --line-type additional \\
    --splitwise-id 18442
✓ Added Priya · additional line · splitwise:18442`}
      />
      <OptionsTable
        rows={[
          { flag: '--account <accountId>', required: true, description: 'Account id to add the member to.' },
          { flag: '--name <name>', required: true, description: 'Member name.' },
          { flag: '--email <email>', description: 'Member email.' },
          { flag: '--phone <phone>', description: 'Member phone number.' },
          { flag: '--line-type <type>', description: "Line type: 'primary' or 'additional'." },
          { flag: '--splitwise-id <id>', description: 'Splitwise user id used by the Splitwise integration.' },
        ]}
      />
      <H2>member list</H2>
      <P>List every member on an account, with line type.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member list --account fam_plan_01
  NAME     LINE         SPLITWISE
  Vish     primary      —
  Priya    additional   18442
  Rohan    additional   20917`}
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
