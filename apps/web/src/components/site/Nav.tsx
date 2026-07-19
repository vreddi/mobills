import { Link } from '@tanstack/react-router';
import { Github } from 'lucide-react';
import { Logo } from '@/components/site/Logo';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/docs"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Docs
          </Link>
          <a
            href="/#integrations"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Integrations
          </a>
          <a
            href="https://github.com/vreddi/mobills"
            target="_blank"
            rel="noreferrer"
            className="ml-1 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
