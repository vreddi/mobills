import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

/**
 * Typographic wordmark: "mobills" with a blurple full stop. The dot doubles
 * as the brand accent and picks up a subtle glow on hover.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-baseline text-[17px] font-bold tracking-tight', className)}
    >
      <span className="text-foreground">mobills</span>
      <span className="text-primary transition-[text-shadow] group-hover:[text-shadow:0_0_12px_var(--color-primary)]">
        .
      </span>
    </Link>
  );
}
