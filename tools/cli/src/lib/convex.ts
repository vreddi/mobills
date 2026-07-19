import { ConvexHttpClient } from 'convex/browser';
import { loadEnv } from './env.js';

let cachedClient: ConvexHttpClient | null = null;

/**
 * Returns a ConvexHttpClient authenticated with the Clerk session token so
 * Convex functions can read the operator's identity via ctx.auth.
 */
export function getConvexClient(): ConvexHttpClient {
  if (cachedClient) {
    return cachedClient;
  }

  const env = loadEnv();
  const client = new ConvexHttpClient(env.CONVEX_URL);
  client.setAuth(env.CLERK_SESSION_TOKEN);
  cachedClient = client;
  return client;
}
