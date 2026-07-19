import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';

export function DocsInstallation() {
  return (
    <DocsPage
      eyebrow="Getting started"
      title="Installation"
      lede="Get the mobills CLI running locally from the monorepo, configure your environment, and verify it works."
    >
      <H2>Clone and install</H2>
      <P>
        The CLI lives in the mobills monorepo under <Code>tools/cli</Code> and
        is managed with pnpm workspaces and Nx.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ git clone https://github.com/vreddi/mobills.git
$ cd mobills
$ pnpm install`}
      />
      <H2>Configure your environment</H2>
      <P>
        The CLI reads its configuration from a <Code>.env</Code> file at the
        workspace root. It needs your Convex deployment URL and a Clerk session
        token (see <Code>Authentication</Code> for how to mint one).
      </P>
      <CodeBlock
        label=".env"
        code={`# Convex deployment to talk to
CONVEX_URL=https://your-deployment.convex.cloud

# Short-lived Clerk JWT minted from the "convex" template
CLERK_SESSION_TOKEN=eyJhbGciOi...`}
      />
      <Callout>
        The CLI loads <Code>.env</Code> from the workspace root regardless of
        the directory you run it from, so you can invoke it anywhere inside the
        repo.
      </Callout>
      <H2>Run it</H2>
      <P>
        During development, run the CLI straight from source with{' '}
        <Code>pnpm</Code>. Every command supports <Code>--help</Code>.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ pnpm --filter @mobills/cli dev -- --help
Usage: mobills [options] [command]

CLI to seed and manage the shared T-Mobile bill tracking data (Convex + Clerk).

Commands:
  account         Manage T-Mobile tracking accounts
  member          Manage members on a tracking account`}
      />
      <PagerNav
        prev={{ to: '/docs', label: 'Introduction' }}
        next={{ to: '/docs/authentication', label: 'Authentication' }}
      />
    </DocsPage>
  );
}
