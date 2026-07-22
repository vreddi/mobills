import { confirm, input } from '@inquirer/prompts';
import {
  centsToString,
  divideBill,
  toCents,
  type BillMemberInput,
} from '@mobills/billing';
import { api, type Doc, type Id } from '@mobills/convex';
import chalk from 'chalk';
import Table from 'cli-table3';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { resolveAccountId } from '../lib/accountPicker.js';
import { getConvexClient } from '../lib/convex.js';

type MemberDoc = Doc<'members'>;

/** Individual (non-shared) charge amounts for one member, in dollars. */
interface MemberCharges {
  individualTax: number;
  contractPlanEquipment: number;
  extra: number;
}

const money = z
  .number()
  .nonnegative('amounts must be zero or positive')
  .finite();

const billFileSchema = z.object({
  label: z.string().min(1).optional(),
  basePool: money.optional(),
  currencyCode: z.string().min(1).optional(),
  charges: z
    .array(
      z.object({
        member: z.string().min(1),
        individualTax: money.optional(),
        contractPlanEquipment: money.optional(),
        extra: money.optional(),
      }),
    )
    .optional(),
  exclude: z.array(z.string().min(1)).optional(),
});

type BillFile = z.infer<typeof billFileSchema>;

/** Last 10 digits of a phone number, for tolerant matching. */
function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(-10);
}

/**
 * Resolve a matcher (member id, phone number, or name) to exactly one account
 * member. Throws on no match or an ambiguous match so a typo never silently
 * charges the wrong person.
 */
function matchMember(members: MemberDoc[], matcher: string): MemberDoc {
  const needle = matcher.trim();

  const byId = members.find((m) => m._id === needle);
  if (byId) {
    return byId;
  }

  const digits = normalizePhone(needle);
  if (digits.length === 10) {
    const byPhone = members.filter(
      (m) => m.phoneNumber && normalizePhone(m.phoneNumber) === digits,
    );
    if (byPhone.length === 1) {
      return byPhone[0];
    }
    if (byPhone.length > 1) {
      throw new Error(`"${matcher}" matches multiple members by phone`);
    }
  }

  const byName = members.filter(
    (m) => m.name.trim().toLowerCase() === needle.toLowerCase(),
  );
  if (byName.length === 1) {
    return byName[0];
  }
  if (byName.length > 1) {
    throw new Error(
      `"${matcher}" matches multiple members by name; use the member id`,
    );
  }

  throw new Error(
    `No member matches "${matcher}". See \`mobills member list\`.`,
  );
}

function requireTty(action: string): void {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      `${action} requires an interactive terminal. Pass the values as flags ` +
        '(or --from-file / --yes) when running non-interactively.',
    );
  }
}

async function promptAmount(message: string): Promise<number> {
  const answer = await input({
    message,
    default: '0',
    validate: (value) => {
      const n = Number(value);
      if (Number.isNaN(n)) {
        return 'Enter a number';
      }
      if (n < 0) {
        return 'Amount cannot be negative';
      }
      return true;
    },
  });
  return Number(answer);
}

/**
 * Collect each member's individual charges interactively. For every member we
 * ask whether they have extra charges before prompting for the three amounts,
 * so a plain bill stays quick.
 */
async function collectChargesInteractively(
  members: MemberDoc[],
): Promise<Map<string, MemberCharges>> {
  const charges = new Map<string, MemberCharges>();
  for (const member of members) {
    const hasExtra = await confirm({
      message: `Does ${member.name} have individual charges (tax / equipment / extra)?`,
      default: false,
    });
    if (!hasExtra) {
      continue;
    }
    charges.set(member._id, {
      individualTax: await promptAmount(`  ${member.name} — individual tax`),
      contractPlanEquipment: await promptAmount(
        `  ${member.name} — contract / plan / equipment`,
      ),
      extra: await promptAmount(`  ${member.name} — extra`),
    });
  }
  return charges;
}

/** Build the per-member charge map from a parsed bill file. */
function chargesFromFile(
  file: BillFile,
  members: MemberDoc[],
): Map<string, MemberCharges> {
  const charges = new Map<string, MemberCharges>();
  for (const entry of file.charges ?? []) {
    const member = matchMember(members, entry.member);
    if (charges.has(member._id)) {
      throw new Error(`Duplicate charges for member "${member.name}"`);
    }
    charges.set(member._id, {
      individualTax: entry.individualTax ?? 0,
      contractPlanEquipment: entry.contractPlanEquipment ?? 0,
      extra: entry.extra ?? 0,
    });
  }
  return charges;
}

