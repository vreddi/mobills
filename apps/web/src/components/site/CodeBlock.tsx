import { CopyButton } from '@/components/site/CopyButton';
import { cn } from '@/lib/utils';

export interface CodeBlockProps {
  code: string;
  /** Small label shown in the header, e.g. "Terminal" or ".env". */
  label?: string;
  className?: string;
}

/**
 * Dark code panel with a copy button. Lines starting with "$ " render the
 * prompt dimmed and the command bright; other lines render as output.
 * Copy strips the "$ " prompts so the result is paste-able.
 */
export function CodeBlock({ code, label = 'Terminal', className }: CodeBlockProps) {
  const lines = code.replace(/\n$/, '').split('\n');
  const copyText = lines
    .filter((l) => !l.startsWith('# '))
    .map((l) => (l.startsWith('$ ') ? l.slice(2) : l))
    .join('\n');

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <CopyButton text={copyText} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        {lines.map((line, i) => (
          <Line key={i} line={line} />
        ))}
      </pre>
    </div>
  );
}

function Line({ line }: { line: string }) {
  if (line.startsWith('$ ')) {
    return (
      <div>
        <span className="select-none text-primary">$ </span>
        <span className="text-foreground">{line.slice(2)}</span>
      </div>
    );
  }
  if (line.startsWith('# ')) {
    return <div className="text-muted-foreground/70">{line}</div>;
  }
  return <div className="text-muted-foreground">{line || ' '}</div>;
}
