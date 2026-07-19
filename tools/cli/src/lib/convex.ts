import { ConvexHttpClient } from 'convex/browser';
import { getStoredToken } from './credentials.js';
import { loadEnv } from './env.js';

let cachedClient: ConvexHttpClient | null = null;

/**
 * Returns a ConvexHttpClient authenticated with the operator's Clerk session
 * token so Convex functions can read the identity via ctx.auth. The token is
 * resolved from the cached `mobills login` credentials first, then falls back
 * to the CLERK_SESSION_TOKEN environment variable.
 */
export function getConvexClient(): ConvexHttpClient {
  if (cachedClient) {
    return cachedClient;
  }

  const env = loadEnv();
  const token = getStoredToken() ?? env.CLERK_SESSION_TOKEN;
  if (!token) {
    throw new Error(
      'Not authenticated. Run `mobills login` to sign in, ' +
        'or set CLERK_SESSION_TOKEN in your .env.',
    );
  }

  const client = new ConvexHttpClient(env.CONVEX_URL);
  client.setAuth(token);
  cachedClient = client;
  return client;
}
