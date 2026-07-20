import { api, type Id } from '@mobills/convex';
import { Command } from 'commander';
import { resolveAccountId } from '../lib/accountPicker.js';
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

export function registerMemberCommands(program: Command): void {
  const member = program
    .command('member')
    .description('Manage members on a tracking account');

  member
    .command('add')
    .description('Add a member to an account')
    .option(
      '--account <accountId>',
      'Account id to add the member to (prompts a picker when omitted)',
    )
    .requiredOption('--name <name>', 'Member name')
    .option('--email <email>', 'Member email')
    .option('--phone <phone>', 'Member phone number')
    .option('--line-type <type>', "Line type: 'primary' or 'additional'")
    .option('--splitwise-id <id>', 'Splitwise user id')
    .action(
      async (opts: {
        account?: string;
        name: string;
        email?: string;
        phone?: string;
        lineType?: string;
        splitwiseId?: string;
      }) => {
        const client = getConvexClient();
        const accountId = await resolveAccountId(client, opts.account);
        const id = await client.mutation(api.members.addMember, {
          accountId,
          name: opts.name,
          email: opts.email,
          phoneNumber: opts.phone,
          lineType: parseLineType(opts.lineType),
          splitwiseUserId: opts.splitwiseId,
        });
        console.log(`Added member: ${id}`);
      },
    );

  member
    .command('list')
    .description('List members on an account')
    .option(
      '--account <accountId>',
      'Account id to list members for (prompts a picker when omitted)',
    )
    .action(async (opts: { account?: string }) => {
      const client = getConvexClient();
      const accountId = await resolveAccountId(client, opts.account);
      const members = await client.query(api.members.listMembers, {
        accountId,
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
          splitwiseId: m.splitwiseUserId ?? '',
        })),
      );
    });
}
