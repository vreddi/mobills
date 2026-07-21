import {
  DEFAULT_SPLITWISE_BASE_URL,
  SplitwiseClient,
} from '@mobills/integration-splitwise';
import { readSplitwiseIntegration } from './integrations.js';

/**
 * Builds a Splitwise client from the stored `mobills integration` credential,
 * falling back to the legacy `SPLITWISE_API_KEY` environment variable so
 * existing `.env`-based setups keep working. Throws a helpful error when
 * Splitwise has not been connected yet.
 */
export async function getSplitwiseClient(): Promise<SplitwiseClient> {
  const stored = await readSplitwiseIntegration();
  if (stored?.apiKey) {
    return new SplitwiseClient({
      apiKey: stored.apiKey,
      baseUrl: stored.baseUrl ?? DEFAULT_SPLITWISE_BASE_URL,
    });
  }

  const envKey = process.env.SPLITWISE_API_KEY;
  if (envKey && envKey.length > 0) {
    return new SplitwiseClient({
      apiKey: envKey,
      baseUrl: process.env.SPLITWISE_API_BASE_URL ?? DEFAULT_SPLITWISE_BASE_URL,
    });
  }

  throw new Error(
    'Splitwise is not connected. Run `mobills integration setup splitwise` ' +
      'to connect your Splitwise account (get a personal API key at ' +
      'https://secure.splitwise.com/apps).',
  );
}
