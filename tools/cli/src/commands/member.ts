import { api, type Id } from '@mobills/convex';
import { Command } from 'commander';
import { getConvexClient } from '../lib/convex.js';

function parseLineType(value?: string): 'primary' | 'additional' | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== 'primary' && value !== 'additional') {
    throw new Error("--line-type must be either 'primary' or 'additional'");
  }
  return value;
}

function parseMonthlyShare(value?: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error('--monthly-share must be a number');
  }
  return parsed;
}

export function registerMemberCommands(program: Command): void {
  const member = program
    .command('member')
    .description('Manage members on a tracking account');

  member
    .command('add')
    .description('Add a member to an account')
    .requiredOption('--account <accountId>', 'Account id to add the member to')
    .requiredOption('--name <name>', 'Member name')
    .option('--email <email>', 'Member email')
    .option('--phone <phone>', 'Member phone number')
    .option('--line-type <type>', "Line type: 'primary' or 'additional'")
    .option('--monthly-share <amount>', 'Monthly share amount (number)')
    .option('--splitwise-id <id>', 'Splitwise user id')
    .action(
      async (opts: {
        account: string;
        name: string;
        email?: string;
        phone?: string;
        lineType?: string;
        monthlyShare?: string;
        splitwiseId?: string;
      }) => {
        const client = getConvexClient();
        const id = await client.mutation(api.members.addMember, {
          accountId: opts.account as Id<'accounts'>,
          name: opts.name,
          email: opts.email,
          phoneNumber: opts.phone,
          lineType: parseLineType(opts.lineType),
          monthlyShare: parseMonthlyShare(opts.monthlyShare),
          splitwiseUserId: opts.splitwiseId,
        });
        console.log(`Added member: ${id}`);
      },
    );

  member
    .command('list')
    .description('List members on an account')
    .requiredOption('--account <accountId>', 'Account id to list members for')
    .action(async (opts: { account: string }) => {
      const client = getConvexClient();
      const members = await client.query(api.members.listMembers, {
        accountId: opts.account as Id<'accounts'>,
      });
      if (members.length === 0) {
        console.log('No members found.');
        return;
      }
      console.table(
        members.map((m) => ({
          id: m._id as Id<'members'>,
          name: m.name,
          email: m.email ?? '',
          phone: m.phoneNumber ?? '',
          lineType: m.lineType ?? '',
          monthlyShare: m.monthlyShare ?? '',
          splitwiseId: m.splitwiseUserId ?? '',
        })),
      );
    });
}
