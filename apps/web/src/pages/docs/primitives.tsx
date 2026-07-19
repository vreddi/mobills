import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function DocsPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <article>
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{lede}</p>
      <div className="mt-8 space-y-6">{children}</div>
    </article>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-t border-border/60 pt-8 text-xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-muted-foreground">{children}</p>;
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  );
}

export interface OptionRow {
  flag: string;
  required?: boolean;
  description: string;
}

export function OptionsTable({ rows }: { rows: OptionRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Option</th>
            <th className="px-4 py-2.5 font-medium">Required</th>
            <th className="px-4 py-2.5 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.flag} className="border-b border-border/60 last:border-b-0">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-primary">
                {row.flag}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.required ? 'Yes' : 'No'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

export function PagerNav({
  prev,
  next,
}: {
  prev?: { to: string; label: string };
  next?: { to: string; label: string };
}) {
  return (
    <nav className="mt-4 flex gap-4 border-t border-border/60 pt-8">
      {prev ? (
        <Link
          to={prev.to}
          className="group flex flex-1 flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-primary/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="h-3 w-3" /> Previous
          </span>
          <span className="font-medium text-foreground group-hover:text-primary">
            {prev.label}
          </span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
      {next ? (
        <Link
          to={next.to}
          className="group flex flex-1 flex-col items-end gap-1 rounded-xl border border-border p-4 text-right transition-colors hover:border-primary/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Next <ArrowRight className="h-3 w-3" />
          </span>
          <span className="font-medium text-foreground group-hover:text-primary">
            {next.label}
          </span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </nav>
  );
}