function loadBillFile(path: string): BillFile {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    throw new Error(`Could not read bill file: ${path}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Bill file is not valid JSON: ${path}`);
  }
  const parsed = billFileSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Bill file is invalid at "${issue.path.join('.') || '(root)'}": ${issue.message}`,
    );
  }
  return parsed.data;
}

function renderDivisionTable(division: ReturnType<typeof divideBill>): string {
  const table = new Table({
    head: [
      'Member',
      'Base',
      'Indi-Tax',
      'Contract/Plan/Equip',
      'Extra',
      'Total',
      '%',
    ],
    style: { head: ['cyan'] },
    colAligns: ['left', 'right', 'right', 'right', 'right', 'right', 'right'],
  });
  for (const m of division.members) {
    table.push([
      m.name,
      centsToString(m.baseShareCents),
      centsToString(m.individualTaxCents),
      centsToString(m.contractPlanEquipmentCents),
      centsToString(m.extraCents),
      chalk.bold(centsToString(m.totalCents)),
      `${(m.billValueBps / 100).toFixed(2)}%`,
    ]);
  }
  table.push([
    chalk.bold('All'),
    chalk.bold(centsToString(division.basePoolCents)),
    '',
    '',
    '',
    chalk.bold(centsToString(division.totalCents)),
    '100.00%',
  ]);
  return table.toString();
}

/** Build the members payload for createBill from the resolved charges. */
function buildCreateMembers(
  members: MemberDoc[],
  excluded: Set<string>,
  charges: Map<string, MemberCharges>,
): Array<{
  memberId: Id<'members'>;
  individualTaxCents: number;
  contractPlanEquipmentCents: number;
  extraCents: number;
}> {
  const participants = members.filter((m) => !excluded.has(m._id));
  if (participants.length === 0) {
    throw new Error('No members left on the bill after exclusions');
  }
  return participants.map((m) => {
    const c = charges.get(m._id);
    return {
      memberId: m._id,
      individualTaxCents: toCents(c?.individualTax ?? 0),
      contractPlanEquipmentCents: toCents(c?.contractPlanEquipment ?? 0),
      extraCents: toCents(c?.extra ?? 0),
    };
  });
}

/** Local preview of the division, mirroring what the server will persist. */
function previewDivision(
  members: MemberDoc[],
  createMembers: ReturnType<typeof buildCreateMembers>,
  basePoolCents: number,
  currencyCode: string,
): ReturnType<typeof divideBill> {
  const nameById = new Map(members.map((m) => [m._id, m.name]));
  const input: BillMemberInput[] = createMembers.map((m) => ({
    memberId: m.memberId,
    name: nameById.get(m.memberId) ?? m.memberId,
    individualTaxCents: m.individualTaxCents,
    contractPlanEquipmentCents: m.contractPlanEquipmentCents,
    extraCents: m.extraCents,
  }));
  return divideBill({ basePoolCents, currencyCode, members: input });
}

function postedLabel(bill: Doc<'bills'>): string {
  const splitwise = bill.postings.find((p) => p.integration === 'splitwise');
  if (!splitwise) {
    return chalk.dim('not posted');
  }
  return chalk.green(`splitwise #${splitwise.reference}`);
}

