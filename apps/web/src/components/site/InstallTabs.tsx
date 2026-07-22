import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/site/CopyButton';
import { cn } from '@/lib/utils';

const MANAGERS = ['npm', 'pnpm', 'yarn'] as const;
type Manager = (typeof MANAGERS)[number];

/** How each package manager installs a global CLI package. */
const COMMAND: Record<Manager, (pkg: string) => string> = {
  npm: (pkg) => `npm install -g ${pkg}`,
  pnpm: (pkg) => `pnpm add -g ${pkg}`,
  yarn: (pkg) => `yarn global add ${pkg}`,
};

const STORAGE_KEY = 'mobills:pkg-manager';

function isManager(value: string | null): value is Manager {
  return value !== null && (MANAGERS as readonly string[]).includes(value);
}

/**
 * Tabbed install command for npm / pnpm / yarn with a copy button. The chosen
 * manager is remembered in localStorage so it stays consistent across the site.
 */
export function InstallTabs({
  pkg,
  className,
}: {
  pkg: string;
  className?: string;
}) {
  const [manager, setManager] = useState<Manager>('npm');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isManager(saved)) {
        setManager(saved);
      }
    } catch {
      // Ignore storage failures (private mode, etc.) — keep the default tab.
    }
  }, []);

  const select = (next: Manager) => {
    setManager(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, etc.) — the tab still switches.
    }
  };

  const command = COMMAND[manager](pkg);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card text-left',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border pl-1 pr-1.5">
        <div role="tablist" aria-label="Package manager" className="flex">
          {MANAGERS.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={m === manager}
              onClick={() => select(m)}
              className={cn(
                'border-b-2 px-3 py-2 font-mono text-xs transition-colors',
                m === manager
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <CopyButton text={command} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <span className="select-none text-primary">$ </span>
        <span className="text-foreground">{command}</span>
      </pre>
    </div>
  );
}
