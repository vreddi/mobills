import { CodeBlock } from '@/components/site/CodeBlock';
import { InstallTabs } from '@/components/site/InstallTabs';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';

export function DocsInstallation() {
  return (
    <DocsPage
      eyebrow="Getting started"
      title="Installation"
      lede="Install the mobills CLI from npm, point it at your backend, and verify it works."
    >
      <H2>Install the CLI</H2>
      <P>
        The CLI is published to npm as{' '}
        <a
          href="https://www.npmjs.com/package/@mobills/cli"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          <Code>@mobills/cli</Code>
        </a>
        . Install it globally to get the <Code>mobills</Code> command on your{' '}
        <Code>PATH</Code>:
      </P>
      <InstallTabs pkg="@mobills/cli" />
      <P>
        Then verify it's on your <Code>PATH</Code> with <Code>mobills --version</Code>.
        Prefer not to install anything? Run the latest release on demand with{' '}
        <Code>npx</Code>:
      </P>
      <CodeBlock label="Terminal" code={`$ npx @mobills/cli --help`} />
      <Callout>
        Node.js 20 or newer is required. You only need to clone the repo if
        you're contributing to mobills itself — see the{' '}
        <a
          href="https://github.com/vreddi/mobills"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          repository
        </a>{' '}
        for that.
      </Callout>
      <H2>Configure your environment</H2>
      <P>
        The CLI reads its configuration from a <Code>.env</Code> file in the
        directory you run it from. At minimum it needs your Convex deployment URL
        and the Clerk publishable key used by <Code>mobills login</Code> (see{' '}
        <Code>Authentication</Code>).
      </P>
      <CodeBlock
        label=".env"
        code={`# Convex deployment to talk to
CONVEX_URL=https://your-deployment.convex.cloud

# Clerk publishable key — used by \`mobills login\` to sign you in
CLERK_PUBLISHABLE_KEY=pk_test_...`}
      />
      <Callout>
        Keep this <Code>.env</Code> alongside wherever you run{' '}
        <Code>mobills</Code>, and never commit a real one. If you also have a
        workspace-root <Code>.env</Code> (when running from the repo), the CLI
        picks that up too.
      </Callout>
      <H2>Run it</H2>
      <P>
        Every command supports <Code>--help</Code>. Sign in first, then create
        your account and add lines.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills --help
Usage: mobills [options] [command]

CLI to seed and manage the shared T-Mobile bill tracking data (Convex + Clerk).

Commands:
  login           Sign in with Clerk in your browser
  account         Manage T-Mobile tracking accounts
  member          Manage members on a tracking account
  bill            Create, inspect, and post per-member bills
  integration     Connect and manage integrations (e.g. Splitwise)`}
      />
      <PagerNav
        prev={{ to: '/docs', label: 'Introduction' }}
        next={{ to: '/docs/authentication', label: 'Authentication' }}
      />
    </DocsPage>
  );
}
