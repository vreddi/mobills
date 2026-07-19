import { CodeBlock } from '@/components/site/CodeBlock';
import { Callout, Code, DocsPage, H2, P, PagerNav } from '@/pages/docs/primitives';
import tmobileLogo from '@/assets/tmobile.svg';

export function DocsTMobile() {
  return (
    <DocsPage
      eyebrow="Providers"
      title="T-Mobile"
      lede="A provider is the service your group's mobile bill comes from — the input mobills tracks and splits. T-Mobile is the first supported provider."
    >
      <div className="flex items-center gap-3">
        <img src={tmobileLogo} alt="T-Mobile" className="h-12 w-12 rounded-xl" />
        <p className="text-sm text-muted-foreground">
          T-Mobile family and additional lines, mirrored into a mobills tracking
          account.
        </p>
      </div>
      <H2>What a provider is</H2>
      <P>
        Providers are where the bills come from — the source of truth for what
        the group owes each cycle. mobills doesn't replace your provider; it
        mirrors the plan and its lines so you can split the bill and settle up
        through an integration. Today T-Mobile is the only provider, and every
        tracking account is modeled after a T-Mobile plan.
      </P>
      <H2>Mirror your T-Mobile plan</H2>
      <P>
        The real T-Mobile account and its lines already exist. Create a matching
        tracking account in mobills, then add each line as a member:
      </P>
      <CodeBlock
        label="Terminal"
        code={`$ mobills account create --provider tmobile --name "Family plan" --plan-cost 140
✓ Created fam_plan_01 · provider:tmobile · $140.00/mo`}
      />
      <P>
        Pass <Code>--provider tmobile</Code> so mobills knows which service the
        account mirrors. Every member you add afterwards represents a line on
        that T-Mobile plan.
      </P>
      <Callout>
        More providers are on the roadmap. Split a bill from another carrier?
        Suggest it on{' '}
        <a
          href="https://github.com/vreddi/mobills/issues"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          GitHub issues
        </a>
        .
      </Callout>
      <PagerNav
        prev={{ to: '/docs/authentication', label: 'Authentication' }}
        next={{ to: '/docs/commands/account', label: 'mobills account' }}
      />
    </DocsPage>
  );
}
