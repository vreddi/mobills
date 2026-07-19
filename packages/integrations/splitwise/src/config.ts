/**
 * Splitwise configuration loaded from the environment.
 *
 * Authentication uses a Splitwise personal API key (a Bearer token you create
 * under "Your apps" at https://secure.splitwise.com/apps). This is the simplest
 * option for a personal/operator tool; OAuth can be layered on later.
 */
import { z } from 'zod';

export const DEFAULT_SPLITWISE_BASE_URL = 'https://secure.splitwise.com/api/v3.0';

export interface SplitwiseConfig {
  apiKey: string;
  baseUrl: string;
}

const envSchema = z.object({
  SPLITWISE_API_KEY: z.string().min(1, 'SPLITWISE_API_KEY is required'),
  SPLITWISE_API_BASE_URL: z
    .string()
    .url('SPLITWISE_API_BASE_URL must be a valid URL')
    .optional(),
});

/**
 * Read and validate Splitwise config from `process.env`. The caller is
 * responsible for loading any `.env` file first (the standalone runner does).
 */
export function configFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SplitwiseConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid or missing Splitwise environment variables:\n${details}\n\n` +
        'Create a personal API key at https://secure.splitwise.com/apps and ' +
        'set SPLITWISE_API_KEY in your .env.',
    );
  }

  return {
    apiKey: parsed.data.SPLITWISE_API_KEY,
    baseUrl: parsed.data.SPLITWISE_API_BASE_URL ?? DEFAULT_SPLITWISE_BASE_URL,
  };
}
