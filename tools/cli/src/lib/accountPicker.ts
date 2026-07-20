import { select } from '@inquirer/prompts';
import { api, type Id } from '@mobills/convex';
import type { ConvexHttpClient } from 'convex/browser';

type AccountSummary = {
  _id: string;
  name: string;
  tmobileAccountNumber?: string;
  planName?: string;
};

function describeAccount(account: AccountSummary): string {
  const details = [
    account.tmobileAccountNumber
      ? `#${account.tmobileAccountNumber}`
      : undefined,
    account.planName,
  ].filter((part): part is string => Boolean(part));

  return details.length > 0
    ? `${account.name} (${details.join(', ')})`
    : account.name;
}

/**
 * Resolves the account id to operate on. When `provided` is set it is returned
 * as-is. Otherwise the operator's accounts are fetched and shown in an
 * interactive picker (listed by name) so a single account can be selected.
 *
 * Throws a helpful error when there are no accounts, or when the picker cannot
 * run because the session is non-interactive (no TTY, e.g. piped or CI).
 */
export async function resolveAccountId(
  client: ConvexHttpClient,
  provided?: string,
): Promise<Id<'accounts'>> {
  if (provided !== undefined) {
    return provided as Id<'accounts'>;
  }

  const accounts = (await client.query(
    api.accounts.listAccounts,
    {},
  )) as AccountSummary[];

  if (accounts.length === 0) {
    throw new Error(
      'No accounts found. Create one first with `mobills account create`.',
    );
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'No --account provided and no interactive terminal is available to pick ' +
        'one. Pass --account <accountId> (see `mobills account list`).',
    );
  }

  return await select<Id<'accounts'>>({
    message: 'Select an account',
    choices: accounts.map((account) => ({
      name: describeAccount(account),
      value: account._id as Id<'accounts'>,
    })),
  });
}
