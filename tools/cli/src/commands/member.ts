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
    .option('--splitwise-group-id <id>', 'Splitwise group id for group settling')
    .action(
      async (opts: {
        account?: string;
        name: string;
        email?: string;
        phone?: string;
        lineType?: string;
        splitwiseId?: string;
        splitwiseGroupId?: string;
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
          splitwiseGroupId: opts.splitwiseGroupId,
        });
        console.log(`Added member: ${id}`);
      },
    );

  member
    .command('edit')
    .description('Edit an existing member')
    .requiredOption(
      '--member <memberId>',
      'Member id to edit (see `mobills member list`)',
    )
    .option('--name <name>', 'New member name')
    .option('--email <email>', 'New member email')
    .option('--phone <phone>', 'New member phone number')
    .option('--line-type <type>', "New line type: 'primary' or 'additional'")
    .option('--splitwise-id <id>', 'New Splitwise user id')
    .option('--splitwise-group-id <id>', 'New Splitwise group id for group settling')
    .option('--clear-email', 'Remove the email')
    .option('--clear-phone', 'Remove the phone number')
    .option('--clear-line-type', 'Remove the line type')
    .option('--clear-splitwise-id', 'Remove the Splitwise user id')
    .option('--clear-splitwise-group-id', 'Remove the Splitwise group id')
    .action(
      async (opts: {
        member: string;
        name?: string;
        email?: string;
        phone?: string;
        lineType?: string;
        splitwiseId?: string;
        splitwiseGroupId?: string;
        clearEmail?: boolean;
        clearPhone?: boolean;
        clearLineType?: boolean;
        clearSplitwiseId?: boolean;
        clearSplitwiseGroupId?: boolean;
      }) => {
        const conflicts: Array<[string, boolean | undefined, unknown]> = [
          ['--email/--clear-email', opts.clearEmail, opts.email],
          ['--phone/--clear-phone', opts.clearPhone, opts.phone],
          ['--line-type/--clear-line-type', opts.clearLineType, opts.lineType],
          [
            '--splitwise-id/--clear-splitwise-id',
            opts.clearSplitwiseId,
            opts.splitwiseId,
          ],
          [
            '--splitwise-group-id/--clear-splitwise-group-id',
            opts.clearSplitwiseGroupId,
            opts.splitwiseGroupId,
          ],
        ];
        for (const [pair, clear, value] of conflicts) {
          if (clear && value !== undefined) {
            throw new Error(`Use one of ${pair}, not both`);
          }
        }

        const updates: {
          name?: string;
          email?: string | null;
          phoneNumber?: string | null;
          lineType?: 'primary' | 'additional' | null;
          splitwiseUserId?: string | null;
          splitwiseGroupId?: string | null;
        } = {};

        if (opts.name !== undefined) {
          updates.name = opts.name;
        }
        if (opts.clearEmail) {
          updates.email = null;
        } else if (opts.email !== undefined) {
          updates.email = opts.email;
        }
        if (opts.clearPhone) {
          updates.phoneNumber = null;
        } else if (opts.phone !== undefined) {
          updates.phoneNumber = opts.phone;
        }
        if (opts.clearLineType) {
          updates.lineType = null;
        } else if (opts.lineType !== undefined) {
          updates.lineType = parseLineType(opts.lineType);
        }
        if (opts.clearSplitwiseId) {
          updates.splitwiseUserId = null;
        } else if (opts.splitwiseId !== undefined) {
          updates.splitwiseUserId = opts.splitwiseId;
        }
        if (opts.clearSplitwiseGroupId) {
          updates.splitwiseGroupId = null;
        } else if (opts.splitwiseGroupId !== undefined) {
          updates.splitwiseGroupId = opts.splitwiseGroupId;
        }

        if (Object.keys(updates).length === 0) {
          throw new Error('No fields provided to update');
        }

        const client = getConvexClient();
        const id = await client.mutation(api.members.updateMember, {
          memberId: opts.member as Id<'members'>,
          ...updates,
        });
        console.log(`Updated member: ${id}`);
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
          splitwiseGroupId: m.splitwiseGroupId ?? '',
        })),
      );
    });
}
