import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** macOS-style terminal window chrome for the hero demo. */
export function Terminal({
  title = 'mobills — zsh',
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-[#0c0c10] shadow-2xl shadow-black/60',
        className,
      )}
    >
      <div className="relative flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="absolute inset-x-0 text-center font-mono text-xs text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="overflow-x-auto p-5 font-mono text-[13px] leading-6">{children}</div>
    </div>
  );
}
