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
          { flag: '--splitwise-group-id <id>', description: 'Splitwise group id, when the group settles together in one Splitwise group.' },
        ]}
      />
      <H2>member edit</H2>
      <P>
        Update an existing member — most commonly to attach Splitwise ids
        after the fact. Each field has a matching <Code>--clear-*</Code> flag
        to remove it.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member edit --member mem_priya_01 \\
    --splitwise-id 18442 --splitwise-group-id 30741
✓ Updated member mem_priya_01`}
      />
      <OptionsTable
        rows={[
          { flag: '--member <memberId>', required: true, description: 'Member id to edit (from member list).' },
          { flag: '--name <name>', description: 'New member name.' },
          { flag: '--email <email>', description: 'New member email.' },
          { flag: '--phone <phone>', description: 'New member phone number.' },
          { flag: '--line-type <type>', description: "New line type: 'primary' or 'additional'." },
          { flag: '--splitwise-id <id>', description: 'New Splitwise user id.' },
          { flag: '--splitwise-group-id <id>', description: 'New Splitwise group id for group settling.' },
          { flag: '--clear-email, --clear-phone, --clear-line-type, --clear-splitwise-id, --clear-splitwise-group-id', description: 'Remove the corresponding field.' },
        ]}
      />
      <H2>member list</H2>
      <P>List every member on an account, with line type.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills member list --account fam_plan_01
  NAME     LINE         SPLITWISE   GROUP
  Vish     primary      —           —
  Priya    additional   18442       30741
  Rohan    additional   20917       30741`}
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
