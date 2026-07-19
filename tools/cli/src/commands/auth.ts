import chalk from 'chalk';
import Table from 'cli-table3';
import { Command } from 'commander';
import ora from 'ora';
import {
  clearCredentials,
  credentialsPath,
  readCredentials,
  saveToken,
} from '../lib/credentials.js';
import { fetchClerkUser } from '../lib/clerkUser.js';
import { browserLogin } from '../lib/login.js';

export function registerAuthCommands(program: Command): void {
  program
    .command('login')
    .description('Sign in with Clerk in your browser and cache a session token')
    .option('--timeout <seconds>', 'How long to wait for sign-in', '300')
    .action(async (opts: { timeout: string }) => {
      const timeoutSeconds = Number(opts.timeout);
      const timeoutMs = Number.isFinite(timeoutSeconds)
        ? timeoutSeconds * 1000
        : undefined;

      const token = await browserLogin({ timeoutMs });
      const creds = saveToken(token);

      if (creds.expiresAt !== undefined) {
        console.log(
          `\nSigned in \u2713  (token expires ${new Date(creds.expiresAt).toLocaleString()})`,
        );
      } else {
        console.log('\nSigned in \u2713');
      }
      console.log(`Saved credentials to ${credentialsPath()}`);
    });

  program
    .command('logout')
    .description('Remove cached Clerk credentials')
    .action(() => {
      const removed = clearCredentials();
      console.log(
        removed
          ? 'Logged out. Cached credentials removed.'
          : 'No cached credentials to remove.',
      );
    });

  program
    .command('whoami')
    .description('Show details about the signed-in user')
    .action(async () => {
      const creds = readCredentials();
      if (!creds) {
        console.log('Not signed in. Run `mobills login`.');
        return;
      }

      const spinner = ora('Fetching account details').start();
      const profile = creds.subject
        ? await fetchClerkUser(creds.subject)
        : null;
      spinner.stop();

      const expired =
        creds.expiresAt !== undefined && creds.expiresAt <= Date.now();

      const name = profile?.name ?? creds.name ?? chalk.dim('(unknown)');
      const email = profile?.email ?? creds.email ?? chalk.dim('(unknown)');
      const signInMethod = profile?.signInMethod ?? chalk.dim('(unknown)');
      const status = expired
        ? chalk.red('expired')
        : chalk.green('signed in');
      const tokenLine = creds.expiresAt
        ? `${expired ? 'expired' : 'valid until'} ${new Date(creds.expiresAt).toLocaleString()}`
        : 'unknown expiry';

      const table = new Table({
        style: { head: ['cyan'] },
      });
      table.push(
        [chalk.bold('Name'), name],
        [chalk.bold('Email'), email],
        [chalk.bold('Signed in via'), signInMethod],
        [chalk.bold('Status'), status],
        [chalk.bold('Session'), tokenLine],
        [chalk.bold('User ID'), chalk.dim(creds.subject ?? '(unknown)')],
      );

      console.log(`\n${table.toString()}\n`);
      if (expired) {
        console.log(chalk.yellow('Token is expired \u2014 run `mobills login` to refresh.'));
      }
    });
}
