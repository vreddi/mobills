import { Link } from '@tanstack/react-router';
import { Logo } from '@/components/site/Logo';

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground">
            The command line for shared mobile bills.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/docs" className="transition-colors hover:text-foreground">
            Documentation
          </Link>
          <a href="/#integrations" className="transition-colors hover:text-foreground">
            Integrations
          </a>
          <a
            href="https://github.com/vreddi/mobills"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
      <div className="border-t border-border/60 py-4 text-center font-mono text-xs text-muted-foreground/70">
        mobills.io · built with Nx, Convex &amp; Clerk · deployed on GitHub Pages
      </div>
    </footer>
  );
}
