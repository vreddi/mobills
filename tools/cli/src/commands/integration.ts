import { password } from '@inquirer/prompts';
import { api } from '@mobills/convex';
import chalk from 'chalk';
import Table from 'cli-table3';
import { Command } from 'commander';
import ora from 'ora';
import { getConvexClient } from '../lib/convex.js';

function fullName(first: string, last: string | null): string {
  return `${first} ${last ?? ''}`.trim();
}

// Fail fast on a bad --base-url before hitting the backend. The authoritative
// check runs server-side in the Convex `connect` action; this mirrors it so the
// user gets a clear local error and never sends an unusable value.
function normalizeBaseUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('--base-url must be a valid URL');
  }
  if (url.protocol !== 'https:') {
    throw new Error('--base-url must use https://');
  }
  if (url.hostname !== 'secure.splitwise.com') {
    throw new Error('--base-url host must be secure.splitwise.com');
  }
  return url.toString().replace(/\/+$/, '');
}

export function registerIntegrationCommands(program: Command): void {
  const integration = program
    .command('integration')
    .description('Connect and manage third-party integrations (e.g. Splitwise)');

  integration
    .command('list')
    .description('Show configured integrations and their connection status')
    .action(async () => {
      const client = getConvexClient();
      const status = await client.query(api.splitwiseStore.status, {});
      const table = new Table({
        head: ['Integration', 'Status', 'Connected as', 'Connected'],
        style: { head: ['cyan'] },
      });
      table.push([
        'Splitwise',
        status.connected
          ? chalk.green('connected')
          : chalk.dim('not connected'),
        status.connected ? status.connectedAs : chalk.dim('—'),
        status.connected
          ? new Date(status.connectedAt).toLocaleString()
          : chalk.dim('—'),
      ]);
      console.log(`\n${table.toString()}\n`);
      console.log(
        chalk.dim(
          'Splitwise credentials are stored encrypted in the mobills backend, ' +
            'not on this machine.',
        ),
      );
      if (!status.connected) {
        console.log(
          'Run `mobills integration splitwise setup` to connect Splitwise.',
        );
      }
    });

  const splitwise = integration
    .command('splitwise')
    .description('Manage the Splitwise integration');

  splitwise
    .command('setup')
    .description('Connect your Splitwise account (stored encrypted server-side)')
    .option(
      '--api-key <key>',
      'Splitwise personal API key (prompts securely when omitted)',
    )
    .option('--base-url <url>', 'Override the Splitwise API base URL')
    .action(async (opts: { apiKey?: string; baseUrl?: string }) => {
      const client = getConvexClient();

      const baseUrl =
        opts.baseUrl !== undefined ? normalizeBaseUrl(opts.baseUrl) : undefined;

      const existing = await client.query(api.splitwiseStore.status, {});
      if (existing.connected) {
        console.log(
          chalk.yellow(
            `Splitwise is already connected as ${existing.connectedAs}. ` +
              'Continuing will overwrite the stored key.',
          ),
        );
      }

      const apiKey =
        opts.apiKey ??
        (await password({
          message:
            'Splitwise personal API key (create one at https://secure.splitwise.com/apps):',
          mask: '*',
          validate: (value) =>
            value.trim().length > 0 ? true : 'API key cannot be empty',
        }));

      const trimmed = apiKey.trim();
      if (trimmed.length === 0) {
        throw new Error('API key cannot be empty');
      }

      const spinner = ora('Verifying and storing Splitwise credentials').start();
      try {
        const result = await client.action(api.splitwise.connect, {
          apiKey: trimmed,
          baseUrl,
        });
        spinner.succeed(
          `Connected as ${result.connectedAs} (id ${result.splitwiseUserId})`,
        );
      } catch (error) {
        spinner.fail('Could not connect Splitwise');
        throw error;
      }
      console.log(
        'Stored your Splitwise key encrypted in the mobills backend. ' +
          'Nothing was written to this machine.',
      );
    });

  splitwise
    .command('status')
    .description('Verify the stored Splitwise credential still works')
    .action(async () => {
      const client = getConvexClient();
      const status = await client.query(api.splitwiseStore.status, {});
      if (!status.connected) {
        console.log(
          'Splitwise is not connected. Run `mobills integration splitwise setup`.',
        );
        return;
      }
      const spinner = ora('Checking Splitwise connection').start();
      try {
        const user = await client.action(api.splitwise.whoami, {});
        spinner.succeed(
          `Connected as ${fullName(user.first_name, user.last_name)} ` +
            `(id ${user.id}, ${user.email})`,
        );
      } catch (error) {
        spinner.fail('Splitwise credential is no longer valid');
        console.log(
          chalk.yellow(
            'Re-run `mobills integration splitwise setup` to reconnect.',
          ),
        );
        throw error;
      }
    });

  splitwise
    .command('remove')
    .description('Disconnect Splitwise and delete the stored credential')
    .action(async () => {
      const client = getConvexClient();
      const removed = await client.action(api.splitwise.disconnect, {});
      console.log(
        removed
          ? 'Splitwise disconnected. Stored credential removed from the backend.'
          : 'Splitwise was not connected.',
      );
    });

  splitwise
    .command('whoami')
    .description('Show the connected Splitwise user')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const client = getConvexClient();
      const user = await client.action(api.splitwise.whoami, {});
      if (opts.json) {
        console.log(JSON.stringify(user, null, 2));
        return;
      }
      console.log(
        `${fullName(user.first_name, user.last_name)} (id ${user.id}, ${user.email})`,
      );
    });

  splitwise
    .command('groups')
    .description("List the connected user's Splitwise groups")
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const client = getConvexClient();
      const groups = await client.action(api.splitwise.groups, {});
      if (opts.json) {
        console.log(JSON.stringify(groups, null, 2));
        return;
      }
      if (groups.length === 0) {
        console.log('No Splitwise groups found.');
        return;
      }
      const table = new Table({
        head: ['id', 'name', 'members'],
        style: { head: ['cyan'] },
      });
      for (const group of groups) {
        table.push([
          String(group.id),
          group.name,
          String(group.members?.length ?? 0),
        ]);
      }
      console.log(`\n${table.toString()}\n`);
    });

  splitwise
    .command('friends')
    .description("List the connected user's Splitwise friends")
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const client = getConvexClient();
      const friends = await client.action(api.splitwise.friends, {});
      if (opts.json) {
        console.log(JSON.stringify(friends, null, 2));
        return;
      }
      if (friends.length === 0) {
        console.log('No Splitwise friends found.');
        return;
      }
      const table = new Table({
        head: ['id', 'name', 'email'],
        style: { head: ['cyan'] },
      });
      for (const friend of friends) {
        table.push([
          String(friend.id),
          fullName(friend.first_name, friend.last_name),
          friend.email ?? '',
        ]);
      }
      console.log(`\n${table.toString()}\n`);
    });
}
