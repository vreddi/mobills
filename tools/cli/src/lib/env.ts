import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

// Load env from the monorepo root: .env first, then .env.local overrides.
const rootDir = resolve(process.cwd());
for (const file of ['.env', '.env.local']) {
  const path = resolve(rootDir, file);
  if (existsSync(path)) {
    loadDotenv({ path, override: file === '.env.local' });
  }
}
// Also attempt loading relative to this package (when run from a subdir).
loadDotenv();

const envSchema = z.object({
  CONVEX_URL: z.string().url('CONVEX_URL must be a valid URL'),
  CLERK_SESSION_TOKEN: z.string().min(1, 'CLERK_SESSION_TOKEN is required'),
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
