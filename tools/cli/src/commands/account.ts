import { api, type Id } from '@mobills/convex';
import { Command } from 'commander';
import { getConvexClient } from '../lib/convex.js';

export function registerAccountCommands(program: Command): void {
  const account = program
    .command('account')
    .description('Manage T-Mobile tracking accounts');

  account
    .command('create')
    .description('Create a new T-Mobile tracking account')
    .requiredOption('--name <name>', 'Display name for the account')
    .option('--account-number <number>', 'T-Mobile account number')
    .option('--plan <plan>', 'Plan name')
    .action(async (opts: { name: string; accountNumber?: string; plan?: string }) => {
      const client = getConvexClient();
      const id = await client.mutation(api.accounts.createAccount, {
        name: opts.name,
        tmobileAccountNumber: opts.accountNumber,
        planName: opts.plan,
      });
      console.log(`Created account: ${id}`);
    });

  account
    .command('list')
    .description('List accounts you own')
    .action(async () => {
      const client = getConvexClient();
      const accounts = await client.query(api.accounts.listAccounts, {});
      if (accounts.length === 0) {
        console.log('No accounts found.');
        return;
      }
      console.table(
        accounts.map((a) => ({
          id: a._id as Id<'accounts'>,
          name: a.name,
          accountNumber: a.tmobileAccountNumber ?? '',
          plan: a.planName ?? '',
          createdAt: new Date(a.createdAt).toISOString(),
        })),
      );
    });
}
