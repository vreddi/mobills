import { CodeBlock } from '@/components/site/CodeBlock';
import { Code, DocsPage, H2, OptionsTable, P, PagerNav } from '@/pages/docs/primitives';

export function DocsAccountCommands() {
  return (
    <DocsPage
      eyebrow="CLI reference"
      title="mobills account"
      lede="Create and list the mobile-plan accounts you own. An account is the container every member (line) belongs to."
    >
      <H2>account create</H2>
      <P>Create a new tracking account for a plan you manage.</P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills account create --name "Family Plan" --account-number 987654321 --plan "Magenta MAX"
✓ Created account fam_plan_01`}
      />
      <OptionsTable
        rows={[
          { flag: '--name <name>', required: true, description: 'Display name for the account.' },
          { flag: '--account-number <number>', description: 'Carrier account number, for your own reference.' },
          { flag: '--plan <plan>', description: 'Plan name, e.g. "Magenta MAX".' },
        ]}
      />
      <H2>account list</H2>
      <P>
        List every account owned by the authenticated user. Use the printed id
        as the <Code>--account</Code> value for member commands.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills account list
  ID            NAME          PLAN
  fam_plan_01   Family Plan   Magenta MAX`}
      />
      <H2>account edit</H2>
      <P>
        Update an account's name, carrier account number, or plan. Each optional
        field has a matching <Code>--clear-*</Code> flag to remove it.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills account edit --account fam_plan_01 --plan "Go5G Plus"
✓ Updated account fam_plan_01`}
      />
      <OptionsTable
        rows={[
          { flag: '--account <accountId>', description: 'Account id to edit (prompts a picker when omitted).' },
          { flag: '--name <name>', description: 'New display name for the account.' },
          { flag: '--account-number <number>', description: 'New carrier account number.' },
          { flag: '--plan <plan>', description: 'New plan name.' },
          { flag: '--clear-account-number, --clear-plan', description: 'Remove the corresponding field.' },
        ]}
      />
      <PagerNav
        prev={{ to: '/docs/providers/tmobile', label: 'T-Mobile' }}
        next={{ to: '/docs/commands/member', label: 'mobills member' }}
      />
    </DocsPage>
  );
}