export function registerBillCommands(program: Command): void {
  const bill = program
    .command('bill')
    .description('Create, inspect, and post per-member bills');

  bill
    .command('create')
    .description('Divide a bill across members and save it after confirmation')
    .option(
      '--account <accountId>',
      'Account id (prompts a picker when omitted)',
    )
    .option('--label <label>', 'Bill label / cadence, e.g. "Jan 2025 0"')
    .option('--base <amount>', 'Shared base + base tax pool (e.g. 310.00)')
    .option('--currency <code>', 'ISO currency code (defaults to USD)')
    .option('--from-file <path>', 'Load base pool and charges from a JSON file')
    .option(
      '--exclude <matcher>',
      'Member (id / phone / name) to leave off this bill; repeatable',
      (value: string, previous: string[]) => [...previous, value],
      [],
    )
    .option('--yes', 'Skip the confirmation prompt')
    .action(
      async (opts: {
        account?: string;
        label?: string;
        base?: string;
        currency?: string;
        fromFile?: string;
        exclude: string[];
        yes?: boolean;
      }) => {
        const client = getConvexClient();
        const accountId = await resolveAccountId(client, opts.account);
        const members = (await client.query(api.members.listMembers, {
          accountId,
        })) as MemberDoc[];
        if (members.length === 0) {
          throw new Error(
            'This account has no members. Add some with `mobills member add`.',
          );
        }

        const file = opts.fromFile ? loadBillFile(opts.fromFile) : undefined;

        // Label: flag wins, then file, then interactive.
        let label = opts.label ?? file?.label;
        if (label === undefined) {
          requireTty('Creating a bill');
          label = await input({
            message: 'Bill label (e.g. "Jan 2025 0")',
            validate: (v) => (v.trim() ? true : 'Label cannot be empty'),
          });
        }

        const currencyCode = opts.currency ?? file?.currencyCode ?? 'USD';

        // Base pool: flag wins, then file, then interactive.
        let basePool: number;
        if (opts.base !== undefined) {
          basePool = Number(opts.base);
          if (Number.isNaN(basePool) || basePool < 0) {
            throw new Error('--base must be a non-negative number');
          }
        } else if (file?.basePool !== undefined) {
          basePool = file.basePool;
        } else {
          requireTty('Creating a bill');
          basePool = await promptAmount('Shared base + base tax pool');
        }

        const excluded = new Set(
          opts.exclude.map((m) => matchMember(members, m)._id),
        );
        for (const matcher of file?.exclude ?? []) {
          excluded.add(matchMember(members, matcher)._id);
        }

        // Charges: from file, else interactive per member.
        let charges: Map<string, MemberCharges>;
        if (file) {
          charges = chargesFromFile(file, members);
        } else {
          requireTty('Creating a bill');
          charges = await collectChargesInteractively(
            members.filter((m) => !excluded.has(m._id)),
          );
        }

        const createMembers = buildCreateMembers(members, excluded, charges);
        const division = previewDivision(
          members,
          createMembers,
          toCents(basePool),
          currencyCode,
        );

        console.log(
          `\n${chalk.bold(label)} — ${centsToString(division.totalCents)} ` +
            `${currencyCode} across ${division.memberCount} members\n`,
        );
        console.log(renderDivisionTable(division));

        if (!opts.yes) {
          requireTty('Confirming a bill');
          const ok = await confirm({
            message: 'Create this bill?',
            default: true,
          });
          if (!ok) {
            console.log('Aborted. No bill was created.');
            return;
          }
        }

        const billId = await client.mutation(api.bills.createBill, {
          accountId,
          label,
          currencyCode,
          basePoolCents: toCents(basePool),
          members: createMembers,
        });
        console.log(chalk.green(`\nCreated bill: ${billId}`));
        console.log(
          chalk.dim(
            'Post it to Splitwise with `mobills bill post --bill ' +
              `${billId}\`.`,
          ),
        );
      },
    );

  bill
    .command('list')
    .description('List bills on an account')
    .option(
      '--account <accountId>',
      'Account id (prompts a picker when omitted)',
    )
    .action(async (opts: { account?: string }) => {
      const client = getConvexClient();
      const accountId = await resolveAccountId(client, opts.account);
      const bills = (await client.query(api.bills.listBills, {
        accountId,
      })) as Doc<'bills'>[];
      if (bills.length === 0) {
        console.log('No bills found. Create one with `mobills bill create`.');
        return;
      }
      const table = new Table({
        head: ['id', 'label', 'total', 'members', 'posted', 'created'],
        style: { head: ['cyan'] },
      });
      for (const b of bills) {
        table.push([
          b._id,
          b.label,
          `${centsToString(b.totalCents)} ${b.currencyCode}`,
          String(b.lineItems.length),
          postedLabel(b),
          new Date(b.createdAt).toLocaleDateString(),
        ]);
      }
      console.log(`\n${table.toString()}\n`);
    });

  bill
    .command('show')
    .description('Show a bill and its per-member breakdown')
    .requiredOption('--bill <billId>', 'Bill id (see `mobills bill list`)')
    .action(async (opts: { bill: string }) => {
      const client = getConvexClient();
      const b = (await client.query(api.bills.getBill, {
        billId: opts.bill as Id<'bills'>,
      })) as Doc<'bills'>;

      console.log(
        `\n${chalk.bold(b.label)} — ${centsToString(b.totalCents)} ` +
          `${b.currencyCode} · ${postedLabel(b)}\n`,
      );
      const table = new Table({
        head: [
          'Member',
          'Base',
          'Indi-Tax',
          'Contract/Plan/Equip',
          'Extra',
          'Total',
        ],
        style: { head: ['cyan'] },
        colAligns: ['left', 'right', 'right', 'right', 'right', 'right'],
      });
      for (const item of b.lineItems) {
        table.push([
          item.name,
          centsToString(item.baseShareCents),
          centsToString(item.individualTaxCents),
          centsToString(item.contractPlanEquipmentCents),
          centsToString(item.extraCents),
          chalk.bold(centsToString(item.totalCents)),
        ]);
      }
      console.log(table.toString());
      if (b.postings.length > 0) {
        console.log('');
        for (const p of b.postings) {
          console.log(
            chalk.dim(
              `Posted to ${p.integration} (${p.reference}` +
                `${p.groupId ? `, group ${p.groupId}` : ''}) on ` +
                new Date(p.postedAt).toLocaleString(),
            ),
          );
        }
      }
      console.log('');
    });

  bill
    .command('post')
    .description('Post a bill to Splitwise as a single shared expense')
    .requiredOption('--bill <billId>', 'Bill id (see `mobills bill list`)')
    .option('--group <id>', 'Splitwise group id to post into')
    .option('--individual', 'Post as a friend-to-friend expense (no group)')
    .option('--dry-run', 'Preview the Splitwise split without posting')
    .option('--yes', 'Skip the confirmation prompt')
    .action(
      async (opts: {
        bill: string;
        group?: string;
        individual?: boolean;
        dryRun?: boolean;
        yes?: boolean;
      }) => {
        if (opts.group !== undefined && opts.individual) {
          throw new Error('Use either --group or --individual, not both');
        }
        const client = getConvexClient();
        const b = (await client.query(api.bills.getBill, {
          billId: opts.bill as Id<'bills'>,
        })) as Doc<'bills'>;

        if (b.postings.some((p) => p.integration === 'splitwise')) {
          throw new Error('This bill has already been posted to Splitwise.');
        }

        const members = (await client.query(api.members.listMembers, {
          accountId: b.accountId,
        })) as MemberDoc[];
        const membersById = new Map(members.map((m) => [m._id, m]));

        // Validate every line item maps to a member with a Splitwise id.
        const missing = b.lineItems.filter(
          (item) => !membersById.get(item.memberId)?.splitwiseUserId,
        );
        if (missing.length > 0) {
          throw new Error(
            'These members have no Splitwise id, so the bill cannot be ' +
              `posted: ${missing.map((m) => m.name).join(', ')}. Link them ` +
              'with `mobills member edit --splitwise-id <id>`.',
          );
        }

        // Resolve the target group the same way the backend will.
        let groupId: number | undefined;
        if (opts.individual) {
          groupId = 0;
        } else if (opts.group !== undefined) {
          groupId = Number(opts.group);
          if (!Number.isInteger(groupId) || groupId < 0) {
            throw new Error('--group must be a non-negative integer');
          }
        } else {
          const groupIds = new Set(
            b.lineItems.map(
              (item) => membersById.get(item.memberId)?.splitwiseGroupId ?? '',
            ),
          );
          groupId =
            groupIds.size === 1 && !groupIds.has('')
              ? Number([...groupIds][0])
              : 0;
        }

        console.log(
          `\n${chalk.bold(b.label)} — ${centsToString(b.totalCents)} ` +
            `${b.currencyCode}\n` +
            (groupId
              ? `Posting to Splitwise group ${groupId}`
              : 'Posting as an individual (friend-to-friend) expense'),
        );
        const table = new Table({
          head: ['Member', 'Splitwise id', 'Owes'],
          style: { head: ['cyan'] },
          colAligns: ['left', 'right', 'right'],
        });
        for (const item of b.lineItems) {
          table.push([
            item.name,
            membersById.get(item.memberId)?.splitwiseUserId ?? '',
            centsToString(item.totalCents),
          ]);
        }
        console.log(`\n${table.toString()}\n`);

        if (opts.dryRun) {
          console.log('Dry run — nothing was posted to Splitwise.');
          return;
        }

        if (!opts.yes) {
          requireTty('Confirming a Splitwise post');
          const ok = await confirm({
            message: 'Post this bill to Splitwise?',
            default: true,
          });
          if (!ok) {
            console.log('Aborted. Nothing was posted.');
            return;
          }
        }

        const result = await client.action(api.splitwise.postBill, {
          billId: opts.bill as Id<'bills'>,
          groupId,
        });
        console.log(
          chalk.green(
            `\nPosted to Splitwise: expense ${result.expenseId} ` +
              `(${result.cost} ${result.currencyCode}` +
              `${result.groupId ? `, group ${result.groupId}` : ''}).`,
          ),
        );
      },
    );
}
