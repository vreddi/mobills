import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';

export function DocsAuthentication() {
  return (
    <DocsPage
      eyebrow="Getting started"
      title="Authentication"
      lede="mobills authenticates against Convex using a Clerk-issued JWT, so every command runs as you and your data stays scoped to your user."
    >
      <H2>Sign in with your browser</H2>
      <P>
        The easiest way to sign in is <Code>mobills login</Code>. It opens a
        small sign-in page on <Code>127.0.0.1</Code>, signs you in with Clerk,
        mints a session token, and caches it locally — later commands use it
        automatically.
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills login
Signed in ✓  (token expires 7/21/2026, 2:31:05 PM)
Saved credentials to ~/.config/mobills/credentials.json`}
      />
      <P>
        This needs <Code>CLERK_PUBLISHABLE_KEY</Code> in your <Code>.env</Code>{' '}
        so the login page can load Clerk. Check who you're signed in as, or sign
        out, at any time:
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills whoami
  Name     Vishrut Reddi
  Email    you@example.com
  Status   signed in

$ mobills logout
Logged out. Cached credentials removed.`}
      />
      <H2>How auth works</H2>
      <P>
        The backend is a Convex deployment configured to trust JWTs issued by
        your Clerk application's <Code>convex</Code> JWT template. The CLI sends
        the cached token with every request; Convex verifies it and resolves
        your identity, scoping every account, member, and bill to you.
      </P>
      <H2>Token expiry</H2>
      <Callout>
        The <Code>convex</Code> JWT template defaults to a short lifetime, so
        cached tokens expire quickly. Run commands soon after{' '}
        <Code>mobills login</Code>, or raise the template's token lifetime in
        Clerk. If a command fails with an authentication error, just run{' '}
        <Code>mobills login</Code> again.
      </Callout>
      <H2>Non-interactive environments</H2>
      <P>
        Where a browser isn't available (CI, a remote shell), set{' '}
        <Code>CLERK_SESSION_TOKEN</Code> in your <Code>.env</Code> instead — a
        token minted from the <Code>convex</Code> template. The CLI falls back to
        it when no cached login credential exists.
      </P>
      <CodeBlock
        label=".env"
        code={`# Fallback when \`mobills login\` isn't an option
CLERK_SESSION_TOKEN=eyJhbGciOi...`}
      />
      <PagerNav
        prev={{ to: '/docs/installation', label: 'Installation' }}
        next={{ to: '/docs/providers/tmobile', label: 'T-Mobile' }}
      />
    </DocsPage>
  );
}
