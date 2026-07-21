import { useMemo, useState } from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import { Github, Search } from 'lucide-react';
import { Logo } from '@/components/site/Logo';
import splitwiseLogo from '@/assets/splitwise.svg';
import tmobileLogo from '@/assets/tmobile.svg';

interface DocLink {
  to: string;
  label: string;
  keywords?: string;
  icon?: string;
}

interface DocSection {
  title: string;
  links: DocLink[];
}

const SECTIONS: DocSection[] = [
  {
    title: 'Getting started',
    links: [
      { to: '/docs', label: 'Introduction', keywords: 'overview what is mobills' },
      { to: '/docs/installation', label: 'Installation', keywords: 'install pnpm setup env' },
      { to: '/docs/authentication', label: 'Authentication', keywords: 'clerk jwt token login' },
    ],
  },
  {
    title: 'Providers',
    links: [
      {
        to: '/docs/providers/tmobile',
        label: 'T-Mobile',
        keywords: 'provider carrier bill source input plan line',
        icon: tmobileLogo,
      },
    ],
  },
  {
    title: 'CLI reference',
    links: [
      { to: '/docs/commands/account', label: 'mobills account', keywords: 'create list plan' },
      { to: '/docs/commands/member', label: 'mobills member', keywords: 'add list line share' },
      { to: '/docs/commands/bill', label: 'mobills bill', keywords: 'bill divide split create post total tax equipment extra cadence' },
    ],
  },
  {
    title: 'Integrations',
    links: [
      {
        to: '/docs/integrations/splitwise',
        label: 'Splitwise',
        keywords: 'expense sync friends split group',
        icon: splitwiseLogo,
      },
    ],
  },
  {
    title: 'Automation',
    links: [
      {
        to: '/docs/skills',
        label: 'Agent skills',
        keywords: 'skill claude agent import tmobile lines bill pdf statement link splitwise automate',
      },
    ],
  },
];

export function DocsLayout() {
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      links: s.links.filter(
        (l) =>
          l.label.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          l.keywords?.includes(q),
      ),
    })).filter((s) => s.links.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-6">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              docs
            </span>
          </div>
          <label className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentation…"
              className="w-full rounded-lg border border-border bg-card py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              mobills.io
            </Link>
            <a
              href="https://github.com/vreddi/mobills"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl px-6">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border/60 py-8 pr-6 md:block">
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No results for “{query}”.
            </p>
          ) : (
            sections.map((section) => (
              <div key={section.title} className="mb-7">
                <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h4>
                <ul className="space-y-0.5">
                  {section.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        activeOptions={{ exact: link.to === '/docs' }}
                        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        activeProps={{
                          className:
                            'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm bg-primary/10 font-medium text-primary',
                        }}
                      >
                        {link.icon && (
                          <img
                            src={link.icon}
                            alt=""
                            className="h-4 w-4 shrink-0 rounded"
                          />
                        )}
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </aside>

        <main className="min-w-0 flex-1 py-10 md:pl-10 lg:pr-10">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
