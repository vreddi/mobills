#!/usr/bin/env node
/**
 * Standalone runner for exercising the Splitwise capabilities from a terminal.
 *
 * This is intentionally SEPARATE from the `mobills` CLI (tools/cli). It exists so
 * the capabilities in this package can be invoked and verified today, without
 * wiring them into the main CLI command tree yet.
 *
 *   pnpm --filter @mobills/integration-splitwise demo -- whoami
 *   pnpm --filter @mobills/integration-splitwise demo -- create-expense \
 *     --description "T-Mobile — March 2026" --cost 180 --split percentage \
 *     --payer 111 -p 111:40 -p 222:30 -p 333:30 --dry-run
 */
import { Command, Option } from 'commander';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SplitwiseClient } from './client.js';
import { configFromEnv } from './config.js';
import { createSharedExpense, prepareSharedExpense } from './expenses.js';
import type {
  ExactParticipant,
  Participant,
  PercentageParticipant,
  Split,
} from './types.js';

function loadEnvFiles(): void {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      break;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      dir = process.cwd();
      break;
    }
    dir = parent;
  }
  for (const file of ['.env', '.env.local']) {
    const path = resolve(dir, file);
    if (existsSync(path)) {
      loadDotenv({ path, override: file === '.env.local' });
    }
  }
}

/** Accumulate repeatable `--participant` options. */
function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

/** Parse a `id-or-email[:value]` spec into its parts. */
function parseSpec(spec: string): { participant: Participant; value?: number } {
  const [idPart, valuePart] = spec.split(':');
  const participant: Participant = {};
  if (/^\d+$/.test(idPart)) {
    participant.userId = Number(idPart);
  } else if (idPart.includes('@')) {
    participant.email = idPart;
  } else {
    throw new Error(
      `Participant "${spec}" must start with a numeric userId or an email`,
    );
  }
  const value = valuePart === undefined ? undefined : Number(valuePart);
  if (value !== undefined && Number.isNaN(value)) {
    throw new Error(`Participant "${spec}" has a non-numeric value`);
  }
  return { participant, value };
}

function buildSplit(
  kind: string,
  specs: string[],
  payer: number | undefined,
): Split {
  if (specs.length === 0) {
    throw new Error('Provide at least one --participant');
  }
  const parsed = specs.map(parseSpec);

  if (kind === 'equal') {
    return {
      kind: 'equal',
      payerUserId: payer,
      participants: parsed.map((p) => p.participant),
    };
  }
  if (kind === 'percentage') {
    return {
      kind: 'percentage',
      payerUserId: payer,
      participants: parsed.map<PercentageParticipant>((p) => {
        if (p.value === undefined) {
          throw new Error('percentage split needs userId:percent for each -p');
        }
        return { ...p.participant, percent: p.value };
      }),
    };
  }
  if (kind === 'exact') {
    return {
      kind: 'exact',
      payerUserId: payer,
      participants: parsed.map<ExactParticipant>((p) => {
        if (p.value === undefined) {
          throw new Error('exact split needs userId:amount for each -p');
        }
        return { ...p.participant, amount: p.value };
      }),
    };
  }
  throw new Error(`Unknown --split kind: ${kind}`);
}

interface ExpenseOpts {
  description: string;
  cost: string;
  currency: string;
  group?: string;
  split: string;
  payer?: string;
  participant: string[];
  details?: string;
  date?: string;
  dryRun?: boolean;
}

const program = new Command();
program
  .name('splitwise')
  .description('Standalone runner for the @mobills/integration-splitwise capabilities');

program
  .command('whoami')
  .description('Verify credentials by fetching the authenticated Splitwise user')
  .action(async () => {
    const client = SplitwiseClient.fromConfig(configFromEnv());
    const user = await client.getCurrentUser();
    console.log(
      `Authenticated as ${user.first_name} ${user.last_name ?? ''}`.trim() +
        ` (id ${user.id}, ${user.email})`,
    );
  });

program
  .command('create-expense')
  .description('Create an individual or group expense split across participants')
  .requiredOption('--description <text>', 'Expense description')
  .requiredOption('--cost <amount>', 'Total cost (major units, e.g. 180.00)')
  .option('--currency <code>', 'ISO currency code', 'USD')
  .option('--group <id>', 'Splitwise group id (omit for an individual expense)')
  .addOption(
    new Option('--split <kind>', 'How to divide the cost')
      .choices(['equal', 'percentage', 'exact'])
      .default('equal'),
  )
  .option('--payer <userId>', 'Splitwise userId of who paid (defaults to first)')
  .option(
    '-p, --participant <spec>',
    'Participant as userId-or-email[:value]; repeatable',
    collect,
    [],
  )
  .option('--details <text>', 'Optional notes stored on the expense')
  .option('--date <iso>', 'Optional ISO-8601 date the expense occurred')
  .option('--dry-run', 'Compute and print the split without posting to Splitwise')
  .action(async (opts: ExpenseOpts) => {
    const cost = Number(opts.cost);
    if (Number.isNaN(cost)) {
      throw new Error('--cost must be a number');
    }
    const payer = opts.payer === undefined ? undefined : Number(opts.payer);
    if (payer !== undefined && Number.isNaN(payer)) {
      throw new Error('--payer must be a numeric userId');
    }
    const split = buildSplit(opts.split, opts.participant, payer);

    const input = {
      description: opts.description,
      cost,
      currencyCode: opts.currency,
      groupId: opts.group === undefined ? undefined : Number(opts.group),
      details: opts.details,
      date: opts.date,
      split,
    };

    const prepared = prepareSharedExpense(input);
    console.log(
      `\n${prepared.description} — ${prepared.cost} ${prepared.currencyCode}` +
        ` (group ${prepared.groupId})`,
    );
    console.table(
      prepared.users.map((u) => ({
        user: u.userId ?? u.email ?? '',
        paid: u.paidShare,
        owed: u.owedShare,
      })),
    );

    if (opts.dryRun) {
      console.log('\nDry run — nothing was posted to Splitwise.');
      return;
    }

    const client = SplitwiseClient.fromConfig(configFromEnv());
    const expense = await createSharedExpense(client, input);
    console.log(`\nCreated Splitwise expense: ${expense.id}`);
  });

async function main(): Promise<void> {
  loadEnvFiles();
  // `pnpm run <script> -- <args>` forwards a literal `--`; drop leading ones so
  // both `pnpm --filter @mobills/integration-splitwise demo -- whoami` and a direct
  // `tsx src/run.ts whoami` invocation behave the same.
  const args = process.argv.slice(2);
  while (args[0] === '--') {
    args.shift();
  }
  try {
    await program.parseAsync(args, { from: 'user' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nError: ${message}`);
    process.exitCode = 1;
  }
}

void main();
