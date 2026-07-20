import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';

export function DocsAuthentication() {
  return (
    <DocsPage
      eyebrow="Getting started"
      title="Authentication"
      lede="mobills authenticates against Convex using a Clerk-issued JWT, so every command runs as you and your data stays scoped to your user."
    >
      <H2>How auth works</H2>
      <P>
        The backend is a Convex deployment configured to trust JWTs issued by
        your Clerk application's <Code>convex</Code> JWT template. The CLI sends
        the token from <Code>CLERK_SESSION_TOKEN</Code> with every request;
        Convex verifies it and resolves your identity.
      </P>
      <H2>Mint a session token</H2>
      <P>
        Create a session for your user and mint a token from the{' '}
        <Code>convex</Code> template using the Clerk CLI (or dashboard):
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ clerk sessions create --user-id user_abc123
$ clerk sessions tokens create sess_xyz789 --template convex
eyJhbGciOiJSUzI1NiIsImtpZCI6...`}
      />
      <P>
        Put the resulting JWT in your workspace-root <Code>.env</Code> as{' '}
        <Code>CLERK_SESSION_TOKEN</Code>.
      </P>
      <H2>Token expiry</H2>
      <Callout>
        Clerk session tokens are short-lived. If a command fails with an
        authentication error, the CLI will tell you — mint a fresh token from
        the <Code>convex</Code> template and update your <Code>.env</Code>,
        then re-run the command.
      </Callout>
      <PagerNav
        prev={{ to: '/docs/installation', label: 'Installation' }}
        next={{ to: '/docs/providers/tmobile', label: 'T-Mobile' }}
      />
    </DocsPage>
  );
}
