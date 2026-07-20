import { api, type Id } from '@mobills/convex';
import { Command } from 'commander';
import { resolveAccountId } from '../lib/accountPicker.js';
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
    .command('edit')
    .description('Edit an existing T-Mobile tracking account')
    .option(
      '--account <accountId>',
      'Account id to edit (prompts a picker when omitted)',
    )
    .option('--name <name>', 'New display name for the account')
    .option('--account-number <number>', 'New T-Mobile account number')
    .option('--plan <plan>', 'New plan name')
    .option('--clear-account-number', 'Remove the T-Mobile account number')
    .option('--clear-plan', 'Remove the plan name')
    .action(
      async (opts: {
        account?: string;
        name?: string;
        accountNumber?: string;
        plan?: string;
        clearAccountNumber?: boolean;
        clearPlan?: boolean;
      }) => {
        if (opts.accountNumber !== undefined && opts.clearAccountNumber) {
          throw new Error(
            'Use either --account-number or --clear-account-number, not both',
          );
        }
        if (opts.plan !== undefined && opts.clearPlan) {
          throw new Error('Use either --plan or --clear-plan, not both');
        }

        const updates: {
          name?: string;
          tmobileAccountNumber?: string | null;
          planName?: string | null;
        } = {};

        if (opts.name !== undefined) {
          updates.name = opts.name;
        }
        if (opts.clearAccountNumber) {
          updates.tmobileAccountNumber = null;
        } else if (opts.accountNumber !== undefined) {
          updates.tmobileAccountNumber = opts.accountNumber;
        }
        if (opts.clearPlan) {
          updates.planName = null;
        } else if (opts.plan !== undefined) {
          updates.planName = opts.plan;
        }

        if (Object.keys(updates).length === 0) {
          throw new Error('No fields provided to update');
        }

        const client = getConvexClient();
        const accountId = await resolveAccountId(client, opts.account);
        const id = await client.mutation(api.accounts.updateAccount, {
          accountId,
          ...updates,
        });
        console.log(`Updated account: ${id}`);
      },
    );

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
