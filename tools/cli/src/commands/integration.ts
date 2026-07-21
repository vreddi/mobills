import { password } from '@inquirer/prompts';
import type {
  SplitwiseFriend,
  SplitwiseGroup,
} from '@mobills/integration-splitwise';
import { SplitwiseClient } from '@mobills/integration-splitwise';
import chalk from 'chalk';
import Table from 'cli-table3';
import { Command } from 'commander';
import ora from 'ora';
import {
  effectiveSecretStorage,
  integrationsPath,
  readSplitwiseMetadata,
  removeSplitwiseIntegration,
  saveSplitwiseIntegration,
} from '../lib/integrations.js';
import { getSplitwiseClient } from '../lib/splitwise.js';

function fullName(first: string, last: string | null): string {
  return `${first} ${last ?? ''}`.trim();
}

function describeStorage(storage: 'keychain' | 'file'): string {
  return storage === 'keychain'
    ? 'your OS keychain'
    : `${integrationsPath()} (mode 0600)`;
}

export function registerIntegrationCommands(program: Command): void {
  const integration = program
    .command('integration')
    .description('Connect and manage third-party integrations (e.g. Splitwise)');

  integration
    .command('list')
    .description('Show configured integrations and their connection status')
    .action(() => {
      const splitwise = readSplitwiseMetadata();
      const table = new Table({
        head: ['Integration', 'Status', 'Connected as', 'Key storage'],
        style: { head: ['cyan'] },
      });
      table.push([
        'Splitwise',
        splitwise ? chalk.green('connected') : chalk.dim('not connected'),
        splitwise?.connectedAs ?? chalk.dim('—'),
        splitwise
          ? effectiveSecretStorage(splitwise) === 'keychain'
            ? 'OS keychain'
            : 'config file (0600)'
          : chalk.dim('—'),
      ]);
      console.log(`\n${table.toString()}\n`);
      if (!splitwise) {
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
    .description('Connect your Splitwise account by storing a personal API key')
    .option(
      '--api-key <key>',
      'Splitwise personal API key (prompts securely when omitted)',
    )
    .option('--base-url <url>', 'Override the Splitwise API base URL')
    .action(async (opts: { apiKey?: string; baseUrl?: string }) => {
      const existing = readSplitwiseMetadata();
      if (existing) {
        console.log(
          chalk.yellow(
            `Splitwise is already connected${existing.connectedAs ? ` as ${existing.connectedAs}` : ''}. ` +
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

      const spinner = ora('Verifying Splitwise credentials').start();
      let connectedAs: string;
      let userId: number;
      try {
        const client = new SplitwiseClient({
          apiKey: trimmed,
          ...(opts.baseUrl ? { baseUrl: opts.baseUrl } : {}),
        });
        const user = await client.getCurrentUser();
        userId = user.id;
        connectedAs = fullName(user.first_name, user.last_name);
        spinner.succeed(`Connected as ${connectedAs} (id ${user.id})`);
      } catch (error) {
        spinner.fail('Could not verify the Splitwise API key');
        throw error;
      }

      const storage = await saveSplitwiseIntegration({
        apiKey: trimmed,
        baseUrl: opts.baseUrl,
        userId,
        connectedAs,
        connectedAt: Date.now(),
      });
      console.log(`Stored Splitwise API key in ${describeStorage(storage)}.`);
      if (storage === 'file') {
        console.log(
          chalk.dim(
            'OS keychain unavailable — fell back to the config file. ' +
              'Install a Secret Service (e.g. gnome-keyring) for encrypted storage.',
          ),
        );
      }
    });

  splitwise
    .command('status')
    .description('Verify the stored Splitwise credential still works')
    .action(async () => {
      const stored = readSplitwiseMetadata();
      if (!stored) {
        console.log(
          'Splitwise is not connected. Run `mobills integration splitwise setup`.',
        );
        return;
      }
      const spinner = ora('Checking Splitwise connection').start();
      try {
        const client = await getSplitwiseClient();
        const user = await client.getCurrentUser();
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
    .description('Remove the stored Splitwise credential')
    .action(async () => {
      const removed = await removeSplitwiseIntegration();
      console.log(
        removed
          ? 'Splitwise disconnected. Stored credential removed.'
          : 'Splitwise was not connected.',
      );
    });

  splitwise
    .command('whoami')
    .description('Show the connected Splitwise user')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { json?: boolean }) => {
      const user = await (await getSplitwiseClient()).getCurrentUser();
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
      const groups: SplitwiseGroup[] = await (
        await getSplitwiseClient()
      ).getGroups();
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
      const friends: SplitwiseFriend[] = await (
        await getSplitwiseClient()
      ).getFriends();
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
