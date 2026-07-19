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
      <PagerNav
        prev={{ to: '/docs/authentication', label: 'Authentication' }}
        next={{ to: '/docs/commands/member', label: 'mobills member' }}
      />
    </DocsPage>
  );
}
