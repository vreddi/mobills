import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Walk up from `startDir` until the pnpm workspace manifest is found, marking
// the monorepo root. Falls back to `startDir` if no manifest is found.
function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

// Load env from the monorepo root so values in the root `.env` are found even
// when the CLI runs with a different cwd (e.g. `pnpm --filter @mobills/cli
// start`, which executes with cwd set to the package directory). The current
// working directory is searched afterwards so a local run can override.
const workspaceRoot = findWorkspaceRoot(dirname(fileURLToPath(import.meta.url)));
const searchDirs = Array.from(
  new Set([workspaceRoot, resolve(process.cwd())]),
);
for (const dir of searchDirs) {
  for (const file of ['.env', '.env.local']) {
    const path = resolve(dir, file);
    if (existsSync(path)) {
      loadDotenv({ path, override: file === '.env.local' });
    }
  }
}

const envSchema = z.object({
  CONVEX_URL: z.string().url('CONVEX_URL must be a valid URL'),
  // Optional: legacy/fallback auth. Prefer `mobills login`, which caches a
  // token outside the environment. Still honored when no cached token exists.
  CLERK_SESSION_TOKEN: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_JWT_ISSUER_DOMAIN: z.string().optional(),
  CONVEX_DEPLOY_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid or missing environment variables:\n${missing}\n\n` +
        'Copy .env.example to .env and fill in the values. ' +
        'See the README / PR setup notes for how to obtain each value.',
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * Returns the Clerk publishable key, which `mobills login` needs to hotload
 * Clerk.js in the browser. Throws a helpful error when it is not configured.
 */
export function getPublishableKey(): string {
  const key = process.env.CLERK_PUBLISHABLE_KEY;
  if (!key || key.length === 0) {
    throw new Error(
      'CLERK_PUBLISHABLE_KEY is required for `mobills login`. ' +
        'Add it to your .env (Clerk dashboard \u2192 API keys).',
    );
  }
  return key;
}
