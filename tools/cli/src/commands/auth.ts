import { Command } from 'commander';
import {
  clearCredentials,
  credentialsPath,
  readCredentials,
  saveToken,
} from '../lib/credentials.js';
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
    .description('Show the signed-in Clerk user from the cached token')
    .action(() => {
      const creds = readCredentials();
      if (!creds) {
        console.log('Not signed in. Run `mobills login`.');
        return;
      }
      const expired =
        creds.expiresAt !== undefined && creds.expiresAt <= Date.now();
      console.log(`Clerk user: ${creds.subject ?? '(unknown)'}`);
      if (creds.expiresAt !== undefined) {
        const label = expired ? 'expired' : 'valid until';
        console.log(`Token ${label} ${new Date(creds.expiresAt).toLocaleString()}`);
      }
      if (expired) {
        console.log('Token is expired \u2014 run `mobills login` to refresh.');
      }
    });
}
