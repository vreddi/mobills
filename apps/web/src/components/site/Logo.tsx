import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-mono text-sm font-semibold text-primary-foreground shadow-[0_0_20px_-4px] shadow-primary/60 transition-shadow group-hover:shadow-primary/90">
        m
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        mobills
      </span>
    </Link>
  );
}
