/**
 * Splitwise configuration loaded from the environment.
 *
 * Authentication uses a Splitwise personal API key (a Bearer token you create
 * under "Your apps" at https://secure.splitwise.com/apps). This is the simplest
 * option for a personal/operator tool; OAuth can be layered on later.
 */
import { z } from 'zod';

export const DEFAULT_SPLITWISE_BASE_URL = 'https://secure.splitwise.com/api/v3.0';

/** The only host the Splitwise REST API is served from. */
export const SPLITWISE_API_HOST = 'secure.splitwise.com';

/**
 * Validate and normalize a user-supplied Splitwise base URL. Because this value
 * is persisted and later used to make server-side requests (with the decrypted
 * API key attached), it is a trust boundary: an unvalidated URL is an SSRF and
 * plaintext-credential-leak vector. Only `https://` URLs on the canonical
 * Splitwise host are allowed; the trailing slash is trimmed.
 */
export function normalizeSplitwiseBaseUrl(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(`Splitwise base URL must be a valid URL: ${baseUrl}`);
  }
  if (url.protocol !== 'https:') {
    throw new Error('Splitwise base URL must use https://');
  }
  if (url.hostname !== SPLITWISE_API_HOST) {
    throw new Error(
      `Splitwise base URL host must be ${SPLITWISE_API_HOST}, got ${url.hostname}`,
    );
  }
  return url.toString().replace(/\/+$/, '');
}

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
