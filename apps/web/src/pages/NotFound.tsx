import { Link } from '@tanstack/react-router';
import { Button } from '@/components/motion/button/base';
import { Terminal } from '@/components/site/Terminal';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Terminal title="mobills — zsh" className="w-full max-w-lg">
        <div>
          <span className="select-none text-primary">$ </span>
          <span className="text-foreground">cd {location.pathname}</span>
        </div>
        <div className="text-[#ff5f57]">cd: no such file or directory</div>
        <div className="text-muted-foreground">exit code 404</div>
      </Terminal>
      <p className="mt-8 text-muted-foreground">This page doesn&apos;t exist.</p>
      <Link to="/" className="mt-4">
        <Button variant="outline" size="md" className="rounded-lg">
          Back to mobills.io
        </Button>
      </Link>
    </div>
  );
}
